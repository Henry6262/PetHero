import nacl from 'tweetnacl';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { config } from '../config.js';
import { users } from '@solana-event-pass/db';

export interface AuthTokenPayload {
  userId: string;
  publicKey: string;
}

export function createNonceMessage(nonce: string): string {
  return `Sign this message to authenticate with Solana Event Pass.\n\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas.`;
}

export function generateNonce(): string {
  return crypto.randomUUID();
}

export function verifySignature(
  publicKeyBase58: string,
  signatureBase58: string,
  message: string,
): boolean {
  try {
    const publicKey = bs58.decode(publicKeyBase58);
    const signature = bs58.decode(signatureBase58);
    const messageBytes = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(messageBytes, signature, publicKey);
  } catch {
    return false;
  }
}

export async function findOrCreateUser(publicKey: string) {
  const existing = await db.query.users.findFirst({
    where: eq(users.publicKey, publicKey),
  });

  if (existing) return existing;

  const [created] = await db.insert(users).values({ publicKey }).returning();
  return created;
}

export function signJwt(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwt(token: string): AuthTokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;
}
