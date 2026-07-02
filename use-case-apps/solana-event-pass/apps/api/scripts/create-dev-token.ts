import '../src/config.js';
import { db } from '../src/db.js';
import { signJwt } from '../src/services/auth.js';

async function main() {
  const publicKey = process.argv[2] || '11111111111111111111111111111111';

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.publicKey, publicKey),
  });

  if (!user) {
    console.error('User not found for public key:', publicKey);
    process.exit(1);
  }

  const token = signJwt({ userId: user.id, publicKey: user.publicKey });
  console.log(token);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
