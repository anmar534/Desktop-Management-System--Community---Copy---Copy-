// Create a demo tender + pricing directly in electron-store (config.json)
// Safe to run multiple times; it will upsert by id

const fs = require('fs');
const path = require('path');
const os = require('os');

const APP_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'desktop-management-system-community');
const CONFIG_PATH = path.join(APP_DIR, 'config.json');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to read config.json:', e);
    return {};
  }
}

function writeConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write config.json:', e);
    process.exit(1);
  }
}

function upsertArrayString(strOrNull, newItem, matchFn) {
  let arr = [];
  try { if (strOrNull) arr = JSON.parse(strOrNull); } catch {}
  const idx = arr.findIndex(matchFn);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...newItem }; else arr.push(newItem);
  return JSON.stringify(arr);
}

function upsertPricing(objStrOrNull, tenderId, pricing) {
  let obj = {};
  try { if (objStrOrNull) obj = JSON.parse(objStrOrNull); } catch {}
  obj[tenderId] = { ...(obj[tenderId] || {}), ...pricing };
  return JSON.stringify(obj);
}

function main() {
  ensureDir(APP_DIR);
  const cfg = readConfig();

  const tenderId = `tender_demo_${Date.now()}`;
  const demoTender = {
    id: tenderId,
    name: 'منافسة تجريبية - Demo',
    title: 'Demo Tender',
    client: 'عميل تجريبي',
    value: 123456,
    status: 'submitted',
    phase: 'phase',
    deadline: new Date().toISOString(),
    daysLeft: 7,
    progress: 10,
    priority: 'medium',
    team: 'demo-team',
    manager: 'demo-manager',
    winChance: 50,
    competition: 'open',
    submissionDate: new Date().toISOString(),
    lastAction: 'init',
    lastUpdate: new Date().toISOString(),
    category: 'demo',
    location: 'Riyadh',
    type: 'general',
    documentPrice: 100
  };

  // Upsert tenders array (stringified JSON)
  cfg.app_tenders_data = upsertArrayString(cfg.app_tenders_data, demoTender, (t) => t.id === demoTender.id);

  // Minimal demo pricing object keyed by tender id
  const demoPricing = {
    items: [
      { id: 'i1', description: 'بند 1', qty: 10, unit: 'm', unitPrice: 100, total: 1000 },
      { id: 'i2', description: 'بند 2', qty: 5, unit: 'm2', unitPrice: 200, total: 1000 }
    ],
    total: 2000,
    updatedAt: new Date().toISOString()
  };
  cfg.app_pricing_data = upsertPricing(cfg.app_pricing_data, tenderId, demoPricing);

  writeConfig(cfg);

  // Print a quick confirmation snippet
  try {
    const readBack = JSON.parse(readConfig().app_tenders_data || '[]');
    console.log('✅ تم إنشاء منافسة تسعير تجريبية في electron-store');
    console.log('ID:', tenderId);
    console.log('First item:', readBack[0] || null);
  } catch {}
}

main();
