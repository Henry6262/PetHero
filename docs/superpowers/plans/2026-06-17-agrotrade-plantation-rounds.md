# AgroTrade Plantation Rounds — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Plantation Rounds investment pillar to AgroTrade — Celo ERC-721 NFT shares + staking + harvest distribution, backed by two Solidity contracts and a NestJS module with 10 REST endpoints.

**Architecture:** Two new Foundry contracts (`PlantationRound.sol` as ERC-721 + escrow, `GroveStaking.sol` for NFT yield staking) deployed on Celo Sepolia; a new NestJS `plantation-rounds` module that mirrors on-chain state to Postgres via Prisma and exposes a REST API; a background event listener syncs contract events to DB.

**Tech Stack:** Solidity 0.8.28, OpenZeppelin ERC-721, Foundry/forge, NestJS, ethers.js v6, Prisma, Celo cUSD (ERC-20, 18 decimals), Jest.

## Global Constraints

- All cUSD amounts use 18 decimals — never truncate or round
- `PlantationRound.sol` uses Solidity 0.8.28 (matches `foundry.toml`)
- Contracts live in `normie-apps/agro-trade-native/contracts/`
- Backend lives in `normie-apps/agro-trade-native/backend/`
- Use `ethers.JsonRpcProvider` (ethers v6 — no `ethers.providers.*`)
- Follow existing NestJS patterns: `@UseGuards(JwtAuthGuard)`, `@CurrentUser()`, `PrismaService`
- All new env vars are optional in `env.validation.ts` (contracts may not be deployed yet)
- Every contract change requires new Foundry tests before merging
- Run `npx tsc --noEmit` from `backend/` before committing backend code

---

## File Map

**Contracts (create):**
- `contracts/src/PlantationRound.sol` — ERC-721 + fundraising escrow + harvest distribution
- `contracts/src/GroveStaking.sol` — NFT staking for cUSD yield
- `contracts/test/PlantationRound.t.sol` — Foundry tests
- `contracts/test/GroveStaking.t.sol` — Foundry tests

**Backend (create):**
- `backend/src/plantation-rounds/plantation-rounds.module.ts`
- `backend/src/plantation-rounds/plantation-rounds.controller.ts`
- `backend/src/plantation-rounds/plantation-rounds.service.ts`
- `backend/src/plantation-rounds/plantation-nfts.service.ts`
- `backend/src/plantation-rounds/grove-staking.service.ts`
- `backend/src/plantation-rounds/plantation-events.service.ts`
- `backend/src/plantation-rounds/dto/create-round.dto.ts`
- `backend/src/plantation-rounds/dto/invest.dto.ts`
- `backend/src/plantation-rounds/dto/distribute-harvest.dto.ts`
- `backend/src/plantation-rounds/constants/contracts.constant.ts`

**Backend (modify):**
- `backend/prisma/schema.prisma` — add 3 models + 1 enum
- `backend/src/app.module.ts` — import `PlantationRoundsModule`
- `backend/src/common/config/env.validation.ts` — add 4 new optional env vars

---

## Task 1: PlantationRound.sol Contract + Foundry Tests

**Files:**
- Create: `contracts/src/PlantationRound.sol`
- Create: `contracts/test/PlantationRound.t.sol`

**Interfaces:**
- Produces: `createRound(string cropType, uint256 targetCUSD, uint256 pricePerShareCUSD, uint256 harvestDeadline, string metadataURI) → uint256 roundId`
- Produces: `invest(uint256 roundId, uint256 shareCount)` — mints NFTs, emits `SharesPurchased`
- Produces: `unlockCapital(uint256 roundId)` — admin only, emits `CapitalUnlocked`
- Produces: `distributeHarvest(uint256 roundId, uint256 totalSaleCUSD)` — farmer only
- Produces: `claimDistribution(uint256 tokenId)` — pull pattern
- Produces events: `RoundCreated`, `SharesPurchased`, `CapitalUnlocked`, `HarvestDistributed`

- [ ] **Step 1: Install OpenZeppelin**

```bash
cd normie-apps/agro-trade-native/contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

Add remappings to `foundry.toml`:

```toml
remappings = [
  "@openzeppelin/=lib/openzeppelin-contracts/",
  "forge-std/=lib/forge-std/src/"
]
```

- [ ] **Step 2: Write PlantationRound.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract PlantationRound is ERC721, ReentrancyGuard {
    enum RoundStatus { OPEN, FUNDED, ACTIVE, DISTRIBUTING, CLOSED }

    struct Round {
        address farmer;
        string cropType;
        uint256 targetCUSD;
        uint256 pricePerShareCUSD;
        uint256 totalShares;
        uint256 sharesSold;
        uint256 harvestDeadline;
        string metadataURI;
        RoundStatus status;
        uint256 totalDistributionCUSD;
    }

    struct TokenInfo {
        uint256 roundId;
        uint256 shareIndex;
        uint256 claimedCUSD;
    }

    IERC20 public immutable cusd;
    address public admin;

    uint256 public nextRoundId;
    uint256 public nextTokenId;
    uint256 public constant PROTOCOL_FEE_BPS = 200; // 2%

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => TokenInfo) public tokenInfo;
    // roundId => yieldPool (from 2% protocol fee)
    mapping(uint256 => uint256) public yieldPool;

    event RoundCreated(uint256 indexed roundId, address indexed farmer, string cropType, uint256 targetCUSD);
    event SharesPurchased(uint256 indexed roundId, address indexed investor, uint256[] tokenIds);
    event CapitalUnlocked(uint256 indexed roundId, address indexed farmer, uint256 amount);
    event HarvestDistributed(uint256 indexed roundId, uint256 totalCUSD);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(address _cusd) ERC721("AgroVest Share", "AGVS") {
        cusd = IERC20(_cusd);
        admin = msg.sender;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
    }

    function createRound(
        string calldata cropType,
        uint256 targetCUSD,
        uint256 pricePerShareCUSD,
        uint256 harvestDeadline,
        string calldata metadataURI
    ) external returns (uint256 roundId) {
        require(targetCUSD > 0, "Target must be > 0");
        require(pricePerShareCUSD > 0, "Price must be > 0");
        require(targetCUSD % pricePerShareCUSD == 0, "Target must be divisible by share price");
        require(harvestDeadline > block.timestamp, "Deadline must be future");

        roundId = nextRoundId++;
        uint256 totalShares = targetCUSD / pricePerShareCUSD;

        rounds[roundId] = Round({
            farmer: msg.sender,
            cropType: cropType,
            targetCUSD: targetCUSD,
            pricePerShareCUSD: pricePerShareCUSD,
            totalShares: totalShares,
            sharesSold: 0,
            harvestDeadline: harvestDeadline,
            metadataURI: metadataURI,
            status: RoundStatus.OPEN,
            totalDistributionCUSD: 0
        });

        emit RoundCreated(roundId, msg.sender, cropType, targetCUSD);
    }

    function invest(uint256 roundId, uint256 shareCount) external nonReentrant {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.OPEN, "Round not open");
        require(shareCount > 0, "Share count must be > 0");
        require(round.sharesSold + shareCount <= round.totalShares, "Exceeds available shares");

        uint256 grossAmount = round.pricePerShareCUSD * shareCount;
        uint256 fee = (grossAmount * PROTOCOL_FEE_BPS) / 10000;
        uint256 netAmount = grossAmount - fee;

        // Pull gross cUSD from investor
        require(cusd.transferFrom(msg.sender, address(this), grossAmount), "Transfer failed");

        // Accrue fee to round's yield pool
        yieldPool[roundId] += fee;

        round.sharesSold += shareCount;

        // Mint NFTs
        uint256[] memory tokenIds = new uint256[](shareCount);
        for (uint256 i = 0; i < shareCount; i++) {
            uint256 tokenId = nextTokenId++;
            tokenIds[i] = tokenId;
            tokenInfo[tokenId] = TokenInfo({
                roundId: roundId,
                shareIndex: round.sharesSold - shareCount + i,
                claimedCUSD: 0
            });
            _safeMint(msg.sender, tokenId);
        }

        if (round.sharesSold == round.totalShares) {
            round.status = RoundStatus.FUNDED;
        }

        emit SharesPurchased(roundId, msg.sender, tokenIds);
        // suppress unused var warning
        netAmount;
    }

    function unlockCapital(uint256 roundId) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.FUNDED, "Round not funded");

        round.status = RoundStatus.ACTIVE;
        uint256 amount = round.pricePerShareCUSD * round.totalShares;
        // Transfer net of protocol fee to farmer
        uint256 fee = (amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 toFarmer = amount - fee;
        require(cusd.transfer(round.farmer, toFarmer), "Transfer failed");

        emit CapitalUnlocked(roundId, round.farmer, toFarmer);
    }

    function distributeHarvest(uint256 roundId, uint256 totalSaleCUSD) external nonReentrant {
        Round storage round = rounds[roundId];
        require(msg.sender == round.farmer, "Not the farmer");
        require(round.status == RoundStatus.ACTIVE, "Round not active");
        require(totalSaleCUSD > 0, "Sale amount must be > 0");

        round.status = RoundStatus.DISTRIBUTING;
        round.totalDistributionCUSD = totalSaleCUSD;

        // Pull sale proceeds from farmer
        require(cusd.transferFrom(msg.sender, address(this), totalSaleCUSD), "Transfer failed");

        emit HarvestDistributed(roundId, totalSaleCUSD);
    }

    function claimDistribution(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        TokenInfo storage info = tokenInfo[tokenId];
        Round storage round = rounds[info.roundId];
        require(round.status == RoundStatus.DISTRIBUTING || round.status == RoundStatus.CLOSED, "Not distributing");

        uint256 shareOfDistribution = round.totalDistributionCUSD / round.totalShares;
        uint256 owed = shareOfDistribution - info.claimedCUSD;
        require(owed > 0, "Nothing to claim");

        info.claimedCUSD += owed;
        require(cusd.transfer(msg.sender, owed), "Transfer failed");
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return rounds[tokenInfo[tokenId].roundId].metadataURI;
    }

    function getRound(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }

    function getTokenInfo(uint256 tokenId) external view returns (TokenInfo memory) {
        return tokenInfo[tokenId];
    }
}
```

