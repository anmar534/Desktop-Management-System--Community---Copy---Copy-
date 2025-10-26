/**
 * Clients Storage Module
 *
 * Centralized storage management for client data.
 * Handles client CRUD operations, search, and filtering.
 *
 * @module storage/modules/ClientsStorage
 */

import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import type { IStorageModule } from '../core/types'
import { StorageManager } from '../core/StorageManager'
import type { Client } from '@/data/centralData'

// ============================================================================
// Clients Storage Module
// ============================================================================

export class ClientsStorage implements IStorageModule {
  readonly name = 'ClientsStorage'
  readonly keys = [STORAGE_KEYS.CLIENTS] as const

  private manager: StorageManager

  constructor(manager: StorageManager = StorageManager.getInstance()) {
    this.manager = manager
  }

  setManager(manager: StorageManager): void {
    this.manager = manager
  }

  async initialize(): Promise<void> {
    // Ensure clients store exists
    const existing = await this.manager.get<Client[] | null>(STORAGE_KEYS.CLIENTS, null)
    if (!existing) {
      await this.manager.set(STORAGE_KEYS.CLIENTS, [])
    }
  }

  async cleanup(): Promise<void> {
    // Optional cleanup logic
  }

  // ============================================================================
  // Client Operations
  // ============================================================================

  /**
   * Get all clients
   */
  async getAll(): Promise<Client[]> {
    const stored = await this.manager.get<Client[]>(STORAGE_KEYS.CLIENTS, [])
    if (!Array.isArray(stored)) {
      return []
    }
    return stored.map((client) => ({ ...client }))
  }

  /**
   * Get client by ID
   */
  async getById(id: string): Promise<Client | null> {
    const clients = await this.getAll()
    return clients.find((client) => client.id === id) ?? null
  }

  /**
   * Save all clients (replace)
   */
  async saveAll(clients: Client[]): Promise<void> {
    await this.manager.set(STORAGE_KEYS.CLIENTS, clients)
  }

  /**
   * Add a new client
   */
  async add(client: Client): Promise<void> {
    const clients = await this.getAll()
    clients.push(client)
    await this.saveAll(clients)
  }

  /**
   * Update an existing client
   */
  async update(id: string, updates: Partial<Client>): Promise<Client | null> {
    const clients = await this.getAll()
    const index = clients.findIndex((client) => client.id === id)

    if (index === -1) {
      return null
    }

    const updated: Client = { ...clients[index], ...updates }
    clients[index] = updated
    await this.saveAll(clients)
    return updated
  }

  /**
   * Delete a client
   */
  async delete(id: string): Promise<boolean> {
    const clients = await this.getAll()
    const nextClients = clients.filter((client) => client.id !== id)

    if (nextClients.length === clients.length) {
      return false
    }

    await this.saveAll(nextClients)
    return true
  }

  /**
   * Search clients by name or email
   */
  async search(query: string): Promise<Client[]> {
    const clients = await this.getAll()
    const lowerQuery = query.toLowerCase()

    return clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(lowerQuery) ||
        client.email?.toLowerCase().includes(lowerQuery),
    )
  }

  /**
   * Check if client exists
   */
  async exists(id: string): Promise<boolean> {
    const client = await this.getById(id)
    return client !== null
  }

  /**
   * Count total clients
   */
  async count(): Promise<number> {
    const clients = await this.getAll()
    return clients.length
  }

  /**
   * Clear all clients
   */
  async clear(): Promise<void> {
    await this.manager.set(STORAGE_KEYS.CLIENTS, [])
  }

  /**
   * Import clients
   */
  async import(clients: Client[]): Promise<void> {
    await this.saveAll(clients)
  }

  /**
   * Export all clients
   */
  async export(): Promise<Client[]> {
    return this.getAll()
  }
}

// Singleton instance
export const clientsStorage = new ClientsStorage()
