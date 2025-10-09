import type { Project } from '@/data/centralData';

export interface IProjectRepository {
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  create(data: Omit<Project, 'id'>): Promise<Project>;
  upsert(project: Project): Promise<Project>;
  update(id: string, updates: Partial<Project>): Promise<Project | null>;
  delete(id: string): Promise<boolean>;
  importMany(projects: Project[], options?: { replace?: boolean }): Promise<Project[]>;
  reload(): Promise<Project[]>;
}
