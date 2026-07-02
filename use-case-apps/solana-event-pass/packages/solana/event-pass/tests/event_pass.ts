import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EventPass } from "../target/types/event_pass.ts";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { randomBytes } from "crypto";
import { assert } from "chai";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("event-pass", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.EventPass as Program<EventPass>;

  const organizer = Keypair.generate();
  const attendee = Keypair.generate();
  const vendor = Keypair.generate();

  let usdcMint: PublicKey;
  let organizerUsdc: PublicKey;
  let attendeeUsdc: PublicKey;
  let vendorUsdc: PublicKey;
  const eventId = Buffer.from(randomBytes(16));

  before(async () => {
    // Airdrop SOL to all participants.
    for (const kp of [organizer, attendee, vendor]) {
      const sig = await provider.connection.requestAirdrop(
        kp.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }
    await sleep(300);

    // Create a fake USDC mint (decimals = 6) owned by organizer.
    usdcMint = await createMint(
      provider.connection,
      organizer,
      organizer.publicKey,
      null,
      6
    );

    organizerUsdc = await createAssociatedTokenAccount(
      provider.connection,
      organizer,
      usdcMint,
      organizer.publicKey
    );
    attendeeUsdc = await createAssociatedTokenAccount(
      provider.connection,
      attendee,
      usdcMint,
      attendee.publicKey
    );
    vendorUsdc = await createAssociatedTokenAccount(
      provider.connection,
      vendor,
      usdcMint,
      vendor.publicKey
    );

    // Fund attendee with 1_000 USDC.
    await mintTo(
      provider.connection,
      organizer,
      usdcMint,
      attendeeUsdc,
      organizer,
      1_000_000_000
    );
  });

  it("initializes an event", async () => {
    await program.methods
      .initializeEvent(Array.from(eventId))
      .accounts({
        organizer: organizer.publicKey,
      })
      .signers([organizer])
      .rpc();

    const [eventStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event_state"), eventId],
      program.programId
    );
    const eventState = await program.account.eventState.fetch(eventStatePda);
    assert.isTrue(eventState.active);
    assert.deepEqual(Array.from(eventState.eventId), Array.from(eventId));
    assert.equal(eventState.organizer.toBase58(), organizer.publicKey.toBase58());
  });

  const eventStatePda = PublicKey.findProgramAddressSync(
    [Buffer.from("event_state"), eventId],
    program.programId
  )[0];
  const tokenMintPda = PublicKey.findProgramAddressSync(
    [Buffer.from("event_token_mint"), eventId],
    program.programId
  )[0];
  const escrowPda = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_usdc"), eventId],
    program.programId
  )[0];

  it("creates the event token mint", async () => {
    await program.methods
      .createTokenMint(Array.from(eventId))
      .accounts({
        organizer: organizer.publicKey,
      })
      .signers([organizer])
      .rpc();

    const [eventStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event_state"), eventId],
      program.programId
    );
    const eventState = await program.account.eventState.fetch(eventStatePda);
    assert.isFalse(eventState.tokenMint.equals(PublicKey.default));
  });

  it("creates the USDC escrow account", async () => {
    await program.methods
      .createEscrow(Array.from(eventId))
      .accounts({
        organizer: organizer.publicKey,
        usdcMint,
      })
      .signers([organizer])
      .rpc();

    const [eventStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event_state"), eventId],
      program.programId
    );
    const eventState = await program.account.eventState.fetch(eventStatePda);
    assert.isFalse(eventState.escrowUsdc.equals(PublicKey.default));
  });

  it("tops up USDC and mints event tokens", async () => {
    const [tokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event_token_mint"), eventId],
      program.programId
    );

    const attendeeTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      attendee,
      tokenMintPda,
      attendee.publicKey
    );

    await program.methods
      .topUp(new anchor.BN(100_000_000))
      .accounts({
        attendee: attendee.publicKey,
        eventState: eventStatePda,
        tokenMint: tokenMintPda,
        escrowUsdc: escrowPda,
        attendeeTokenAccount,
        attendeeUsdcAccount: attendeeUsdc,
        usdcMint,
      } as any)
      .signers([attendee])
      .rpc();

    const tokenAccount = await getAccount(provider.connection, attendeeTokenAccount);
    assert.equal(tokenAccount.amount.toString(), "100000000");

    const escrow = await getAccount(
      provider.connection,
      (
        await program.account.eventState.fetch(
          PublicKey.findProgramAddressSync(
            [Buffer.from("event_state"), eventId],
            program.programId
          )[0]
        )
      ).escrowUsdc
    );
    assert.equal(escrow.amount.toString(), "100000000");
  });

  it("pays a vendor with event tokens", async () => {
    const attendeeTokenAccount = await provider.connection.getTokenAccountsByOwner(
      attendee.publicKey,
      { mint: tokenMintPda }
    );

    await program.methods
      .payVendor(new anchor.BN(40_000_000))
      .accounts({
        attendee: attendee.publicKey,
        eventState: eventStatePda,
        tokenMint: tokenMintPda,
        escrowUsdc: escrowPda,
        attendeeTokenAccount: attendeeTokenAccount.value[0].pubkey,
        vendor: vendor.publicKey,
        vendorUsdcAccount: vendorUsdc,
        attendeeUsdcAccount: attendeeUsdc,
        usdcMint,
      } as any)
      .signers([attendee])
      .rpc();

    const attendeeTokenAccountAfter = await provider.connection.getTokenAccountsByOwner(
      attendee.publicKey,
      { mint: tokenMintPda }
    );
    const tokenAccount = await getAccount(
      provider.connection,
      attendeeTokenAccountAfter.value[0].pubkey
    );
    assert.equal(tokenAccount.amount.toString(), "60000000");

    const vendorUsdcAcc = await getAccount(provider.connection, vendorUsdc);
    assert.equal(vendorUsdcAcc.amount.toString(), "40000000");
  });

  it("redeems unused event tokens for USDC", async () => {
    const attendeeTokenAccount = await provider.connection.getTokenAccountsByOwner(
      attendee.publicKey,
      { mint: tokenMintPda }
    );

    await program.methods
      .redeemUnused(new anchor.BN(10_000_000))
      .accounts({
        attendee: attendee.publicKey,
        eventState: eventStatePda,
        tokenMint: tokenMintPda,
        escrowUsdc: escrowPda,
        attendeeTokenAccount: attendeeTokenAccount.value[0].pubkey,
        attendeeUsdcAccount: attendeeUsdc,
        usdcMint,
      } as any)
      .signers([attendee])
      .rpc();

    const attendeeUsdcAcc = await getAccount(provider.connection, attendeeUsdc);
    assert.equal(attendeeUsdcAcc.amount.toString(), "910000000");
  });

  it("closes the event and returns remaining USDC to the organizer", async () => {
    const eventStatePda = PublicKey.findProgramAddressSync(
      [Buffer.from("event_state"), eventId],
      program.programId
    )[0];
    const eventState = await program.account.eventState.fetch(eventStatePda);

    await program.methods
      .closeEvent()
      .accounts({
        organizer: organizer.publicKey,
        eventState: eventStatePda,
        escrowUsdc: eventState.escrowUsdc,
        organizerUsdcAccount: organizerUsdc,
        usdcMint,
      } as any)
      .signers([organizer])
      .rpc();

    const organizerUsdcAcc = await getAccount(provider.connection, organizerUsdc);
    assert.equal(organizerUsdcAcc.amount.toString(), "50000000");

    const closedState = await program.account.eventState.fetch(eventStatePda);
    assert.isFalse(closedState.active);
  });
});
