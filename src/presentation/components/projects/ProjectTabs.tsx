import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
import { EmptyState } from '@/presentation/components/layout/PageLayout'
import { StatusBadge } from '@/presentation/components/ui/status-badge'
import { ProjectCard } from './ProjectCard'
import type { Project } from '@/data/centralData'
import type { ProjectTabConfig } from '@/shared/config/projectTabsConfig'

interface ProjectTabsProps {
  // Tabs configuration
  tabs: ProjectTabConfig[]
  activeTab: string
  onTabChange: (tabId: string) => void

  // Data
  filteredProjects: Project[]
  totalCount: number

  // ProjectCard props
  formatCurrencyValue: (value: number) => string
  costInputs: Record<string, string>
  isSavingCosts: Record<string, boolean>
  onCostInputChange: (id: string, value: string) => void
  onSaveCosts: (project: Project) => void
  onViewProject: (projectId: string) => void
  onEditProject: (project: Project) => void
  onDeleteProject: (id: string) => void

  // Section navigation
  onSectionChange: (section: string) => void
}

export function ProjectTabs({
  tabs,
  activeTab,
  onTabChange,
  filteredProjects,
  totalCount,
  formatCurrencyValue,
  costInputs,
  isSavingCosts,
  onCostInputChange,
  onSaveCosts,
  onViewProject,
  onEditProject,
  onDeleteProject,
  onSectionChange,
}: ProjectTabsProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">تصنيف المشاريع</h2>
          <div className="text-sm text-muted-foreground">
            {filteredProjects.length} من {totalCount} مشروع
          </div>
        </div>

        <div className="relative">
          <div className="flex bg-muted rounded-lg p-1.5 gap-1">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200 flex-1 justify-center
                    ${
                      isActive
                        ? `${tab.activeColor} transform scale-[0.98]`
                        : `text-muted-foreground ${tab.hoverColor} hover:text-foreground`
                    }
                  `}
                  whileHover={{ scale: isActive ? 0.98 : 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? (tab.activeIconColor ?? 'text-primary-foreground') : tab.color}`}
                  />
                  <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                  <StatusBadge
                    status={isActive ? tab.badgeStatus : 'default'}
                    label={String(tab.count)}
                    size="sm"
                    showIcon={false}
                    className={`min-w-[28px] justify-center px-2 py-0.5 text-xs shadow-none ${isActive ? (tab.activeBadgeClass ?? 'bg-primary/15 text-primary-foreground border-primary/30') : ''}`}
                  />

                  {isActive && (
                    <motion.div
                      className="absolute -bottom-1.5 left-1/2 h-0.5 w-8 -translate-x-1/2 transform rounded-full bg-primary/40"
                      layoutId="activeProjectTab"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id || index}
                project={project}
                index={index}
                formatCurrencyValue={formatCurrencyValue}
                costInputs={costInputs}
                isSavingCosts={isSavingCosts}
                onCostInputChange={onCostInputChange}
                onSaveCosts={onSaveCosts}
                onViewProject={onViewProject}
                onEditProject={onEditProject}
                onDeleteProject={onDeleteProject}
              />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <EmptyState
              icon={Building2}
              title="لا توجد مشاريع"
              description={
                activeTab === 'all'
                  ? 'لا توجد مشاريع في النظام'
                  : activeTab === 'active'
                    ? 'لا توجد مشاريع نشطة حالياً'
                    : activeTab === 'completed'
                      ? 'لا توجد مشاريع مكتملة'
                      : activeTab === 'planning'
                        ? 'لا توجد مشاريع تحت التخطيط'
                        : 'لا توجد مشاريع متوقفة مؤقتاً'
              }
              actionLabel={
                activeTab === 'active' || activeTab === 'all' ? 'إضافة مشروع جديد' : undefined
              }
              onAction={
                activeTab === 'active' || activeTab === 'all'
                  ? () => onSectionChange('new-project')
                  : undefined
              }
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
