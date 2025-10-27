import type { IProjectRepository } from '@/repository/project.repository'
import type { ITenderRepository } from '@/repository/providers/tender.local'
import type { IClientRepository } from '@/repository/client.repository'
import type { IBOQRepository } from '@/repository/boq.repository'
import type { IPurchaseOrderRepository } from '@/repository/purchaseOrder.repository'
import type { IRelationRepository } from '@/repository/relations.repository'
import type { IBankAccountRepository } from '@/repository/bankAccount.repository'
import type { IInvoiceRepository } from '@/repository/invoice.repository'
import type { IBudgetRepository } from '@/repository/budget.repository'
import type { IFinancialReportRepository } from '@/repository/financialReport.repository'
import type { IEnhancedProjectRepository } from '@/repository/enhancedProject.repository'
import { projectRepository as defaultProjectRepository } from '@/repository/providers/project.local'
import { tenderRepository as defaultTenderRepository } from '@/repository/providers/tender.local'
import { clientRepository as defaultClientRepository } from '@/repository/providers/client.local'
import { boqRepository as defaultBOQRepository } from '@/repository/providers/boq.local'
import { purchaseOrderRepository as defaultPurchaseOrderRepository } from '@/repository/providers/purchaseOrder.local'
import { relationRepository as defaultRelationRepository } from '@/repository/providers/relations.local'
import { bankAccountRepository as defaultBankAccountRepository } from '@/repository/providers/bankAccount.local'
import { invoiceRepository as defaultInvoiceRepository } from '@/repository/providers/invoice.local'
import { budgetRepository as defaultBudgetRepository } from '@/repository/providers/budget.local'
import { financialReportRepository as defaultFinancialReportRepository } from '@/repository/providers/financialReport.local'
import defaultEnhancedProjectRepository from '@/repository/providers/enhancedProject.local'

export interface RepositoryRegistry {
  projectRepository: IProjectRepository
  tenderRepository: ITenderRepository
  clientRepository: IClientRepository
  boqRepository: IBOQRepository
  purchaseOrderRepository: IPurchaseOrderRepository
  relationRepository: IRelationRepository
  bankAccountRepository: IBankAccountRepository
  invoiceRepository: IInvoiceRepository
  budgetRepository: IBudgetRepository
  financialReportRepository: IFinancialReportRepository
  enhancedProjectRepository: IEnhancedProjectRepository
}

const defaultRegistry: RepositoryRegistry = {
  projectRepository: defaultProjectRepository,
  tenderRepository: defaultTenderRepository,
  clientRepository: defaultClientRepository,
  boqRepository: defaultBOQRepository,
  purchaseOrderRepository: defaultPurchaseOrderRepository,
  relationRepository: defaultRelationRepository,
  bankAccountRepository: defaultBankAccountRepository,
  invoiceRepository: defaultInvoiceRepository,
  budgetRepository: defaultBudgetRepository,
  financialReportRepository: defaultFinancialReportRepository,
  enhancedProjectRepository: defaultEnhancedProjectRepository,
}

const registry: RepositoryRegistry = { ...defaultRegistry }

export type RepositoryOverrides = Partial<RepositoryRegistry>

function assignRegistry(overrides: RepositoryOverrides) {
  if (overrides.projectRepository) {
    registry.projectRepository = overrides.projectRepository
  }
  if (overrides.tenderRepository) {
    registry.tenderRepository = overrides.tenderRepository
  }
  if (overrides.clientRepository) {
    registry.clientRepository = overrides.clientRepository
  }
  if (overrides.boqRepository) {
    registry.boqRepository = overrides.boqRepository
  }
  if (overrides.purchaseOrderRepository) {
    registry.purchaseOrderRepository = overrides.purchaseOrderRepository
  }
  if (overrides.relationRepository) {
    registry.relationRepository = overrides.relationRepository
  }
  if (overrides.bankAccountRepository) {
    registry.bankAccountRepository = overrides.bankAccountRepository
  }
  if (overrides.invoiceRepository) {
    registry.invoiceRepository = overrides.invoiceRepository
  }
  if (overrides.budgetRepository) {
    registry.budgetRepository = overrides.budgetRepository
  }
  if (overrides.financialReportRepository) {
    registry.financialReportRepository = overrides.financialReportRepository
  }
  if (overrides.enhancedProjectRepository) {
    registry.enhancedProjectRepository = overrides.enhancedProjectRepository
  }
}

export function snapshotRepositoryRegistry(): RepositoryRegistry {
  return { ...registry }
}

export function applyRepositoryOverrides(overrides: RepositoryOverrides = {}): () => void {
  const previous = snapshotRepositoryRegistry()
  assignRegistry(overrides)
  return () => {
    assignRegistry(previous)
  }
}

export function resetRepositoryRegistry() {
  assignRegistry(defaultRegistry)
}

export function registerProjectRepository(repository: IProjectRepository) {
  registry.projectRepository = repository
}

export function registerTenderRepository(repository: ITenderRepository) {
  registry.tenderRepository = repository
}

export function registerClientRepository(repository: IClientRepository) {
  registry.clientRepository = repository
}

export function registerBOQRepository(repository: IBOQRepository) {
  registry.boqRepository = repository
}

export function registerPurchaseOrderRepository(repository: IPurchaseOrderRepository) {
  registry.purchaseOrderRepository = repository
}

export function registerRelationRepository(repository: IRelationRepository) {
  registry.relationRepository = repository
}

export function registerBankAccountRepository(repository: IBankAccountRepository) {
  registry.bankAccountRepository = repository
}

export function registerInvoiceRepository(repository: IInvoiceRepository) {
  registry.invoiceRepository = repository
}

export function registerBudgetRepository(repository: IBudgetRepository) {
  registry.budgetRepository = repository
}

export function registerFinancialReportRepository(repository: IFinancialReportRepository) {
  registry.financialReportRepository = repository
}

export function getProjectRepository(): IProjectRepository {
  return registry.projectRepository
}

export function getTenderRepository(): ITenderRepository {
  return registry.tenderRepository
}

export function getClientRepository(): IClientRepository {
  return registry.clientRepository
}

export function getBOQRepository(): IBOQRepository {
  return registry.boqRepository
}

export function getPurchaseOrderRepository(): IPurchaseOrderRepository {
  return registry.purchaseOrderRepository
}

export function getRelationRepository(): IRelationRepository {
  return registry.relationRepository
}

export function getBankAccountRepository(): IBankAccountRepository {
  return registry.bankAccountRepository
}

export function getInvoiceRepository(): IInvoiceRepository {
  return registry.invoiceRepository
}

export function getBudgetRepository(): IBudgetRepository {
  return registry.budgetRepository
}

export function getFinancialReportRepository(): IFinancialReportRepository {
  return registry.financialReportRepository
}

export function getEnhancedProjectRepository(): IEnhancedProjectRepository {
  return registry.enhancedProjectRepository
}
