import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  generateNonce,
  createNonceMessage,
  verifySignature,
  findOrCreateUser,
  signJwt,
} from '../services/auth.js';
import { isValidPublicKey } from '../lib/solana.js';

const app = new Hono();

const nonceSchema = z.object({
  publicKey: z.string().refine(isValidPublicKey, {
    message: 'Invalid Solana public key',
  }),
});

const verifySchema = z.object({
  publicKey: z.string(),
  signature: z.string(),
  nonce: z.string(),
});

app.post('/nonce', zValidator('json', nonceSchema), async (c) => {
  const { publicKey } = c.req.valid('json');
  const nonce = generateNonce();
  const message = createNonceMessage(nonce);

  return c.json({
    nonce,
    message,
    publicKey,
  });
});

app.post('/verify', zValidator('json', verifySchema), async (c) => {
  const { publicKey, signature, nonce } = c.req.valid('json');

  if (!isValidPublicKey(publicKey)) {
    return c.json({ error: 'Invalid public key' }, 400);
  }

  const message = createNonceMessage(nonce);
  const valid = verifySignature(publicKey, signature, message);

  if (!valid) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const user = await findOrCreateUser(publicKey);
  const token = signJwt({ userId: user.id, publicKey: user.publicKey });

  return c.json({
    token,
    user: {
      id: user.id,
      publicKey: user.publicKey,
      createdAt: user.createdAt,
    },
  });
});

export default app;
