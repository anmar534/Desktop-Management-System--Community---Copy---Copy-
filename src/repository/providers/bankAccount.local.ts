import type { IBankAccountRepository } from '@/repository/bankAccount.repository'
import type { BankAccount } from '@/data/centralData'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/config/storageKeys'
import { APP_EVENTS, emit } from '@/events/bus'
import {
  sanitizeBankAccountCollection,
  validateBankAccount,
  validateBankAccountPayload,
  validateBankAccountUpdate,
  ValidationError
} from '@/domain/validation'

const generateId = () => `bank_account_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

const loadAll = (): BankAccount[] => {
  const stored = safeLocalStorage.getItem<BankAccount[]>(STORAGE_KEYS.BANK_ACCOUNTS, [])
  const source = Array.isArray(stored) ? stored : []
  const sanitized = sanitizeBankAccountCollection(source)

  if (sanitized.length !== source.length || hasDifferences(source, sanitized)) {
    persist(sanitized)
  }

  return [...sanitized]
}

const persist = (accounts: BankAccount[]): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, accounts)
}

const emitUpdate = () => emit(APP_EVENTS.BANK_ACCOUNTS_UPDATED)

const hasDifferences = (original: BankAccount[], sanitized: BankAccount[]): boolean => {
  if (original.length !== sanitized.length) {
    return true
  }

  for (let index = 0; index < original.length; index += 1) {
    if (JSON.stringify(original[index]) !== JSON.stringify(sanitized[index])) {
      return true
    }
  }

  return false
}

export class LocalBankAccountRepository implements IBankAccountRepository {
  async getAll(): Promise<BankAccount[]> {
    return loadAll()
  }

  async getById(id: string): Promise<BankAccount | null> {
    const accounts = loadAll()
    return accounts.find(account => account.id === id) ?? null
  }

  async create(account: Omit<BankAccount, 'id'> & Partial<Pick<BankAccount, 'id'>>): Promise<BankAccount> {
    const accounts = loadAll()
    const payload = validateBankAccountPayload(account)
    const record = validateBankAccount({
      ...payload,
      id: payload.id ?? generateId()
    })
    accounts.push(record)
    persist(accounts)
    emitUpdate()
    return record
  }

  async upsert(account: BankAccount): Promise<BankAccount> {
    const accounts = loadAll()
    const sanitized = validateBankAccount(account)
    const index = accounts.findIndex(item => item.id === sanitized.id)

    if (index >= 0) {
      accounts[index] = validateBankAccount({ ...accounts[index], ...sanitized })
      persist(accounts)
      emitUpdate()
      return accounts[index]
    }

    const record = validateBankAccount({ ...sanitized, id: sanitized.id ?? generateId() })
    accounts.push(record)
    persist(accounts)
    emitUpdate()
    return record
  }

  async update(id: string, updates: Partial<BankAccount>): Promise<BankAccount | null> {
    const accounts = loadAll()
    const index = accounts.findIndex(account => account.id === id)
    if (index === -1) {
      return null
    }

    const sanitizedUpdates = validateBankAccountUpdate({ ...updates, id })
    const updated = validateBankAccount({ ...accounts[index], ...sanitizedUpdates, id })
    accounts[index] = updated
    persist(accounts)
    emitUpdate()
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const accounts = loadAll()
    const filtered = accounts.filter(account => account.id !== id)
    if (filtered.length === accounts.length) {
      return false
    }
    persist(filtered)
    emitUpdate()
    return true
  }

  async importMany(accounts: BankAccount[], options: { replace?: boolean } = {}): Promise<BankAccount[]> {
    const shouldReplace = options.replace ?? true
    const current = shouldReplace ? [] : loadAll()

    for (const account of accounts) {
      try {
        const sanitized = validateBankAccount({ ...account, id: account.id ?? generateId() })
        const index = current.findIndex(existing => existing.id === sanitized.id)
        if (index >= 0) {
          current[index] = validateBankAccount({ ...current[index], ...sanitized })
        } else {
          current.push(sanitized)
        }
      } catch (error) {
        console.warn(error instanceof ValidationError ? error.message : 'Failed to import bank account entry')
      }
    }

    persist(current)
    emitUpdate()
    return current
  }

  async reload(): Promise<BankAccount[]> {
    const accounts = loadAll()
    emitUpdate()
    return accounts
  }
}

export const bankAccountRepository = new LocalBankAccountRepository()