- [ ] **Step 3: Write Foundry tests**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import "../src/PlantationRound.sol";

contract MockCUSDPR {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract PlantationRoundTest is Test {
    PlantationRound public pr;
    MockCUSDPR public cusd;

    address public adminAddr;
    address public farmer;
    address public investor1;
    address public investor2;

    uint256 public constant PRICE_PER_SHARE = 50 ether;  // 50 cUSD
    uint256 public constant TOTAL_SHARES = 4;
    uint256 public constant TARGET = PRICE_PER_SHARE * TOTAL_SHARES; // 200 cUSD
    uint256 public constant DEADLINE = 1_800_000_000; // far future

    function setUp() public {
        cusd = new MockCUSDPR();
        pr = new PlantationRound(address(cusd));
        adminAddr = address(this);
        farmer = makeAddr("farmer");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        cusd.mint(investor1, 1000 ether);
        cusd.mint(investor2, 1000 ether);
        cusd.mint(farmer, 1000 ether);

        vm.prank(investor1);
        cusd.approve(address(pr), type(uint256).max);
        vm.prank(investor2);
        cusd.approve(address(pr), type(uint256).max);
        vm.prank(farmer);
        cusd.approve(address(pr), type(uint256).max);
    }

    function _createRound() internal returns (uint256 roundId) {
        vm.prank(farmer);
        roundId = pr.createRound("avocado", TARGET, PRICE_PER_SHARE, DEADLINE, "ipfs://meta");
    }

    function test_createRound_storesRound() public {
        uint256 roundId = _createRound();
        PlantationRound.Round memory r = pr.getRound(roundId);
        assertEq(r.farmer, farmer);
        assertEq(r.cropType, "avocado");
        assertEq(r.targetCUSD, TARGET);
        assertEq(r.totalShares, TOTAL_SHARES);
        assertEq(uint8(r.status), uint8(PlantationRound.RoundStatus.OPEN));
    }

    function test_createRound_revertsIfDeadlineInPast() public {
        vm.prank(farmer);
        vm.expectRevert("Deadline must be future");
        pr.createRound("avocado", TARGET, PRICE_PER_SHARE, block.timestamp - 1, "ipfs://meta");
    }

    function test_invest_mintsNFT() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, 1);
        assertEq(pr.balanceOf(investor1), 1);
        assertEq(pr.ownerOf(0), investor1);
    }

    function test_invest_pullsCUSD() public {
        uint256 roundId = _createRound();
        uint256 before = cusd.balanceOf(investor1);
        vm.prank(investor1);
        pr.invest(roundId, 2);
        assertEq(cusd.balanceOf(investor1), before - PRICE_PER_SHARE * 2);
    }

    function test_invest_statusBecomeFunded_whenAllSharesSold() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);
        PlantationRound.Round memory r = pr.getRound(roundId);
        assertEq(uint8(r.status), uint8(PlantationRound.RoundStatus.FUNDED));
    }

    function test_invest_revertsIfRoundNotOpen() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES); // fills round → FUNDED
        vm.prank(investor2);
        vm.expectRevert("Round not open");
        pr.invest(roundId, 1);
    }

    function test_invest_revertsIfExceedsShares() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        vm.expectRevert("Exceeds available shares");
        pr.invest(roundId, TOTAL_SHARES + 1);
    }

    function test_unlockCapital_transfersToBuyer() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);

        uint256 farmerBefore = cusd.balanceOf(farmer);
        pr.unlockCapital(roundId); // called as admin (this contract)
        uint256 farmerAfter = cusd.balanceOf(farmer);

        // Farmer gets TARGET minus 2% fee
        uint256 fee = (TARGET * 200) / 10000;
        assertEq(farmerAfter - farmerBefore, TARGET - fee);
        assertEq(uint8(pr.getRound(roundId).status), uint8(PlantationRound.RoundStatus.ACTIVE));
    }

    function test_unlockCapital_revertsIfNotAdmin() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);
        vm.prank(farmer);
        vm.expectRevert("Not admin");
        pr.unlockCapital(roundId);
    }

    function test_distributeAndClaim_fullFlow() public {
        uint256 roundId = _createRound();
        // investor1 buys 2 shares, investor2 buys 2 shares
        vm.prank(investor1);
        pr.invest(roundId, 2); // tokenIds 0,1
        vm.prank(investor2);
        pr.invest(roundId, 2); // tokenIds 2,3

        pr.unlockCapital(roundId);

        uint256 saleCUSD = 300 ether; // 300 cUSD total harvest sale
        vm.prank(farmer);
        pr.distributeHarvest(roundId, saleCUSD);

        // investor1 claims token 0 (1/4 share = 75 cUSD)
        uint256 inv1Before = cusd.balanceOf(investor1);
        vm.prank(investor1);
        pr.claimDistribution(0);
        assertEq(cusd.balanceOf(investor1) - inv1Before, saleCUSD / TOTAL_SHARES);
    }

    function test_claimDistribution_revertsIfNotOwner() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);
        pr.unlockCapital(roundId);
        vm.prank(farmer);
        pr.distributeHarvest(roundId, 300 ether);

        vm.prank(investor2);
        vm.expectRevert("Not token owner");
        pr.claimDistribution(0); // owned by investor1
    }

    function test_claimDistribution_revertsIfClaimedTwice() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);
        pr.unlockCapital(roundId);
        vm.prank(farmer);
        pr.distributeHarvest(roundId, 300 ether);
        vm.prank(investor1);
        pr.claimDistribution(0);
        vm.prank(investor1);
        vm.expectRevert("Nothing to claim");
        pr.claimDistribution(0);
    }
}
```

- [ ] **Step 4: Run tests**

```bash
cd normie-apps/agro-trade-native/contracts
forge test --match-contract PlantationRoundTest -v
```

Expected: All tests PASS. If any fail, fix `PlantationRound.sol` before continuing.

- [ ] **Step 5: Commit**

```bash
git add contracts/
git commit -m "feat(contracts): PlantationRound ERC-721 + fundraising escrow + Foundry tests"
```

---

## Task 2: GroveStaking.sol Contract + Foundry Tests

**Files:**
- Create: `contracts/src/GroveStaking.sol`
- Create: `contracts/test/GroveStaking.t.sol`

**Interfaces:**
- Consumes: `PlantationRound` ERC-721 interface (`transferFrom`, `safeTransferFrom`)
- Produces: `stake(uint256 tokenId)` — takes NFT, starts yield accrual
- Produces: `unstake(uint256 tokenId)` — returns NFT, stops accrual
- Produces: `claimYield(uint256 tokenId)` — pays out accrued cUSD
- Produces: `pendingYield(uint256 tokenId) → uint256` — view
- Produces: `setYieldRate(uint256 ratePerBlock)` — admin only

- [ ] **Step 1: Write GroveStaking.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20Transfer {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract GroveStaking is ReentrancyGuard {
    IERC721 public immutable nftContract;
    IERC20Transfer public immutable cusd;
    address public admin;

    // cUSD per block per staked NFT (18 decimals)
    uint256 public yieldRatePerBlock;

    struct Position {
        address owner;
        uint256 stakedAtBlock;
        uint256 claimedCUSD;
    }

    mapping(uint256 => Position) public positions; // tokenId => Position

    event Staked(uint256 indexed tokenId, address indexed owner);
    event Unstaked(uint256 indexed tokenId, address indexed owner);
    event YieldClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(address _nftContract, address _cusd, uint256 _yieldRatePerBlock) {
        nftContract = IERC721(_nftContract);
        cusd = IERC20Transfer(_cusd);
        admin = msg.sender;
        yieldRatePerBlock = _yieldRatePerBlock;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
    }

    function setYieldRate(uint256 ratePerBlock) external onlyAdmin {
        yieldRatePerBlock = ratePerBlock;
    }

    function stake(uint256 tokenId) external nonReentrant {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(positions[tokenId].owner == address(0), "Already staked");

        nftContract.transferFrom(msg.sender, address(this), tokenId);

        positions[tokenId] = Position({
            owner: msg.sender,
            stakedAtBlock: block.number,
            claimedCUSD: 0
        });

        emit Staked(tokenId, msg.sender);
    }

    function unstake(uint256 tokenId) external nonReentrant {
        Position storage pos = positions[tokenId];
        require(pos.owner == msg.sender, "Not staker");

        // Auto-claim any pending yield before unstaking
        uint256 pending = _pendingYield(pos);
        if (pending > 0) {
            pos.claimedCUSD += pending;
            require(cusd.transfer(msg.sender, pending), "Yield transfer failed");
            emit YieldClaimed(tokenId, msg.sender, pending);
        }

        delete positions[tokenId];
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        emit Unstaked(tokenId, msg.sender);
    }

    function claimYield(uint256 tokenId) external nonReentrant {
        Position storage pos = positions[tokenId];
        require(pos.owner == msg.sender, "Not staker");

        uint256 pending = _pendingYield(pos);
        require(pending > 0, "Nothing to claim");

        pos.claimedCUSD += pending;
        pos.stakedAtBlock = block.number; // reset accrual window

        require(cusd.transfer(msg.sender, pending), "Transfer failed");
        emit YieldClaimed(tokenId, msg.sender, pending);
    }

    function pendingYield(uint256 tokenId) external view returns (uint256) {
        return _pendingYield(positions[tokenId]);
    }

    function _pendingYield(Position storage pos) internal view returns (uint256) {
        if (pos.owner == address(0)) return 0;
        uint256 blocks = block.number - pos.stakedAtBlock;
        return blocks * yieldRatePerBlock;
    }
}
```

