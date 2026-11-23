import { chromium, firefox, webkit } from 'playwright';

const base = process.env.E2E_URL || 'http://127.0.0.1:5174';
const api = process.env.API_URL || 'http://127.0.0.1:8000/api/v1';
const failures = [];
const notes = [];
const engineName = process.env.E2E_ENGINE || 'chromium';
const engine = engineName === 'webkit' ? webkit : engineName === 'firefox' ? firefox : chromium;
let browser;
try { browser = await engine.launch({ headless: true }); } catch (error) { console.error(`E2E engine ${engineName} unavailable: ${error.message}`); process.exit(2); }
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error') failures.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));

async function expectText(text, label) {
  let visible = false;
  for (let attempt = 0; attempt < 8; attempt++) { visible = await page.getByText(text, { exact: false }).first().isVisible().catch(() => false); if (visible) break; await page.waitForTimeout(500); }
  if (!visible) throw new Error(`${label}: missing text ${text}`);
}
async function route(path, label) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  if (!page.url().startsWith(base)) throw new Error(`${label}: unexpected URL ${page.url()}`);
  notes.push(`${label}: ${page.url()}`);
}

const apiProducts = await (await fetch(`${api}/products`)).json();
const productList = Array.isArray(apiProducts) ? apiProducts : apiProducts.items;
if (!Array.isArray(productList) || productList.length < 36) throw new Error(`API product count ${Array.isArray(productList) ? productList.length : 'invalid response'}`);
notes.push(`API: ${productList.length} products (36 seeded baseline)`);

await route('/', 'home');
await expectText('Flowers, Beautifully Told.', 'home');
await route('/shop', 'shop');
await expectText('The whole cooler', 'shop');
const search = page.getByLabel('Search the shop');
await search.fill('peony');
await page.waitForTimeout(300);
const cardCount = await page.locator('article').count();
if (cardCount < 1) throw new Error(`shop search returned ${cardCount} cards`);
notes.push(`shop search: ${cardCount} cards`);
await route('/collections', 'collections');
await expectText('Six ways to say it with flowers.', 'collections');
await route('/about', 'about');
await expectText('A studio built on', 'about');
await route('/delivery', 'delivery');
await expectText('Delivered by hand', 'delivery');
await route('/contact', 'contact');
await expectText('Tell us what you are', 'contact');

await route('/shop', 'cart flow shop');
const add = page.getByRole('button', { name: /Quick add/i }).first();
if (await add.count()) {
  await add.click();
  await page.waitForTimeout(300);
  await expectText('Your selection', 'cart drawer');
  notes.push('cart: quick-add opened drawer');
} else {
  notes.push('cart: no quick-add control visible');
}

const owner = await context.request.post(`${api}/auth/setup`, { data: { email: `closure-owner-${Date.now()}@example.com`, name: 'Closure Owner', password: 'closure-test-password-2026' } });
if (![201, 409].includes(owner.status())) throw new Error(`owner setup ${owner.status()} ${await owner.text()}`);
await route('/admin', 'admin');
await page.waitForTimeout(500);
const adminText = await page.locator('body').innerText();
if (!/Dashboard|Business PRO mode is off|Welcome back|Create the owner account/.test(adminText)) throw new Error('admin shell did not render');
notes.push('admin: shell rendered');

await browser.close();
if (failures.length) {
  console.error(JSON.stringify({ failures, notes }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ failures: [], notes }, null, 2));
