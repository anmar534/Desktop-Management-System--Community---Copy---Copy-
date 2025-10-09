// Temporary JS re-export to satisfy tests using CommonJS require path '../src/services/centralDataService'
// Ensures MODULE_NOT_FOUND is resolved when requiring centralDataService from test environment.
export * from '../application/services/centralDataService.ts'