import type { Tender } from '../data/centralData';

export interface ITenderRepository {
  getAll(): Promise<Tender[]>;
  getById(id: string): Promise<Tender | null>;
  getByProjectId?(projectId: string): Promise<Tender | null>;
  create(data: Omit<Tender, 'id'>): Promise<Tender>;
  update(id: string, updates: Partial<Tender>): Promise<Tender | null>;
  delete(id: string): Promise<boolean>;
  search(query: string): Promise<Tender[]>;
}