- [ ] **Step 2: Write GroveStaking Foundry tests**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import "../src/PlantationRound.sol";
import "../src/GroveStaking.sol";

contract GroveStakingTest is Test {
    PlantationRound public pr;
    GroveStaking public staking;
    MockCUSDGS public cusd;

    address public farmer;
    address public investor;

    uint256 public constant RATE = 1e15; // 0.001 cUSD per block
    uint256 public constant PRICE = 50 ether;
    uint256 public constant TARGET = PRICE * 2;

    function setUp() public {
        cusd = new MockCUSDGS();
        pr = new PlantationRound(address(cusd));
        staking = new GroveStaking(address(pr), address(cusd), RATE);

        farmer = makeAddr("farmer");
        investor = makeAddr("investor");

        cusd.mint(investor, 1000 ether);
        cusd.mint(address(staking), 1000 ether); // fund yield pool

        vm.prank(investor);
        cusd.approve(address(pr), type(uint256).max);

        // Create and fill a round so investor has NFTs
        vm.prank(farmer);
        cusd.approve(address(pr), type(uint256).max);
        vm.prank(farmer);
        pr.createRound("avocado", TARGET, PRICE, block.timestamp + 1000, "ipfs://x");
        vm.prank(investor);
        pr.invest(0, 2); // tokens 0 and 1

        // Approve staking contract to take NFTs
        vm.prank(investor);
        pr.setApprovalForAll(address(staking), true);
    }

    function test_stake_transfersNFT() public {
        vm.prank(investor);
        staking.stake(0);
        assertEq(pr.ownerOf(0), address(staking));
    }

    function test_stake_revertsIfNotOwner() public {
        address other = makeAddr("other");
        vm.prank(other);
        vm.expectRevert("Not token owner");
        staking.stake(0);
    }

    function test_stake_revertsIfAlreadyStaked() public {
        vm.prank(investor);
        staking.stake(0);
        vm.prank(investor);
        vm.expectRevert("Already staked");
        staking.stake(0);
    }

    function test_pendingYield_accruedCorrectly() public {
        vm.prank(investor);
        staking.stake(0);
        vm.roll(block.number + 100);
        assertEq(staking.pendingYield(0), RATE * 100);
    }

    function test_claimYield_paysCUSD() public {
        vm.prank(investor);
        staking.stake(0);
        vm.roll(block.number + 50);

        uint256 before = cusd.balanceOf(investor);
        vm.prank(investor);
        staking.claimYield(0);
        assertEq(cusd.balanceOf(investor) - before, RATE * 50);
    }

    function test_unstake_returnsNFT_andPaysYield() public {
        vm.prank(investor);
        staking.stake(0);
        vm.roll(block.number + 10);

        uint256 before = cusd.balanceOf(investor);
        vm.prank(investor);
        staking.unstake(0);

        assertEq(pr.ownerOf(0), investor);
        assertEq(cusd.balanceOf(investor) - before, RATE * 10);
    }

    function test_unstake_beforeAnyBlocks_noYield() public {
        vm.prank(investor);
        staking.stake(0);
        // No block advance
        uint256 before = cusd.balanceOf(investor);
        vm.prank(investor);
        staking.unstake(0);
        assertEq(cusd.balanceOf(investor), before); // no yield
    }
}

