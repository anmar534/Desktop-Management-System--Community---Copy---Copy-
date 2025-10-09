// Deletes unused cost components files safely
// Run: node scripts/remove-unused-cost-components.js

const fs = require('fs');
const path = require('path');

const root = __dirname ? path.resolve(__dirname, '..') : process.cwd();
const costDir = path.join(root, 'src', 'components', 'cost');
const targets = ['CostTotalsCard.tsx', 'CostExtendedTotals.tsx'];

let removed = 0;
for (const t of targets) {
  const p = path.join(costDir, t);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('🗑️ Removed file:', p);
      removed++;
    } else {
      console.log('ℹ️ File not found (already removed):', p);
    }
  } catch (err) {
    console.error('⚠️ Failed to remove', p, err.message);
    process.exitCode = 1;
  }
}

console.log(`Done. Removed ${removed} file(s).`);
