import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";
import { coinflipWs } from "./coinflip.ws.ts";

const COINFLIP_FEE_RATE = 0.02; // 2% house edge

export class CoinflipService {
  constructor(private readonly prisma: PrismaClient) {}

  private generateRoll(serverSeed: string, clientSeed: string, nonce: number): number {
    const hash = crypto
      .createHmac("sha256", serverSeed)
      .update(`${clientSeed}:${nonce}`)
      .digest("hex");

    const int = parseInt(hash.substring(0, 8), 16);
    return int / 0xffffffff; // [0, 1)
  }

  async createGame(userId: string, amount: number, creatorSide: "CT" | "T") {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || Number(user.walletBalance) < amount) {
      return { success: false, error: "Insufficient balance" };
    }

    const game = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      });

      return tx.coinflipGame.create({
        data: {
          creatorId: userId,
          amount,
          creatorSide,
          status: "WAITING",
        },
      });
    });

    return { success: true, game };
  }

  async joinGame(gameId: string, joinerId: string) {
    const game = await this.prisma.coinflipGame.findUnique({ where: { id: gameId } });
    if (!game || game.status !== "WAITING") {
      return { success: false, error: "Game not available" };
    }
    if (game.creatorId === joinerId) {
      return { success: false, error: "Cannot join your own game" };
    }

    const joiner = await this.prisma.user.findUnique({ where: { id: joinerId } });
    if (!joiner || Number(joiner.walletBalance) < Number(game.amount)) {
      return { success: false, error: "Insufficient balance" };
    }

    const serverSeed = crypto.randomBytes(32).toString("hex");
    const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
    const roll = this.generateRoll(serverSeed, `coinflip-${gameId}`, 0);

    // < 0.5 = CT wins, >= 0.5 = T wins
    const winnerSide = roll < 0.5 ? "CT" : "T";
    const winnerId = winnerSide === game.creatorSide ? game.creatorId : joinerId;
    const totalPot = Number(game.amount) * 2;
    const fee = totalPot * COINFLIP_FEE_RATE;
    const payout = totalPot - fee;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Debit joiner
      await tx.user.update({
        where: { id: joinerId },
        data: { walletBalance: { decrement: Number(game.amount) } },
      });

      // Credit winner
      await tx.user.update({
        where: { id: winnerId },
        data: { walletBalance: { increment: payout } },
      });

      // Update game
      return tx.coinflipGame.update({
        where: { id: gameId },
        data: {
          joinerId,
          serverSeed,
          serverSeedHash,
          roll,
          winnerId,
          status: "COMPLETE",
          completedAt: new Date(),
        },
      });
    });

    // Fetch full game with relations for the WS payload
    const fullGame = await this.prisma.coinflipGame.findUnique({
      where: { id: gameId },
      include: {
        creator: { select: { steamName: true, avatarUrl: true } },
        joiner:  { select: { steamName: true, avatarUrl: true } },
        winner:  { select: { steamName: true } },
      },
    });

    if (fullGame && fullGame.winnerId) {
      coinflipWs.notifyMatched(game.creatorId, joinerId, fullGame);
      // small delay so client can mount the scene before result fires
      setTimeout(() => {
        coinflipWs.notifyResult(game.creatorId, joinerId, {
          winnerId: fullGame.winnerId!,
          game: fullGame,
        });
      }, 4500); // matches animation duration in the frontend
    }

    return {
      success: true,
      game: updated,
      roll,
      winnerSide,
      winnerId,
      payout,
      fee,
    };
  }

  async cancelGame(userId: string, gameId: string) {
    const game = await this.prisma.coinflipGame.findUnique({ where: { id: gameId } });
    if (!game || game.status !== "WAITING") {
      return { success: false, error: "Game cannot be cancelled" };
    }
    if (game.creatorId !== userId) {
      return { success: false, error: "Only creator can cancel" };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: Number(game.amount) } },
      });

      await tx.coinflipGame.update({
        where: { id: gameId },
        data: { status: "COMPLETE", completedAt: new Date() },
      });
    });

    return { success: true };
  }

  async getOpenGames() {
    return this.prisma.coinflipGame.findMany({
      where: { status: "WAITING" },
      include: {
        creator: { select: { steamName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getGame(gameId: string) {
    return this.prisma.coinflipGame.findUnique({
      where: { id: gameId },
      include: {
        creator: { select: { steamName: true } },
        joiner: { select: { steamName: true } },
        winner: { select: { steamName: true } },
      },
    });
  }

  async getHistory(userId: string, limit = 50) {
    return this.prisma.coinflipGame.findMany({
      where: {
        status: "COMPLETE",
        OR: [{ creatorId: userId }, { joinerId: userId }],
      },
      orderBy: { completedAt: "desc" },
      take: limit,
      include: {
        creator: { select: { steamName: true } },
        joiner: { select: { steamName: true } },
        winner: { select: { steamName: true } },
      },
    });
  }
}