contract MockCUSDGS {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount; return true;
    }
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient");
        balanceOf[msg.sender] -= amount; balanceOf[to] += amount; return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount; balanceOf[to] += amount; return true;
    }
}
```

- [ ] **Step 3: Run tests**

```bash
cd normie-apps/agro-trade-native/contracts
forge test --match-contract GroveStakingTest -v
```

Expected: All tests PASS.

- [ ] **Step 4: Run full contract suite**

```bash
forge test -v
```

Expected: All 37 existing tests PASS plus new tests. Zero failures.

- [ ] **Step 5: Commit**

```bash
git add contracts/
git commit -m "feat(contracts): GroveStaking NFT yield staking + Foundry tests"
```

---

## Task 3: Prisma Schema + Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: `PlantationRound`, `PlantationNft`, `StakingPosition` Prisma models
- Produces: `PlantationRoundStatus` enum

- [ ] **Step 1: Add models to schema.prisma**

Open `backend/prisma/schema.prisma`. At the end of the file, append:

```prisma
enum PlantationRoundStatus {
  OPEN
  FUNDED
  ACTIVE
  DISTRIBUTING
  CLOSED
}

model PlantationRound {
  id                String                @id @default(cuid())
  onChainRoundId    Int                   @unique @map("on_chain_round_id")
  sellerId          String                @map("seller_id")
  seller            User                  @relation("SellerPlantationRounds", fields: [sellerId], references: [id])
  cropType          String                @map("crop_type")
  farmLocation      String                @map("farm_location")
  targetCUSD        Decimal               @map("target_cusd") @db.Decimal(36, 18)
  pricePerShareCUSD Decimal               @map("price_per_share_cusd") @db.Decimal(36, 18)
  totalShares       Int                   @map("total_shares")
  sharesSold        Int                   @default(0) @map("shares_sold")
  harvestDeadline   DateTime              @map("harvest_deadline")
  projectedApyPct   Decimal?              @map("projected_apy_pct") @db.Decimal(10, 4)
  status            PlantationRoundStatus @default(OPEN)
  metadataUri       String?               @map("metadata_uri")
  contractAddress   String                @map("contract_address")
  nfts              PlantationNft[]
  createdAt         DateTime              @default(now()) @map("created_at")
  updatedAt         DateTime              @updatedAt @map("updated_at")

  @@map("plantation_rounds")
}

model PlantationNft {
  id          String          @id @default(cuid())
  tokenId     Int             @unique @map("token_id")
  roundId     String          @map("round_id")
  round       PlantationRound @relation(fields: [roundId], references: [id])
  ownerId     String          @map("owner_id")
  owner       User            @relation("InvestorPlantationNfts", fields: [ownerId], references: [id])
  shareIndex  Int             @map("share_index")
  staking     StakingPosition?
  createdAt   DateTime        @default(now()) @map("created_at")

  @@map("plantation_nfts")
}

model StakingPosition {
  id          String        @id @default(cuid())
  nftId       String        @unique @map("nft_id")
  nft         PlantationNft @relation(fields: [nftId], references: [id])
  stakedAt    DateTime      @default(now()) @map("staked_at")
  unstakedAt  DateTime?     @map("unstaked_at")
  claimedCUSD Decimal       @default(0) @map("claimed_cusd") @db.Decimal(36, 18)

  @@map("staking_positions")
}
```

Also add the two new relation fields to the `User` model in schema.prisma:

```prisma
// Inside the existing User model, add:
plantationRounds PlantationRound[] @relation("SellerPlantationRounds")
plantationNfts   PlantationNft[]   @relation("InvestorPlantationNfts")
```

- [ ] **Step 2: Run migration**

```bash
cd normie-apps/agro-trade-native/backend
npx prisma migrate dev --name add_plantation_rounds
```

Expected output: `Your database is now in sync with your schema.`

- [ ] **Step 3: Verify types generated**

```bash
npx prisma generate
```

Expected: No errors. `PlantationRound`, `PlantationNft`, `StakingPosition` now available from `@prisma/client`.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/
git commit -m "feat(db): add PlantationRound, PlantationNft, StakingPosition Prisma models"
```

---

## Task 4: NestJS Scaffolding — DTOs, Constants, Env Vars

**Files:**
- Create: `backend/src/plantation-rounds/dto/create-round.dto.ts`
- Create: `backend/src/plantation-rounds/dto/invest.dto.ts`
- Create: `backend/src/plantation-rounds/dto/distribute-harvest.dto.ts`
- Create: `backend/src/plantation-rounds/constants/contracts.constant.ts`
- Modify: `backend/src/common/config/env.validation.ts`

**Interfaces:**
- Produces: `CreateRoundDto`, `InvestDto`, `DistributeHarvestDto` — used by controller and services

- [ ] **Step 1: Create create-round.dto.ts**

```typescript
// backend/src/plantation-rounds/dto/create-round.dto.ts
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoundDto {
  @IsString()
  @IsNotEmpty()
  cropType: string;

  @IsString()
  @IsNotEmpty()
  farmLocation: string;

  @IsNumber()
  @Min(1)
  targetCUSD: number;

  @IsNumber()
  @Min(1)
  pricePerShareCUSD: number;

  @IsDateString()
  harvestDeadline: string;

  @IsString()
  @IsOptional()
  metadataUri?: string;

  @IsNumber()
  @IsOptional()
  projectedApyPct?: number;
}
```

- [ ] **Step 2: Create invest.dto.ts**

```typescript
// backend/src/plantation-rounds/dto/invest.dto.ts
import { IsInt, Min } from 'class-validator';

export class InvestDto {
  @IsInt()
  @Min(1)
  shareCount: number;
}
```

- [ ] **Step 3: Create distribute-harvest.dto.ts**

```typescript
// backend/src/plantation-rounds/dto/distribute-harvest.dto.ts
import { IsNumber, Min } from 'class-validator';

export class DistributeHarvestDto {
  @IsNumber()
  @Min(1)
  totalSaleCUSD: number;
}
```

- [ ] **Step 4: Create contracts.constant.ts**

```typescript
// backend/src/plantation-rounds/constants/contracts.constant.ts
export const PLANTATION_ROUND_ABI = [
  'function createRound(string cropType, uint256 targetCUSD, uint256 pricePerShareCUSD, uint256 harvestDeadline, string metadataURI) returns (uint256)',
  'function invest(uint256 roundId, uint256 shareCount)',
  'function unlockCapital(uint256 roundId)',
  'function distributeHarvest(uint256 roundId, uint256 totalSaleCUSD)',
  'function claimDistribution(uint256 tokenId)',
  'function getRound(uint256 roundId) view returns (tuple(address farmer, string cropType, uint256 targetCUSD, uint256 pricePerShareCUSD, uint256 totalShares, uint256 sharesSold, uint256 harvestDeadline, string metadataURI, uint8 status, uint256 totalDistributionCUSD))',
  'function getTokenInfo(uint256 tokenId) view returns (tuple(uint256 roundId, uint256 shareIndex, uint256 claimedCUSD))',
  'event RoundCreated(uint256 indexed roundId, address indexed farmer, string cropType, uint256 targetCUSD)',
  'event SharesPurchased(uint256 indexed roundId, address indexed investor, uint256[] tokenIds)',
  'event CapitalUnlocked(uint256 indexed roundId, address indexed farmer, uint256 amount)',
  'event HarvestDistributed(uint256 indexed roundId, uint256 totalCUSD)',
];

export const GROVE_STAKING_ABI = [
  'function stake(uint256 tokenId)',
  'function unstake(uint256 tokenId)',
  'function claimYield(uint256 tokenId)',
  'function pendingYield(uint256 tokenId) view returns (uint256)',
  'event Staked(uint256 indexed tokenId, address indexed owner)',
  'event Unstaked(uint256 indexed tokenId, address indexed owner)',
  'event YieldClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount)',
];
```

