/**
 * Migrations Module Entry Point
 * نقطة دخول وحدة الترحيل
 * 
 * Note: CommonJS format for Electron compatibility
 */

const { checkAndRunMigrations, runMigration, getMigrationStatus } = require('./migration-manager.cjs')
const { backfillTenderVersions, testBackfill } = require('./phase5-backfill.cjs')

module.exports = {
  checkAndRunMigrations,
  runMigration,
  getMigrationStatus,
  backfillTenderVersions,
  testBackfill,
}
