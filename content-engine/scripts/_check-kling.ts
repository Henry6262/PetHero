import { accountCosts } from '../src/lib/kling';
try {
  const d = await accountCosts();
  console.log(JSON.stringify(d, null, 2));
} catch (e) {
  console.error('ERR', (e as Error).message);
}