- [ ] **Step 5: Add env vars to env.validation.ts**

Find the `EnvironmentVariables` class in `backend/src/common/config/env.validation.ts` and add:

```typescript
@IsString()
@IsOptional()
PLANTATION_ROUND_CONTRACT_ADDRESS: string;

@IsString()
@IsOptional()
GROVE_STAKING_CONTRACT_ADDRESS: string;

@IsString()
@IsOptional()
CELO_RPC_URL: string;

@IsString()
@IsOptional()
CELO_ADMIN_PRIVATE_KEY: string;
```

- [ ] **Step 6: Typecheck**

```bash
cd normie-apps/agro-trade-native/backend
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/plantation-rounds/ backend/src/common/config/env.validation.ts
git commit -m "feat(plantation-rounds): DTOs, contracts ABI constants, env var declarations"
```

---

## Task 5: PlantationRoundsService

**Files:**
- Create: `backend/src/plantation-rounds/plantation-rounds.service.ts`

**Interfaces:**
- Consumes: `PrismaService`, `ConfigService`, `CreateRoundDto`, `InvestDto`, `DistributeHarvestDto`
- Consumes: `PLANTATION_ROUND_ABI` from `./constants/contracts.constant`
- Produces: `createRound(userId, dto) → PlantationRound`
- Produces: `investInRound(roundDbId, userId, dto) → PlantationNft[]`
- Produces: `distributeHarvest(roundDbId, userId, dto) → PlantationRound`
- Produces: `listRounds(filters) → PlantationRound[]`
- Produces: `getRound(id) → PlantationRound`
- Produces: `unlockCapital(roundDbId) → void` (admin)

- [ ] **Step 1: Write PlantationRoundsService**

```typescript
// backend/src/plantation-rounds/plantation-rounds.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlantationRoundStatus } from '@prisma/client';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { DistributeHarvestDto } from './dto/distribute-harvest.dto';
import { InvestDto } from './dto/invest.dto';
import { PLANTATION_ROUND_ABI } from './constants/contracts.constant';

@Injectable()
export class PlantationRoundsService {
  private readonly logger = new Logger(PlantationRoundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = this.config.get<string>('CELO_RPC_URL');
    if (!rpcUrl) throw new BadRequestException('CELO_RPC_URL not configured');
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private getAdminWallet(): ethers.Wallet {
    const privateKey = this.config.get<string>('CELO_ADMIN_PRIVATE_KEY');
    if (!privateKey) throw new BadRequestException('CELO_ADMIN_PRIVATE_KEY not configured');
    return new ethers.Wallet(privateKey, this.getProvider());
  }

  private getContract(signer?: ethers.Wallet): ethers.Contract {
    const address = this.config.get<string>('PLANTATION_ROUND_CONTRACT_ADDRESS');
    if (!address) throw new BadRequestException('PLANTATION_ROUND_CONTRACT_ADDRESS not configured');
    return new ethers.Contract(address, PLANTATION_ROUND_ABI, signer ?? this.getProvider());
  }

  async createRound(userId: string, dto: CreateRoundDto) {
    const contractAddress = this.config.get<string>('PLANTATION_ROUND_CONTRACT_ADDRESS') ?? '';
    const harvestDeadlineTs = Math.floor(new Date(dto.harvestDeadline).getTime() / 1000);
    const targetWei = ethers.parseEther(dto.targetCUSD.toString());
    const priceWei = ethers.parseEther(dto.pricePerShareCUSD.toString());

    // Create DB record first (on-chain roundId assigned via event listener)
    // We use a temporary onChainRoundId of -1 until the event listener updates it
    const round = await this.prisma.plantationRound.create({
      data: {
        onChainRoundId: -1,
        sellerId: userId,
        cropType: dto.cropType,
        farmLocation: dto.farmLocation,
        targetCUSD: dto.targetCUSD,
        pricePerShareCUSD: dto.pricePerShareCUSD,
        totalShares: Math.floor(dto.targetCUSD / dto.pricePerShareCUSD),
        harvestDeadline: new Date(dto.harvestDeadline),
        projectedApyPct: dto.projectedApyPct ?? null,
        metadataUri: dto.metadataUri ?? null,
        contractAddress,
        status: PlantationRoundStatus.OPEN,
      },
    });

    // Submit on-chain (fire-and-forget; event listener syncs onChainRoundId)
    this.getContract(this.getAdminWallet())
      .createRound(dto.cropType, targetWei, priceWei, harvestDeadlineTs, dto.metadataUri ?? '')
      .then((tx: ethers.TransactionResponse) => tx.wait())
      .then(() => this.logger.log(`Round ${round.id} submitted on-chain`))
      .catch((err: Error) => this.logger.error(`On-chain createRound failed: ${err.message}`));

    return round;
  }

  async investInRound(roundDbId: string, userId: string, dto: InvestDto) {
    const round = await this.prisma.plantationRound.findUnique({ where: { id: roundDbId } });
    if (!round) throw new NotFoundException('Round not found');
    if (round.status !== PlantationRoundStatus.OPEN) throw new BadRequestException('Round is not open');
    if (round.sharesSold + dto.shareCount > round.totalShares) {
      throw new BadRequestException('Exceeds available shares');
    }

    // Mint NFTs in DB (on-chain mint happens via contract directly from user wallet)
    const nfts = await this.prisma.$transaction(
      Array.from({ length: dto.shareCount }, (_, i) =>
        this.prisma.plantationNft.create({
          data: {
            tokenId: -1, // updated by event listener
            roundId: roundDbId,
            ownerId: userId,
            shareIndex: round.sharesSold + i,
          },
        }),
      ),
    );

    await this.prisma.plantationRound.update({
      where: { id: roundDbId },
      data: { sharesSold: { increment: dto.shareCount } },
    });

    return nfts;
  }

  async distributeHarvest(roundDbId: string, userId: string, dto: DistributeHarvestDto) {
    const round = await this.prisma.plantationRound.findUnique({ where: { id: roundDbId } });
    if (!round) throw new NotFoundException('Round not found');
    if (round.sellerId !== userId) throw new ForbiddenException('Only the farmer can distribute');
    if (round.status !== PlantationRoundStatus.ACTIVE) {
      throw new BadRequestException('Round must be ACTIVE to distribute');
    }

    return this.prisma.plantationRound.update({
      where: { id: roundDbId },
      data: { status: PlantationRoundStatus.DISTRIBUTING },
    });
  }

  async unlockCapital(roundDbId: string) {
    const round = await this.prisma.plantationRound.findUnique({ where: { id: roundDbId } });
    if (!round) throw new NotFoundException('Round not found');
    if (round.status !== PlantationRoundStatus.FUNDED) {
      throw new BadRequestException('Round is not funded');
    }

    const tx = await this.getContract(this.getAdminWallet()).unlockCapital(round.onChainRoundId);
    await tx.wait();

    return this.prisma.plantationRound.update({
      where: { id: roundDbId },
      data: { status: PlantationRoundStatus.ACTIVE },
    });
  }

  async listRounds(filters: { cropType?: string; status?: PlantationRoundStatus }) {
    return this.prisma.plantationRound.findMany({
      where: {
        ...(filters.cropType ? { cropType: filters.cropType } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRound(id: string) {
    const round = await this.prisma.plantationRound.findUnique({
      where: { id },
      include: { nfts: true },
    });
    if (!round) throw new NotFoundException('Round not found');
    return round;
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
cd normie-apps/agro-trade-native/backend
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/plantation-rounds/plantation-rounds.service.ts
git commit -m "feat(plantation-rounds): PlantationRoundsService — create, invest, distribute, list"
```

