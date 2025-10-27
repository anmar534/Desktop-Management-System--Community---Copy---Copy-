/**
 * Project Cost Management Hook
 *
 * Handles cost input and saving functionality for completed projects.
 * Manages state for cost inputs and saving status.
 *
 * @module useProjectCostManagement
 */

import { useState } from 'react'
import { toast } from 'sonner'
import type { Project } from '@/data/centralData'

type ProjectWithLegacyFields = Project & { profit?: number; profitMargin?: number }

export interface CostManagementHandlers {
  costInputs: Record<string, string>
  isSavingCosts: Record<string, boolean>
  handleCostInputChange: (projectId: string, value: string) => void
  handleSaveCosts: (
    project: ProjectWithLegacyFields,
    formatCurrencyValue: (amount: number) => string,
    onUpdateProject: (project: ProjectWithLegacyFields) => Promise<Project>,
  ) => Promise<void>
}

/**
 * Hook for managing project cost inputs and saving
 * @returns Object containing cost state and handlers
 */
export function useProjectCostManagement(): CostManagementHandlers {
  const [costInputs, setCostInputs] = useState<Record<string, string>>({})
  const [isSavingCosts, setIsSavingCosts] = useState<Record<string, boolean>>({})

  const handleCostInputChange = (projectId: string, value: string) => {
    setCostInputs((prev) => ({
      ...prev,
      [projectId]: value,
    }))
  }

  const handleSaveCosts = async (
    project: ProjectWithLegacyFields,
    formatCurrencyValue: (amount: number) => string,
    onUpdateProject: (project: ProjectWithLegacyFields) => Promise<Project>,
  ) => {
    const actualCostValue = parseFloat(costInputs[project.id] || '0')
    if (actualCostValue <= 0) {
      toast.error('يرجى إدخال تكلفة صحيحة')
      return
    }

    try {
      setIsSavingCosts((prev) => ({ ...prev, [project.id]: true }))

      const contractValue = project.contractValue || project.value || project.budget || 0
      const estimatedCost = project.estimatedCost || 0
      const actualProfit = contractValue - actualCostValue
      const profitMargin = contractValue > 0 ? (actualProfit / contractValue) * 100 : 0

      const updatedProject = {
        ...project,
        actualCost: actualCostValue, // التكلفة الفعلية
        spent: actualCostValue, // للتوافق مع النظام القديم
        remaining: contractValue - actualCostValue,
        actualProfit: actualProfit, // الربح الفعلي
        profitMargin: profitMargin,
        lastUpdate: new Date().toISOString(),
      }

      await onUpdateProject(updatedProject)

      // إزالة القيمة من حقل الإدخال
      setCostInputs((prev) => ({
        ...prev,
        [project.id]: '',
      }))

      const estimatedProfit = contractValue - estimatedCost
      const profitDifference = actualProfit - estimatedProfit

      toast.success(`تم حفظ التكاليف الفعلية بنجاح
      
  📊 ملخص المشروع:
  • قيمة العقد: ${formatCurrencyValue(contractValue)}
  • التكلفة التقديرية: ${formatCurrencyValue(estimatedCost)}
  • التكلفة الفعلية: ${formatCurrencyValue(actualCostValue)}
  • الربح الفعلي: ${formatCurrencyValue(actualProfit)} (${profitMargin.toFixed(1)}%)
      
  ${profitDifference >= 0 ? '🟢' : '🔴'} الفرق عن المتوقع: ${formatCurrencyValue(Math.abs(profitDifference))} ${profitDifference >= 0 ? 'توفير' : 'تجاوز'}`)
    } catch (error) {
      console.error('فشل في حفظ التكاليف', error)
      toast.error('فشل في حفظ التكاليف')
    } finally {
      setIsSavingCosts((prev) => ({ ...prev, [project.id]: false }))
    }
  }

  return {
    costInputs,
    isSavingCosts,
    handleCostInputChange,
    handleSaveCosts,
  }
}
