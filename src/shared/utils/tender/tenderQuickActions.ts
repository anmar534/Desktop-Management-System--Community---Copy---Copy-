/**
 * Quick action definitions for TendersPage
 */

import type { LucideIcon } from 'lucide-react'
import { FileText, Plus } from 'lucide-react'
import type { Tender } from '@/data/centralData'

export interface QuickAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'outline'
  primary?: boolean
}

/**
 * Creates quick action buttons for tender management
 */
export const createQuickActions = (
  onSectionChange: (section: string, tender?: Tender) => void,
): QuickAction[] => [
  {
    label: 'تقارير المنافسات',
    icon: FileText,
    onClick: () => onSectionChange('reports'),
    variant: 'outline',
  },
  {
    label: 'منافسة جديدة',
    icon: Plus,
    onClick: () => onSectionChange('new-tender'),
    primary: true,
  },
]
