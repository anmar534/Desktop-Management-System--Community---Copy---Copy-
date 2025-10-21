import type { IProjectRepository } from '../project.repository';
import type { Project } from '@/data/centralData';
import { safeLocalStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/shared/config/storageKeys';
import { APP_EVENTS, emit } from '@/events/bus';
import { getRelationRepository } from '@/application/services/serviceRegistry';
import {
  sanitizeProjectCollection,
  validateProject,
  validateProjectPayload,
  validateProjectUpdate,
  ValidationError
} from '@/domain/validation';

const generateId = () => `project_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const loadAll = (): Project[] => {
  const stored = safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const source = Array.isArray(stored) ? stored : [];
  const sanitized = sanitizeProjectCollection(source);

  if (sanitized.length !== source.length || hasDifferences(source, sanitized)) {
    persist(sanitized);
  }

  return [...sanitized];
};

const persist = (projects: Project[]): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.PROJECTS, projects);
};

const emitProjectsUpdated = () => emit(APP_EVENTS.PROJECTS_UPDATED);

const hasDifferences = (original: Project[], sanitized: Project[]): boolean => {
  if (original.length !== sanitized.length) {
    return true;
  }

  for (let index = 0; index < original.length; index += 1) {
    const raw = original[index];
    const clean = sanitized[index];
    if (JSON.stringify(raw) !== JSON.stringify(clean)) {
      return true;
    }
  }

  return false;
};

export class LocalProjectRepository implements IProjectRepository {
  async getAll(): Promise<Project[]> {
    return loadAll();
  }

  async getById(id: string): Promise<Project | null> {
    const projects = loadAll();
    return projects.find(project => project.id === id) ?? null;
  }

  async create(data: Omit<Project, 'id'>): Promise<Project> {
    const projects = loadAll();
    const payload = validateProjectPayload(data);
    const project = validateProject({ ...payload, id: generateId() });
    projects.push(project);
    persist(projects);
    emitProjectsUpdated();
    return project;
  }

  async upsert(project: Project): Promise<Project> {
    const projects = loadAll();
    const index = projects.findIndex(existing => existing.id === project.id);
    const sanitized = validateProject(project);
    const merged: Project = index >= 0 ? validateProject({ ...projects[index], ...sanitized }) : sanitized;

    if (index >= 0) {
      projects[index] = merged;
    } else {
      projects.push(merged);
    }

    persist(projects);
    emitProjectsUpdated();
    return merged;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    const projects = loadAll();
    const index = projects.findIndex(project => project.id === id);

    if (index === -1) {
      return null;
    }

    const sanitizedUpdates = validateProjectUpdate({ ...updates, id });

    const updated: Project = validateProject({ ...projects[index], ...sanitizedUpdates, id });
    projects[index] = updated;
    persist(projects);
    emitProjectsUpdated();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const projects = loadAll();
    const nextProjects = projects.filter(project => project.id !== id);

    if (nextProjects.length === projects.length) {
      return false;
    }

    persist(nextProjects);
    const relationRepository = getRelationRepository();
    relationRepository.unlinkProject(id);
    emitProjectsUpdated();
    return true;
  }

  async importMany(projects: Project[], options: { replace?: boolean } = {}): Promise<Project[]> {
    const shouldReplace = options.replace ?? true;
    const current = shouldReplace ? [] : loadAll();

    for (const project of projects) {
      try {
        const sanitized = validateProject(project);
        const index = current.findIndex(existing => existing.id === sanitized.id);
        if (index >= 0) {
          current[index] = validateProject({ ...current[index], ...sanitized });
        } else {
          current.push(sanitized);
        }
      } catch (error) {
        console.warn(error instanceof ValidationError ? error.message : 'Failed to import project entry');
      }
    }

    persist(current);
    emitProjectsUpdated();
    return current;
  }

  async reload(): Promise<Project[]> {
    const projects = loadAll();
    emitProjectsUpdated();
    return projects;
  }
}

export const projectRepository = new LocalProjectRepository();
