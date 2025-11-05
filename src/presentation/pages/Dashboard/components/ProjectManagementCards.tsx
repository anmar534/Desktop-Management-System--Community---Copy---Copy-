/**
 * Project Management Cards Component
 * بطاقات إدارة المشاريع للوحة التحكم
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { DollarSign, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { useFinancialState } from '@/application/context'
import { motion } from 'framer-motion'

interface ProjectManagementCardsProps {
  onSectionChange?: (section: string) => void
}

export const ProjectManagementCards: React.FC<ProjectManagementCardsProps> = ({
  onSectionChange,
}) => {
  const { projects: projectsState } = useFinancialState()
  const { projects } = projectsState

  // حساب إحصائيات المشاريع
  const stats = React.useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === 'active')
    const completedProjects = projects.filter((p) => p.status === 'completed')

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0)
    const budgetVariance = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0

    const onTimeProjects = activeProjects.filter((p) => {
      if (!p.endDate) return true
      const today = new Date()
      const endDate = new Date(p.endDate)
      const progress = p.progress || 0
      const timeElapsed = today.getTime() - new Date(p.startDate || today).getTime()
      const totalTime = endDate.getTime() - new Date(p.startDate || today).getTime()
      const expectedProgress = totalTime > 0 ? (timeElapsed / totalTime) * 100 : 0
      return progress >= expectedProgress * 0.9 // 90% threshold
    })

    const schedulePerformance =
      activeProjects.length > 0 ? (onTimeProjects.length / activeProjects.length) * 100 : 100

    return {
      activeCount: activeProjects.length,
      completedCount: completedProjects.length,
      totalCount: projects.length,
      budgetVariance,
      schedulePerformance,
      totalBudget,
      totalSpent,
    }
  }, [projects])

  return (
    <>
      {/* بطاقة أداء الميزانية */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card
          className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300 h-full cursor-pointer"
          onClick={() => onSectionChange?.('projects')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/20 border border-success/30">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              أداء ميزانية المشاريع
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              إجمالي {stats.totalCount} مشروع ({stats.activeCount} نشط)
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* نسبة التوفير / التجاوز */}
            <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stats.budgetVariance >= 0 ? 'توفير في التكلفة' : 'تجاوز الميزانية'}
                  </p>
                  <p
                    className={`text-2xl font-bold ${stats.budgetVariance >= 0 ? 'text-success' : 'text-destructive'}`}
                  >
                    {Math.abs(stats.budgetVariance).toFixed(1)}%
                  </p>
                </div>
                {stats.budgetVariance >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-success" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-destructive" />
                )}
              </div>
            </div>

            {/* إحصائيات إضافية */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-foreground">{stats.activeCount}</div>
                <div className="text-xs text-muted-foreground">مشاريع نشطة</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-success">{stats.completedCount}</div>
                <div className="text-xs text-muted-foreground">مكتملة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* بطاقة أداء الجدولة */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card
          className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300 h-full cursor-pointer"
          onClick={() => onSectionChange?.('projects')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              أداء الجدولة الزمنية
            </CardTitle>
            <p className="text-sm text-muted-foreground">التزام المشاريع بالجداول المحددة</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* نسبة الالتزام بالجدول */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stats.schedulePerformance >= 70 ? 'ملتزم بالجدول' : 'يحتاج متابعة'}
                  </p>
                  <p
                    className={`text-2xl font-bold ${stats.schedulePerformance >= 70 ? 'text-primary' : 'text-warning'}`}
                  >
                    {stats.schedulePerformance.toFixed(0)}%
                  </p>
                </div>
                {stats.schedulePerformance >= 70 ? (
                  <TrendingUp className="h-8 w-8 text-primary" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-warning" />
                )}
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">معدل الالتزام</span>
                <span className="font-medium">{stats.schedulePerformance.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    stats.schedulePerformance >= 70 ? 'bg-primary' : 'bg-warning'
                  }`}
                  style={{ width: `${Math.min(stats.schedulePerformance, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
