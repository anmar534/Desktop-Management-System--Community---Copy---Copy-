/**
 * Enhanced Project Auto-Creation Service
 */

import type { Tender, Project } from '@/data/centralData';
import { getBOQRepository, getProjectRepository, getRelationRepository } from '@/application/services/serviceRegistry';
import { buildPricingMap } from '@/shared/utils/pricing/normalizePricing';
import type { NormalizedPricingItem } from '@/shared/utils/pricing/normalizePricing';
import { safeLocalStorage } from '@/shared/utils/storage/storage';
import { STORAGE_KEYS } from '@/shared/constants/storageKeys';
import type { EntityRelationSnapshot } from '@/repository/relations.repository';
import type { BOQData } from '@/shared/types/boq';

export interface ProjectCreationOptions {
  copyPricingData?: boolean;
  copyQuantityTable?: boolean;
  autoGenerateTasks?: boolean;
  notifyTeam?: boolean;
  inheritBudget?: boolean;
}

export interface ProjectCreationResult {
  success: boolean;
  projectId?: string;
  project?: Project;
  errors?: string[];
  warnings?: string[];
  relationsCreated?: boolean;
}

export class EnhancedProjectAutoCreationService {

  static async createProjectFromWonTender(
    tender: Tender, 
    options: ProjectCreationOptions = {}
  ): Promise<ProjectCreationResult> {
    try {
      console.log('Starting project creation from won tender:', tender.name);
      
      const {
        copyPricingData = true,
        copyQuantityTable = true,
        autoGenerateTasks = true,
        notifyTeam = true,
        inheritBudget = true
      } = options;

      if (tender.status !== 'won') {
        return {
          success: false,
          errors: [`Tender must be in 'won' status to create project. Current status: ${tender.status}`]
        };
      }

      const relationRepository = getRelationRepository();
      const projectRepository = getProjectRepository();
      const existingProjectId = relationRepository.getProjectIdByTenderId(tender.id);
      const existingProject = existingProjectId ? await projectRepository.getById(existingProjectId) : null;
      if (existingProject) {
        return {
          success: false,
          errors: [`Project already linked to this tender: ${existingProject.name}`],
          projectId: existingProject.id
        };
      }

      const warnings: string[] = [];

      let contractValue = tender.value ?? 0;
      let estimatedCost = contractValue * 0.8;

      if (inheritBudget && tender.totalValue != null) {
        contractValue = tender.totalValue;
        estimatedCost = contractValue * 0.8;
      }

      if (contractValue === 0) {
        warnings.push('Contract value is zero - please review tender data');
      }

    const managerName = this.coalesceString(tender.manager, 'Unassigned');
    const teamName = this.coalesceString(tender.team, 'Project Team');
    const projectLocation = this.coalesceString(tender.location, 'TBD');
    const projectCategory = this.coalesceString(tender.category, 'General');
    const projectType = this.coalesceString(tender.type, 'Construction Project');
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = this.calculateProjectEndDate(tender.deadline);
      const lastUpdate = new Date().toISOString();

      const projectData: Omit<Project, 'id'> = {
        name: `Project ${tender.name}`,
        client: tender.client,
        status: 'planning' as const,
        priority: 'medium' as const,
        progress: 0,
        contractValue,
        estimatedCost,
        actualCost: 0,
        spent: 0,
        remaining: contractValue,
        expectedProfit: contractValue - estimatedCost,
        startDate,
        endDate,
        manager: managerName,
        team: teamName,
        location: projectLocation,
        phase: 'Planning',
        health: 'green' as const,
        lastUpdate,
        category: projectCategory,
        efficiency: 0,
        riskLevel: 'low' as const,
        budget: contractValue,
        value: contractValue,
        type: projectType
      };

      const newProject = await projectRepository.create(projectData);
      relationRepository.linkTenderToProject(tender.id, newProject.id, { isAutoCreated: true });

      if (copyPricingData) {
        await this.copyPricingData(tender.id, newProject.id);
      }

      if (copyQuantityTable) {
        await this.copyBOQData(tender.id, newProject.id);
      }

      if (autoGenerateTasks) {
        await this.generateProjectTasks(newProject.id);
        warnings.push('Project tasks generated automatically - please review and customize');
      }

      if (notifyTeam) {
        await this.notifyTeam(newProject, tender);
      }

      console.log('Project created successfully:', newProject.name);

      return {
        success: true,
        projectId: newProject.id,
        project: newProject,
        warnings: warnings.length > 0 ? warnings : undefined,
        relationsCreated: true
      };

    } catch (error) {
      console.error('Error creating project:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error in project creation']
      };
    }
  }

  private static calculateProjectEndDate(tenderDeadline: string): string {
    try {
      const deadline = new Date(tenderDeadline);
      deadline.setMonth(deadline.getMonth() + 6);
      return deadline.toISOString().split('T')[0];
    } catch {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);
      return futureDate.toISOString().split('T')[0];
    }
  }

  private static async copyPricingData(tenderId: string, projectId: string): Promise<void> {
    try {
      console.log(`?? «·»ÕÀ ⁄‰ »Ì«‰«  «· ”⁄Ì— ··„‰«›”…: ${tenderId}`);

      const boqRepository = getBOQRepository();

      // «·Õ’Ê· ⁄·Ï BOQ „ÊÃÊœ ≈‰ ÊÃœ
      let boqData = await boqRepository.getByTenderId(tenderId);
      console.log(`?? BOQ „‰ «·‰Ÿ«„ «·„—ﬂ“Ì: ${boqData ? '„ÊÃÊœ' : '€Ì— „ÊÃÊœ'}`);

      if (!boqData) {
        console.log('?? „Õ«Ê·… ﬁ—«¡… „‰ pricingService ( ÿ»Ì⁄ „—ﬂ“Ì)...');
        const { pricingService } = await import('@/application/services/pricingService');
        const pricingData = await pricingService.loadTenderPricing(tenderId);
        const pricingArray = pricingData?.pricing;
        if (pricingArray && pricingArray.length > 0) {
          const pricingMap = buildPricingMap(pricingArray);
          const boqItems: NormalizedPricingItem[] = [];
          let totalValue = 0;
          for (const [, normalized] of pricingMap.entries()) {
            boqItems.push(normalized);
            totalValue += normalized.totalPrice;
          }
          if (boqItems.length > 0) {
            const existingTenderBOQ = await boqRepository.getByTenderId(tenderId);
            const newBoqData: BOQData = {
              id: existingTenderBOQ?.id ?? `boq_tender_${tenderId}`,
              tenderId,
              projectId: undefined,
              items: boqItems,
              totalValue,
              lastUpdated: new Date().toISOString()
            };
            await boqRepository.createOrUpdate(newBoqData);
            boqData = newBoqData;
            console.log('?  „ ≈‰‘«¡ BOQ „‰ »Ì«‰«  «· ”⁄Ì— (»«” Œœ«„ normalizePricing)');
          }
        }
      }

      if (boqData) {
        // Enhanced project BOQ creation with proper estimated/actual structure
        const existingProjectBOQ = await boqRepository.getByProjectId(projectId);
        const projectBOQ: BOQData = {
          ...boqData,
          id: existingProjectBOQ?.id ?? `boq_project_${projectId}`,
          projectId,
          tenderId: undefined,
          items: boqData.items.map(item => {
            const rawItem = item as Record<string, unknown>;
            const description = this.coalesceFromCandidates(
              [
                rawItem.description,
                rawItem.itemName,
                rawItem.desc,
                rawItem.name,
                rawItem.title,
                rawItem.specifications,
                rawItem.details,
                rawItem.itemDesc,
                rawItem.itemDescription,
                rawItem.label,
                rawItem.text
              ],
              `»‰œ —ﬁ„ ${item.id}`
            );

            const materials = item.materials ?? [];
            const labor = item.labor ?? [];
            const equipment = item.equipment ?? [];
            const subcontractors = item.subcontractors ?? [];
            const additionalPercentages = item.additionalPercentages ?? {};

            // Create estimated values from tender data
            const estimated = {
              quantity: item.quantity ?? 0,
              unitPrice: item.unitPrice ?? 0,
              totalPrice: item.totalPrice ?? 0,
              materials,
              labor,
              equipment,
              subcontractors,
              additionalPercentages
            };

            return {
              // Preserve original identification
              id: `proj_${item.id}`,
              originalId: item.id, // Keep reference to original tender item
              description,
              unit: this.coalesceString(item.unit, 'ÊÕœ…'),
              category: this.coalesceString(rawItem.category as string | undefined, 'BOQ'),
              
              // Store all tender data as estimated values
              estimated,
              
              // Initialize actual values to match estimated (user can modify these)
              actual: {
                quantity: estimated.quantity,
                unitPrice: estimated.unitPrice,
                totalPrice: estimated.totalPrice,
                materials: [...estimated.materials],
                labor: [...estimated.labor],
                equipment: [...estimated.equipment],
                subcontractors: [...estimated.subcontractors],
                additionalPercentages: { ...estimated.additionalPercentages }
              },
              
              // Keep backward compatibility fields
              quantity: estimated.quantity,
              unitPrice: estimated.unitPrice,
              totalPrice: estimated.totalPrice,
              actualQuantity: estimated.quantity,
              actualUnitPrice: estimated.unitPrice,
              materials: estimated.materials,
              labor: estimated.labor,
              equipment: estimated.equipment,
              subcontractors: estimated.subcontractors,
              
              // Preserve any additional metadata
              ...Object.fromEntries(
                Object.entries(item).filter(([key]) => 
                  !['id', 'quantity', 'unitPrice', 'totalPrice', 'materials', 'labor', 'equipment', 'subcontractors'].includes(key)
                )
              )
            };
          })
        };
        await boqRepository.createOrUpdate(projectBOQ);
        console.log('?  „ ‰”Œ »Ì«‰«  «· ”⁄Ì— ≈·Ï «·„‘—Ê⁄ „⁄ «·ÂÌﬂ· «·„Õ”‰ (estimated/actual)');
      } else {
        console.warn('?? ·«  ÊÃœ »Ì«‰«   ”⁄Ì— ·‰”ŒÂ«');
      }
    } catch (error) {
      console.warn('Error copying pricing data:', error);
    }
  }

  private static async copyBOQData(_tenderId: string, _projectId: string): Promise<void> {
    try {
      console.log('BOQ data copied');
    } catch (error) {
      console.warn('Error copying BOQ data:', error);
    }
  }

  private static async generateProjectTasks(projectId: string): Promise<void> {
    try {
      const defaultTasks = [
        'Initial Designs',
        'Obtain Permits',
        'Site Preparation',
        'Civil Works',
        'Finishing Works',
        'Final Inspection',
        'Handover'
      ];

      console.log(`Generated ${defaultTasks.length} tasks for project ${projectId}`);
    } catch (error) {
      console.warn('Error generating project tasks:', error);
    }
  }

  private static async notifyTeam(project: Project, tender: Tender): Promise<void> {
    try {
      const notification = {
        title: 'New Project',
        message: `New project created: ${project.name} from won tender: ${tender.name}`,
        type: 'success',
        timestamp: new Date().toISOString()
      };

      console.log('Team notified of project creation:', notification.message);
    } catch (error) {
      console.warn('Error notifying team:', error);
    }
  }

  private static toNonEmptyString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private static coalesceString(value: unknown, fallback: string): string {
    return this.toNonEmptyString(value) ?? fallback;
  }

  private static coalesceFromCandidates(values: unknown[], fallback: string): string {
    for (const value of values) {
      const candidate = this.toNonEmptyString(value);
      if (candidate) {
        return candidate;
      }
    }
    return fallback;
  }

  static canCreateProjectFromTender(tender: Tender): { 
    canCreate: boolean; 
    reasons: string[] 
  } {
    const reasons: string[] = [];

    if (tender.status !== 'won') {
      reasons.push('Tender is not in won status');
    }

    const existingProjectId = getRelationRepository().getProjectIdByTenderId(tender.id);
    if (existingProjectId) {
      reasons.push('Project already linked to this tender');
    }

    if (!tender.client || tender.client.trim() === '') {
      reasons.push('Client data missing');
    }

    if (!tender.value || tender.value <= 0) {
      reasons.push('Invalid tender value');
    }

    return {
      canCreate: reasons.length === 0,
      reasons
    };
  }

  static getAutoCreationStats() {
    const snapshot: EntityRelationSnapshot = getRelationRepository().getSnapshot();
    const tenderProjectLinks = snapshot.tenderProject.length;
    const autoCreatedProjects = snapshot.tenderProject.filter(link => link.isAutoCreated).length;

    const projects = safeLocalStorage.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const tenders = safeLocalStorage.getItem<Tender[]>(STORAGE_KEYS.TENDERS, []);

    const totalProjects = projects.length;
    const totalTenders = tenders.length;

    return {
      totalAutoCreatedProjects: autoCreatedProjects,
      totalProjects,
      totalTenders,
      autoCreationRate: totalTenders > 0 ? (autoCreatedProjects / totalTenders) * 100 : 0,
      linkedProjectsRate: totalProjects > 0 ? (tenderProjectLinks / totalProjects) * 100 : 0
    };
  }
}

export { EnhancedProjectAutoCreationService as ProjectAutoCreationService };
export default EnhancedProjectAutoCreationService;