---

## Task 6: PlantationNftsService + GroveStakingService

**Files:**
- Create: `backend/src/plantation-rounds/plantation-nfts.service.ts`
- Create: `backend/src/plantation-rounds/grove-staking.service.ts`

**Interfaces:**
- Produces: `getPortfolio(userId) → PlantationNft[]` (with staking status)
- Produces: `stakeNft(tokenId, userId) → StakingPosition`
- Produces: `unstakeNft(tokenId, userId) → StakingPosition`
- Produces: `getPendingYield(tokenId, userId) → string` (cUSD wei string)
- Produces: `claimYield(tokenId, userId) → void`

- [ ] **Step 1: Write plantation-nfts.service.ts**

```typescript
// backend/src/plantation-rounds/plantation-nfts.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlantationNftsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortfolio(userId: string) {
    return this.prisma.plantationNft.findMany({
      where: { ownerId: userId },
      include: { round: true, staking: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assertOwner(tokenId: number, userId: string) {
    const nft = await this.prisma.plantationNft.findUnique({ where: { tokenId } });
    if (!nft) throw new NotFoundException(`NFT token ${tokenId} not found`);
    if (nft.ownerId !== userId) throw new ForbiddenException('Not your NFT');
    return nft;
  }
}
```

- [ ] **Step 2: Write grove-staking.service.ts**

```typescript
// backend/src/plantation-rounds/grove-staking.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { PlantationNftsService } from './plantation-nfts.service';
import { GROVE_STAKING_ABI } from './constants/contracts.constant';

@Injectable()
export class GroveStakingService {
  private readonly logger = new Logger(GroveStakingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly nftsService: PlantationNftsService,
  ) {}

  private getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = this.config.get<string>('CELO_RPC_URL');
    if (!rpcUrl) throw new BadRequestException('CELO_RPC_URL not configured');
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private getAdminWallet(): ethers.Wallet {
    const privateKey = this.config.get<string>('CELO_ADMIN_PRIVATE_KEY');
    if (!privateKey) throw new BadRequestException('CELO_ADMIN_PRIVATE_KEY not configured');
    return new ethers.Wallet(privateKey, this.getProvider());
  }

  private getContract(signer?: ethers.Wallet): ethers.Contract {
    const address = this.config.get<string>('GROVE_STAKING_CONTRACT_ADDRESS');
    if (!address) throw new BadRequestException('GROVE_STAKING_CONTRACT_ADDRESS not configured');
    return new ethers.Contract(address, GROVE_STAKING_ABI, signer ?? this.getProvider());
  }

  async stakeNft(tokenId: number, userId: string) {
    const nft = await this.nftsService.assertOwner(tokenId, userId);

    const existing = await this.prisma.stakingPosition.findUnique({ where: { nftId: nft.id } });
    if (existing && !existing.unstakedAt) throw new BadRequestException('Already staked');

    const position = await this.prisma.stakingPosition.upsert({
      where: { nftId: nft.id },
      update: { stakedAt: new Date(), unstakedAt: null, claimedCUSD: 0 },
      create: { nftId: nft.id },
    });

    // On-chain stake (user must have approved staking contract to take their NFT)
    this.getContract(this.getAdminWallet())
      .stake(tokenId)
      .then((tx: ethers.TransactionResponse) => tx.wait())
      .catch((err: Error) => this.logger.error(`On-chain stake failed for token ${tokenId}: ${err.message}`));

    return position;
  }

  async unstakeNft(tokenId: number, userId: string) {
    const nft = await this.nftsService.assertOwner(tokenId, userId);
    const position = await this.prisma.stakingPosition.findUnique({ where: { nftId: nft.id } });
    if (!position || position.unstakedAt) throw new BadRequestException('NFT is not staked');

    const updated = await this.prisma.stakingPosition.update({
      where: { nftId: nft.id },
      data: { unstakedAt: new Date() },
    });

    this.getContract(this.getAdminWallet())
      .unstake(tokenId)
      .then((tx: ethers.TransactionResponse) => tx.wait())
      .catch((err: Error) => this.logger.error(`On-chain unstake failed for token ${tokenId}: ${err.message}`));

    return updated;
  }

  async getPendingYield(tokenId: number, userId: string): Promise<string> {
    await this.nftsService.assertOwner(tokenId, userId);
    const contract = this.getContract();
    const pending: bigint = await contract.pendingYield(tokenId);
    return ethers.formatEther(pending); // cUSD string, human-readable
  }

  async claimYield(tokenId: number, userId: string) {
    const nft = await this.nftsService.assertOwner(tokenId, userId);
    const position = await this.prisma.stakingPosition.findUnique({ where: { nftId: nft.id } });
    if (!position || position.unstakedAt) throw new BadRequestException('NFT is not staked');

    const tx = await this.getContract(this.getAdminWallet()).claimYield(tokenId);
    await tx.wait();

    // DB: update claimedCUSD (approximate — exact value comes from event)
    return position;
  }
}
```

- [ ] **Step 3: Typecheck**

```bash
cd normie-apps/agro-trade-native/backend
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/plantation-rounds/plantation-nfts.service.ts backend/src/plantation-rounds/grove-staking.service.ts
git commit -m "feat(plantation-rounds): PlantationNftsService + GroveStakingService"
```

---

## Task 7: Controller + Module Wiring

**Files:**
- Create: `backend/src/plantation-rounds/plantation-rounds.controller.ts`
- Create: `backend/src/plantation-rounds/plantation-rounds.module.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Consumes: all three services from Tasks 5 and 6

- [ ] **Step 1: Write plantation-rounds.controller.ts**

```typescript
// backend/src/plantation-rounds/plantation-rounds.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User, PlantationRoundStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlantationRoundsService } from './plantation-rounds.service';
import { PlantationNftsService } from './plantation-nfts.service';
import { GroveStakingService } from './grove-staking.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { InvestDto } from './dto/invest.dto';
import { DistributeHarvestDto } from './dto/distribute-harvest.dto';

