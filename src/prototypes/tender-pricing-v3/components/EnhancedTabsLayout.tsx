/**
 * Enhanced Tabs Layout
 * تصميم التبويبات المحسّن
 *
 * ميزات:
 * - تبويبات بتصميم عصري
 * - مؤشرات بصرية للموارد
 * - انتقالات سلسة
 * - عداد للصفوف في كل tab
 */

import { useState } from 'react'
import { Package, Users, Truck, Briefcase } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/components/ui/utils'
import { EnhancedResourceTable } from '../../tender-pricing-v2/components/EnhancedResourceTable'
import type {
  MockMaterialRow,
  MockLaborRow,
  MockEquipmentRow,
  MockSubcontractorRow,
} from '../mockData'

interface EnhancedTabsLayoutProps {
  materials: MockMaterialRow[]
  labor: MockLaborRow[]
  equipment: MockEquipmentRow[]
  subcontractors: MockSubcontractorRow[]
  onMaterialsChange: (materials: MockMaterialRow[]) => void
  onLaborChange: (labor: MockLaborRow[]) => void
  onEquipmentChange: (equipment: MockEquipmentRow[]) => void
  onSubcontractorsChange: (subcontractors: MockSubcontractorRow[]) => void
  formatCurrency: (value: number) => string
}

const TAB_CONFIG = [
  {
    value: 'materials',
    label: 'المواد',
    icon: Package,
    color: 'blue',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    hoverColor: 'hover:bg-blue-50',
  },
  {
    value: 'labor',
    label: 'العمالة',
    icon: Users,
    color: 'purple',
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-600',
    hoverColor: 'hover:bg-purple-50',
  },
  {
    value: 'equipment',
    label: 'المعدات',
    icon: Truck,
    color: 'orange',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-600',
    hoverColor: 'hover:bg-orange-50',
  },
  {
    value: 'subcontractors',
    label: 'المقاولون',
    icon: Briefcase,
    color: 'green',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    hoverColor: 'hover:bg-green-50',
  },
] as const

export const EnhancedTabsLayout: React.FC<EnhancedTabsLayoutProps> = ({
  materials,
  labor,
  equipment,
  subcontractors,
  onMaterialsChange,
  onLaborChange,
  onEquipmentChange,
  onSubcontractorsChange,
  formatCurrency,
}) => {
  const [activeTab, setActiveTab] = useState('materials')

  const counts = {
    materials: materials.length,
    labor: labor.length,
    equipment: equipment.length,
    subcontractors: subcontractors.length,
  }

  const totals = {
    materials: materials.reduce((sum, m) => sum + m.total, 0),
    labor: labor.reduce((sum, l) => sum + l.total, 0),
    equipment: equipment.reduce((sum, e) => sum + e.total, 0),
    subcontractors: subcontractors.reduce((sum, s) => sum + s.total, 0),
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* التبويبات */}
      <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon
          const count = counts[tab.value as keyof typeof counts]
          const total = totals[tab.value as keyof typeof totals]
          const isActive = activeTab === tab.value

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'flex-col h-auto py-3 px-4 rounded-lg transition-all duration-200',
                'data-[state=active]:bg-card data-[state=active]:shadow-lg',
                tab.hoverColor,
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                    isActive ? tab.bgColor : `${tab.textColor} bg-transparent`,
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-white' : tab.textColor)} />
                </div>
                <span
                  className={cn(
                    'font-semibold',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {tab.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full font-semibold',
                    isActive ? `${tab.bgColor} text-white` : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count} {count === 1 ? 'صف' : 'صفوف'}
                </span>
                {total > 0 && (
                  <span
                    className={cn(
                      'font-bold tabular-nums',
                      isActive ? tab.textColor : 'text-muted-foreground',
                    )}
                  >
                    {formatCurrency(total)}
                  </span>
                )}
              </div>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {/* محتوى التبويبات */}
      <div className="mt-6">
        <TabsContent value="materials" className="mt-0">
          <EnhancedResourceTable
            type="materials"
            resources={materials}
            onChange={onMaterialsChange}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="labor" className="mt-0">
          <EnhancedResourceTable
            type="labor"
            resources={labor}
            onChange={onLaborChange}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-0">
          <EnhancedResourceTable
            type="equipment"
            resources={equipment}
            onChange={onEquipmentChange}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="subcontractors" className="mt-0">
          <EnhancedResourceTable
            type="subcontractors"
            resources={subcontractors}
            onChange={onSubcontractorsChange}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}
