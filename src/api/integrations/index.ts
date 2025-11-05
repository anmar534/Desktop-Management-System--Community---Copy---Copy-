/**
 * External Integrations Module
 * Sprint 5.3: تطوير APIs للتكامل الخارجي
 */

// Accounting Integration
export {
  AccountingConnector,
  accountingConnector,
  type AccountingSystem,
  type AccountingSystemType,
  type JournalEntry,
  type JournalEntryLine,
  type ChartOfAccounts,
  type AccountingAccount,
  type AccountType,
  type SyncResult,
  type SyncError,
  type TrialBalance,
  type BalanceSheet,
} from './accountingConnector'

// HR Integration
export {
  HRConnector,
  hrConnector,
  type HRSystem,
  type HRSystemType,
  type Employee,
  type EmployeeStatus,
  type Department,
  type Attendance,
  type AttendanceStatus,
  type LeaveRequest,
  type LeaveType,
  type LeaveStatus,
  type Payroll,
  type PayrollStatus,
} from './hrConnector'

// CRM Integration
export {
  CRMConnector,
  crmConnector,
  type CRMSystem,
  type CRMSystemType,
  type CRMContact,
  type ContactStatus,
  type CRMCompany,
  type CompanyStatus,
  type CRMDeal,
  type DealStage,
  type DealStatus,
  type CRMActivity,
  type ActivityType,
  type ActivityStatus,
} from './crmConnector'

// Webhook Service
// Webhook service archived - not in use
// Previously exported from './webhookService'