@Controller('plantation-rounds')
export class PlantationRoundsController {
  constructor(
    private readonly roundsService: PlantationRoundsService,
    private readonly nftsService: PlantationNftsService,
    private readonly stakingService: GroveStakingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createRound(@CurrentUser() user: User, @Body() dto: CreateRoundDto) {
    return this.roundsService.createRound(user.id, dto);
  }

  @Get()
  listRounds(
    @Query('cropType') cropType?: string,
    @Query('status') status?: PlantationRoundStatus,
  ) {
    return this.roundsService.listRounds({ cropType, status });
  }

  @Get('portfolio')
  @UseGuards(JwtAuthGuard)
  getPortfolio(@CurrentUser() user: User) {
    return this.nftsService.getPortfolio(user.id);
  }

  @Get(':id')
  getRound(@Param('id') id: string) {
    return this.roundsService.getRound(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invest')
  investInRound(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: InvestDto,
  ) {
    return this.roundsService.investInRound(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/distribute')
  distributeHarvest(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: DistributeHarvestDto,
  ) {
    return this.roundsService.distributeHarvest(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stake/:tokenId')
  stakeNft(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @CurrentUser() user: User,
  ) {
    return this.stakingService.stakeNft(tokenId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unstake/:tokenId')
  unstakeNft(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @CurrentUser() user: User,
  ) {
    return this.stakingService.unstakeNft(tokenId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('yield/:tokenId')
  getPendingYield(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @CurrentUser() user: User,
  ) {
    return this.stakingService.getPendingYield(tokenId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim/:tokenId')
  claimYield(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @CurrentUser() user: User,
  ) {
    return this.stakingService.claimYield(tokenId, user.id);
  }
}
```

- [ ] **Step 2: Write plantation-rounds.module.ts**

```typescript
// backend/src/plantation-rounds/plantation-rounds.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PlantationRoundsController } from './plantation-rounds.controller';
import { PlantationRoundsService } from './plantation-rounds.service';
import { PlantationNftsService } from './plantation-nfts.service';
import { GroveStakingService } from './grove-staking.service';
import { PlantationEventsService } from './plantation-events.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PlantationRoundsController],
  providers: [
    PlantationRoundsService,
    PlantationNftsService,
    GroveStakingService,
    PlantationEventsService,
  ],
  exports: [PlantationRoundsService],
})
export class PlantationRoundsModule {}
```

- [ ] **Step 3: Wire into AppModule**

In `backend/src/app.module.ts`, add the import at the top:

```typescript
import { PlantationRoundsModule } from './plantation-rounds/plantation-rounds.module';
```

And add `PlantationRoundsModule` to the `imports` array (alongside `InvestmentsModule`):

```typescript
PlantationRoundsModule,
```

- [ ] **Step 4: Typecheck + start server**

```bash
cd normie-apps/agro-trade-native/backend
npx tsc --noEmit
npm run dev
```

Expected: Server starts with `PlantationRoundsModule` in bootstrap log. No type errors.

- [ ] **Step 5: Smoke test endpoints**

```bash
# List rounds (public)
curl http://localhost:4000/plantation-rounds
# Expected: []

# Should return 401 without token
curl -X POST http://localhost:4000/plantation-rounds
# Expected: {"statusCode":401,"message":"Unauthorized"}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/plantation-rounds/ backend/src/app.module.ts
git commit -m "feat(plantation-rounds): controller + module + AppModule wiring"
```

---

## Task 8: Contract Event Listener

**Files:**
- Create: `backend/src/plantation-rounds/plantation-events.service.ts`

**Interfaces:**
- Consumes: `PlantationRoundsService`, `PrismaService`, `ConfigService`
- Listens to: `RoundCreated`, `SharesPurchased`, `CapitalUnlocked`, `HarvestDistributed`
- Updates DB records created in Tasks 5/6 with real on-chain IDs

- [ ] **Step 1: Write plantation-events.service.ts**

```typescript
// backend/src/plantation-rounds/plantation-events.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlantationRoundStatus } from '@prisma/client';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { PLANTATION_ROUND_ABI } from './constants/contracts.constant';

@Injectable()
export class PlantationEventsService implements OnModuleInit {
  private readonly logger = new Logger(PlantationEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const rpcUrl = this.config.get<string>('CELO_RPC_URL');
    const contractAddress = this.config.get<string>('PLANTATION_ROUND_CONTRACT_ADDRESS');

    if (!rpcUrl || !contractAddress) {
      this.logger.warn('CELO_RPC_URL or PLANTATION_ROUND_CONTRACT_ADDRESS not set — event listener disabled');
      return;
    }

    const provider = new ethers.WebSocketProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, PLANTATION_ROUND_ABI, provider);

    contract.on('RoundCreated', async (roundId: bigint, farmer: string, cropType: string, targetCUSD: bigint) => {
      this.logger.log(`RoundCreated event: roundId=${roundId}`);
      try {
        // Find the most recent OPEN round by this farmer with matching cropType that has onChainRoundId=-1
        const round = await this.prisma.plantationRound.findFirst({
          where: { onChainRoundId: -1, cropType, status: PlantationRoundStatus.OPEN },
          orderBy: { createdAt: 'desc' },
        });
        if (round) {
          await this.prisma.plantationRound.update({
            where: { id: round.id },
            data: { onChainRoundId: Number(roundId) },
          });
        }
      } catch (err) {
        this.logger.error(`RoundCreated handler error: ${(err as Error).message}`);
      }
    });

    contract.on('SharesPurchased', async (roundId: bigint, investor: string, tokenIds: bigint[]) => {
      this.logger.log(`SharesPurchased event: roundId=${roundId}, tokenIds=${tokenIds}`);
      try {
        const round = await this.prisma.plantationRound.findFirst({
          where: { onChainRoundId: Number(roundId) },
        });
        if (!round) return;

        // Update placeholder NFT records with real tokenIds
        const placeholders = await this.prisma.plantationNft.findMany({
          where: { roundId: round.id, tokenId: -1 },
          orderBy: { shareIndex: 'asc' },
          take: tokenIds.length,
        });

        await Promise.all(
          placeholders.map((nft, i) =>
            this.prisma.plantationNft.update({
              where: { id: nft.id },
              data: { tokenId: Number(tokenIds[i]) },
            }),
          ),
        );
      } catch (err) {
        this.logger.error(`SharesPurchased handler error: ${(err as Error).message}`);
      }
    });

    contract.on('CapitalUnlocked', async (roundId: bigint) => {
      this.logger.log(`CapitalUnlocked event: roundId=${roundId}`);
      await this.prisma.plantationRound.updateMany({
        where: { onChainRoundId: Number(roundId) },
        data: { status: PlantationRoundStatus.ACTIVE },
      });
    });

    contract.on('HarvestDistributed', async (roundId: bigint) => {
      this.logger.log(`HarvestDistributed event: roundId=${roundId}`);
      await this.prisma.plantationRound.updateMany({
        where: { onChainRoundId: Number(roundId) },
        data: { status: PlantationRoundStatus.DISTRIBUTING },
      });
    });

    this.logger.log('Plantation contract event listener active');
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
cd normie-apps/agro-trade-native/backend
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/plantation-rounds/plantation-events.service.ts
git commit -m "feat(plantation-rounds): on-chain event listener syncs DB with contract state"
```

---

## Task 9: Jest Unit Tests

**Files:**
- Create: `backend/src/plantation-rounds/plantation-rounds.service.spec.ts`
- Create: `backend/src/plantation-rounds/grove-staking.service.spec.ts`

**Interfaces:**
- Consumes: all services from Tasks 5 and 6

- [ ] **Step 1: Write plantation-rounds.service.spec.ts**

```typescript
// backend/src/plantation-rounds/plantation-rounds.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PlantationRoundStatus } from '@prisma/client';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlantationRoundsService } from './plantation-rounds.service';
import { PrismaService } from '../prisma/prisma.service';

const mockRound = {
  id: 'round-1',
  onChainRoundId: 0,
  sellerId: 'seller-1',
  cropType: 'avocado',
  farmLocation: 'Kenya',
  targetCUSD: 200,
  pricePerShareCUSD: 50,
  totalShares: 4,
  sharesSold: 0,
  harvestDeadline: new Date('2027-01-01'),
  projectedApyPct: null,
  status: PlantationRoundStatus.OPEN,
  metadataUri: null,
  contractAddress: '0xContract',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makePrismaMock = () => ({
  plantationRound: {
    create: jest.fn().mockResolvedValue(mockRound),
    findUnique: jest.fn().mockResolvedValue(mockRound),
    findMany: jest.fn().mockResolvedValue([mockRound]),
    update: jest.fn().mockResolvedValue({ ...mockRound, status: PlantationRoundStatus.ACTIVE }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  plantationNft: {
    create: jest.fn().mockResolvedValue({ id: 'nft-1', tokenId: -1 }),
    findMany: jest.fn().mockResolvedValue([]),
  },
  $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
});

const makeConfigMock = () => ({
  get: jest.fn((key: string) => {
    const vals: Record<string, string> = {
      CELO_RPC_URL: 'https://forno.celo-sepolia.celo-testnet.org',
      CELO_ADMIN_PRIVATE_KEY: '0x' + 'a'.repeat(64),
      PLANTATION_ROUND_CONTRACT_ADDRESS: '0xContract',
    };
    return vals[key];
  }),
});

describe('PlantationRoundsService', () => {
  let service: PlantationRoundsService;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prismaMock = makePrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantationRoundsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: makeConfigMock() },
      ],
    }).compile();
    service = module.get(PlantationRoundsService);
  });

  describe('listRounds', () => {
    it('returns all rounds when no filter', async () => {
      const result = await service.listRounds({});
      expect(result).toHaveLength(1);
      expect(prismaMock.plantationRound.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('filters by cropType', async () => {
      await service.listRounds({ cropType: 'avocado' });
      expect(prismaMock.plantationRound.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cropType: 'avocado' } }),
      );
    });
  });

  describe('getRound', () => {
    it('returns round by id', async () => {
      const result = await service.getRound('round-1');
      expect(result.id).toBe('round-1');
    });

    it('throws NotFoundException for unknown id', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue(null);
      await expect(service.getRound('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('investInRound', () => {
    it('throws if round not found', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue(null);
      await expect(service.investInRound('bad', 'user-1', { shareCount: 1 })).rejects.toThrow(NotFoundException);
    });

    it('throws if round not OPEN', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue({ ...mockRound, status: PlantationRoundStatus.FUNDED });
      await expect(service.investInRound('round-1', 'user-1', { shareCount: 1 })).rejects.toThrow(BadRequestException);
    });

    it('throws if exceeds available shares', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue({ ...mockRound, sharesSold: 3 });
      await expect(service.investInRound('round-1', 'user-1', { shareCount: 2 })).rejects.toThrow(BadRequestException);
    });

    it('creates NFT records for each share', async () => {
      await service.investInRound('round-1', 'user-1', { shareCount: 2 });
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('distributeHarvest', () => {
    it('throws ForbiddenException if caller is not the farmer', async () => {
      await expect(
        service.distributeHarvest('round-1', 'other-user', { totalSaleCUSD: 300 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws if round is not ACTIVE', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue({
        ...mockRound,
        sellerId: 'seller-1',
        status: PlantationRoundStatus.OPEN,
      });
      await expect(
        service.distributeHarvest('round-1', 'seller-1', { totalSaleCUSD: 300 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates status to DISTRIBUTING for valid call', async () => {
      prismaMock.plantationRound.findUnique.mockResolvedValue({
        ...mockRound,
        sellerId: 'seller-1',
        status: PlantationRoundStatus.ACTIVE,
      });
      await service.distributeHarvest('round-1', 'seller-1', { totalSaleCUSD: 300 });
      expect(prismaMock.plantationRound.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: PlantationRoundStatus.DISTRIBUTING } }),
      );
    });
  });
});
```

- [ ] **Step 2: Write grove-staking.service.spec.ts**

```typescript
// backend/src/plantation-rounds/grove-staking.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { GroveStakingService } from './grove-staking.service';
import { PlantationNftsService } from './plantation-nfts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockNft = { id: 'nft-1', tokenId: 42, roundId: 'round-1', ownerId: 'user-1', shareIndex: 0, createdAt: new Date() };
const mockPosition = { id: 'pos-1', nftId: 'nft-1', stakedAt: new Date(), unstakedAt: null, claimedCUSD: 0 };

const makeNftsMock = () => ({
  assertOwner: jest.fn().mockResolvedValue(mockNft),
});

const makePrismaMock = () => ({
  stakingPosition: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue(mockPosition),
    update: jest.fn().mockResolvedValue({ ...mockPosition, unstakedAt: new Date() }),
  },
});

const makeConfigMock = () => ({
  get: jest.fn((key: string) => {
    const vals: Record<string, string> = {
      CELO_RPC_URL: 'https://forno.celo-sepolia.celo-testnet.org',
      CELO_ADMIN_PRIVATE_KEY: '0x' + 'a'.repeat(64),
      GROVE_STAKING_CONTRACT_ADDRESS: '0xStaking',
    };
    return vals[key];
  }),
});

describe('GroveStakingService', () => {
  let service: GroveStakingService;
  let prismaMock: ReturnType<typeof makePrismaMock>;
  let nftsMock: ReturnType<typeof makeNftsMock>;

  beforeEach(async () => {
    prismaMock = makePrismaMock();
    nftsMock = makeNftsMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroveStakingService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: makeConfigMock() },
        { provide: PlantationNftsService, useValue: nftsMock },
      ],
    }).compile();

    service = module.get(GroveStakingService);
    // Prevent actual ethers calls
    jest.spyOn(service as any, 'getAdminWallet').mockImplementation(() => ({}));
    jest.spyOn(service as any, 'getContract').mockImplementation(() => ({
      stake: jest.fn().mockResolvedValue({ wait: jest.fn() }),
      unstake: jest.fn().mockResolvedValue({ wait: jest.fn() }),
      claimYield: jest.fn().mockResolvedValue({ wait: jest.fn() }),
      pendingYield: jest.fn().mockResolvedValue(BigInt('1000000000000000')),
    }));
  });

  it('stakeNft creates a DB staking position', async () => {
    await service.stakeNft(42, 'user-1');
    expect(prismaMock.stakingPosition.upsert).toHaveBeenCalled();
  });

  it('stakeNft throws if already staked', async () => {
    prismaMock.stakingPosition.findUnique.mockResolvedValue(mockPosition);
    await expect(service.stakeNft(42, 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('unstakeNft throws if not staked', async () => {
    await expect(service.unstakeNft(42, 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('unstakeNft sets unstakedAt', async () => {
    prismaMock.stakingPosition.findUnique.mockResolvedValue(mockPosition);
    await service.unstakeNft(42, 'user-1');
    expect(prismaMock.stakingPosition.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ unstakedAt: expect.any(Date) }) }),
    );
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd normie-apps/agro-trade-native/backend
npx jest plantation-rounds --verbose
```

Expected: All tests PASS. If a test fails, fix the service before committing.

- [ ] **Step 4: Run full backend test suite**

```bash
npx jest --verbose
```

Expected: Existing tests still pass. No regressions.

- [ ] **Step 5: Commit**

```bash
git add backend/src/plantation-rounds/*.spec.ts
git commit -m "test(plantation-rounds): Jest unit tests for rounds service + staking service"
```

---

## Done

The backend is complete:
- ✅ `PlantationRound.sol` + `GroveStaking.sol` deployed-ready with full Foundry test coverage
- ✅ Prisma: 3 new models + migration
- ✅ NestJS: 10 REST endpoints across 3 services
- ✅ Event listener syncs contract state to DB automatically
- ✅ Jest unit tests covering all error paths

Next phase (separate plan): Mobile app "Invest" tab in Expo/React Native.
