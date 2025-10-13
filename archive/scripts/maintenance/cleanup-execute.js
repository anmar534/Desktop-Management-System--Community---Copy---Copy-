#!/usr/bin/env node
/**
 * Cleanup Execution Script
 * - Moves archive candidates
 * - Deletes SafeRemove files
 * - Updates archive manifest with timestamps
 * Safe items under review are skipped.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const archiveScriptsDir = path.join(root, 'archive', 'scripts');
const archiveDataDir = path.join(root, 'archive', 'data');
const docsArchiveDir = path.join(root, 'docs', 'archive');
const manifestPath = path.join(root, 'archive', 'ARCHIVE_MANIFEST.md');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }
[archiveScriptsDir, archiveDataDir, docsArchiveDir].forEach(ensureDir);

const reviewSet = new Set(['run-full-system.js','run_system.bat','run-system.ps1','smart-electron-launcher.js']);

const archiveScripts = [
  'extract-backup-pricing.js','extract-ldb-data.js','restore-tender-from-pricing.js','RESTORE_PRICING_DATA.js',
  'create-test-tender.js','inject-test-tender.js','fix-project-boq.js','utf16-pricing-recovery.js'
];
const archiveData = [
  'ALL_RECOVERED_DATA.json','RECOVERED_PRICING_DATA.json','RECOVERED_DATA_BACKUP.json','MINIMAL_RECOVERY.json','DATA_BACKUP.json',
  'DETAILED_DATA_BACKUP.json','PRICING_DATA_TO_FIX.json','RAW_PRICING_DATA.txt','RAW_BACKUP_JSON.txt','COMPLETE_RECOVERED_PRICING.json',
  'RECONSTRUCTED_FINAL.json','DUPLICATION_CATALOG.json','inventory.json','RESTORATION_REPORT.json'
];
const archiveDocs = [
  'PRICING_AUDIT_REPORT.md','PRICING_PHASE3_SUMMARY.md','PROJECT_DETAILS_ANALYSIS_REPORT.md','DATA_RECOVERY_REPORT.md',
  'ENHANCED_INTEGRATION_SUMMARY.md','FINAL_IMPROVEMENTS_REPORT.md','DESCRIPTION_FIX_REPORT.md','PHASE_2_UI_IMPROVEMENTS_REPORT.md',
  'MIGRATION_TO_ELECTRON_STORE.md','STORAGE_MIGRATION_REPORT.md','ARCHITECTURAL_IMPROVEMENTS_REPORT.md'
];
const deleteFiles = [
  'final-desktop-simulation.js','deep-pricing-simulation.js','final-integration-validation.js','final-recovery-attempt.js','final-timestamp-fix-test.js',
  'test-pricing-sync-fix.js','test-simple-pricing-fix.js','test-description-fix.js','test-comprehensive-improvements.js','diagnose-zero-values.js',
  'diagnose-description-issue.js','diagnose-description-mapping.js','debug-pricing-summary-data.js','debug-pricing-data-source.js','debug-description-tracking.js',
  'debug-browser-console.js','debug-electron-data.js','check-buttons-live.js','check-pricing-data.js','check-electron-storage.js','check-storage-data.js',
  'check-localStorage.js','recovery-test.js','advanced-pricing-recovery.js','binary-data-recovery.js','binary-data-extractor.js','data-discovery-tool.js',
  'pricing-diagnostics.js','final-comprehensive-description-test.js','final-boq-description-fix.js','test_data.json'
];

function moveFile(file, targetDir){
  const src = path.join(root, file);
  if(!fs.existsSync(src)) return {file, status:'missing'};
  const dest = path.join(targetDir, file);
  fs.renameSync(src, dest);
  return {file, status:'moved', dest};
}
function deleteFile(file){
  if(reviewSet.has(file)) return {file, status:'skipped-review'};
  const p = path.join(root, file);
  if(!fs.existsSync(p)) return {file, status:'missing'};
  fs.rmSync(p, {force:true});
  return {file, status:'deleted'};
}

const results = { scripts:[], data:[], docs:[], deleted:[] };
archiveScripts.forEach(f => results.scripts.push(moveFile(f, archiveScriptsDir)));
archiveData.forEach(f => results.data.push(moveFile(f, archiveDataDir)));
archiveDocs.forEach(f => results.docs.push(moveFile(f, docsArchiveDir)));
deleteFiles.forEach(f => results.deleted.push(deleteFile(f)));

function appendManifest(){
  const lines = [];
  lines.push(`\n\n## Execution Run @ ${new Date().toISOString()}`);
  for(const [key, arr] of Object.entries(results)){
    lines.push(`\n### ${key}`);
    arr.forEach(r => lines.push(`- ${r.file}: ${r.status}${r.dest?` -> ${path.relative(root, r.dest)}`:''}`));
  }
  fs.appendFileSync(manifestPath, lines.join('\n'), 'utf8');
}
appendManifest();

console.log('✅ Cleanup phase completed (move/delete). Summary:');
console.log(JSON.stringify(results, null, 2));
