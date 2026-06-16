import { chromium } from '@playwright/test';
const base = 'http://localhost:5175/';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist'] });
const page = await b.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.addInitScript(() => { try { localStorage.setItem('trench-royale-onboarding-complete','1') } catch {} });
await page.goto(base, { waitUntil: 'load' }).catch(()=>{});
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/game_menu.png' });
// guest login
try { await page.click('[data-testid=guest]', { timeout: 4000 }); await page.waitForTimeout(3500); } catch(e){ console.log('guest:', e.message); }
await page.screenshot({ path: '/tmp/game_menu_in.png' });
// practice battle
try { await page.click('[data-testid=practice]', { timeout: 4000 }); await page.waitForTimeout(6000); } catch(e){ console.log('practice:', e.message); }
await page.screenshot({ path: '/tmp/game_battle.png' });
await b.close();
console.log('done');
