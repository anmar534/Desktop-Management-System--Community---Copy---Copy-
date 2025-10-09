import type { IClientRepository } from '../client.repository';
import type { Client } from '@/data/centralData';
import { safeLocalStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/config/storageKeys';
import { APP_EVENTS, emit } from '@/events/bus';

const generateId = () => `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const loadAll = (): Client[] => {
  const stored = safeLocalStorage.getItem<Client[]>(STORAGE_KEYS.CLIENTS, []);
  if (!Array.isArray(stored)) {
    return [];
  }
  return stored.map(client => ({ ...client }));
};

const persist = (clients: Client[]): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.CLIENTS, clients);
};

const emitClientsUpdated = () => emit(APP_EVENTS.CLIENTS_UPDATED);

export class LocalClientRepository implements IClientRepository {
  async getAll(): Promise<Client[]> {
    return loadAll();
  }

  async getById(id: string): Promise<Client | null> {
    const clients = loadAll();
    return clients.find(client => client.id === id) ?? null;
  }

  async create(data: Omit<Client, 'id'>): Promise<Client> {
    const clients = loadAll();
    const client: Client = {
      ...data,
      id: generateId(),
    };
    clients.push(client);
    persist(clients);
    emitClientsUpdated();
    return client;
  }

  async update(id: string, updates: Partial<Client>): Promise<Client | null> {
    const clients = loadAll();
    const index = clients.findIndex(client => client.id === id);

    if (index === -1) {
      return null;
    }

    const updated: Client = { ...clients[index], ...updates };
    clients[index] = updated;
    persist(clients);
    emitClientsUpdated();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const clients = loadAll();
    const nextClients = clients.filter(client => client.id !== id);

    if (nextClients.length === clients.length) {
      return false;
    }

    persist(nextClients);
    emitClientsUpdated();
    return true;
  }
}

export const clientRepository = new LocalClientRepository();
