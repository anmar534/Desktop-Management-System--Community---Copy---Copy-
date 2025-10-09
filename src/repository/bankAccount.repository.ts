import type { BankAccount } from '@/data/centralData'

export interface IBankAccountRepository {
  getAll(): Promise<BankAccount[]>
  getById(id: string): Promise<BankAccount | null>
  create(account: Omit<BankAccount, 'id'> & Partial<Pick<BankAccount, 'id'>>): Promise<BankAccount>
  upsert(account: BankAccount): Promise<BankAccount>
  update(id: string, updates: Partial<BankAccount>): Promise<BankAccount | null>
  delete(id: string): Promise<boolean>
  importMany(accounts: BankAccount[], options?: { replace?: boolean }): Promise<BankAccount[]>
  reload(): Promise<BankAccount[]>
}
