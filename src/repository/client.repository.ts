import type { Client } from '@/data/centralData';

export interface IClientRepository {
  getAll(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  create(data: Omit<Client, 'id'>): Promise<Client>;
  update(id: string, updates: Partial<Client>): Promise<Client | null>;
  delete(id: string): Promise<boolean>;
}
