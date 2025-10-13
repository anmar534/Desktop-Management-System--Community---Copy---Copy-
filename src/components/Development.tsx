'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { PageLayout } from './PageLayout'
import { DeleteConfirmation } from './ui/confirmation-dialog'
import { DevelopmentGoalDialog } from './DevelopmentGoalDialog'
import {
  Target,
  TrendingUp,
  Award,
  Building2,
  DollarSign,
  BarChart3,
  Save,
  Calendar,
  Edit,
  Trash2,
  RefreshCw,
  Plus
} from 'lucide-react'
import { formatCurrency } from '../data/centralData'
import type { DevelopmentGoal } from '@/application/hooks/useDevelopment';
import { useDevelopment } from '@/application/hooks/useDevelopment'
import { toast } from 'sonner'
import { safeLocalStorage } from '@/utils/storage'

export function Development() {
  const [selectedYear, setSelectedYear] = useState<'2025' | '2026' | '2027'>('2025')
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [deleteTarget, setDeleteTarget] = useState<DevelopmentGoal | null>(null)
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<DevelopmentGoal | null>(null)

  // استخدام hook إدارة التطوير
  const { goals, addGoal, updateGoal, deleteGoal: removeGoal, updateCurrentValues } = useDevelopment()

  // تحديث هدف
  const handleUpdateGoal = async (goalId: string, field: keyof DevelopmentGoal, value: number) => {
    await updateGoal(goalId, { [field]: value })
    toast.success('تم تحديث الهدف بنجاح')
  }

  // بدء التعديل
  const startEdit = (goalId: string, currentValue: number) => {
    setIsEditing(goalId)
    setEditValues({ [goalId]: currentValue })
  }

  // حفظ التعديل
  const saveEdit = async (goalId: string) => {
    const newValue = editValues[goalId]
    if (newValue !== undefined) {
      const field = `targetValue${selectedYear}` as keyof DevelopmentGoal
      await handleUpdateGoal(goalId, field, newValue)
    }
    setIsEditing(null)
    setEditValues({})
  }

  // إلغاء التعديل
  const cancelEdit = () => {
    setIsEditing(null)
    setEditValues({})
  }

  // حذف هدف
  const requestDeleteGoal = (goal: DevelopmentGoal) => {
    setDeleteTarget(goal)
  }

  const confirmDeleteGoal = async () => {
    if (!deleteTarget) {
      return
    }

    try {
      await removeGoal(deleteTarget.id)
      toast.success('تم حذف الهدف بنجاح')
    } catch (error) {
      console.error('❌ فشل حذف الهدف', error)
      toast.error('تعذر حذف الهدف')
    } finally {
      setDeleteTarget(null)
    }
  }

  // دالة للحصول على القيمة المستهدفة حسب السنة
  const getTargetValue = (goal: DevelopmentGoal, year: string): number => {
    switch (year) {
      case '2025': return goal.targetValue2025
      case '2026': return goal.targetValue2026
      case '2027': return goal.targetValue2027
      default: return goal.currentValue
    }
  }

  // دالة لتنسيق القيمة حسب الوحدة
  const formatValue = (value: number, unit: string): string => {
    switch (unit) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return `${value}%`
      case 'number':
        return value.toString()
      default:
        return value.toString()
    }
  }

  // دالة للحصول على لون المؤشر
  const getIndicatorColor = (current: number, target: number): string => {
    const percentage = (current / target) * 100
    if (percentage >= 100) return 'text-success'
    if (percentage >= 80) return 'text-primary'
    if (percentage >= 60) return 'text-warning'
    return 'text-destructive'
  }

  // دالة للحصول على أيقونة الفئة
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tenders': return Award
      case 'projects': return Building2
      case 'revenue': return DollarSign
      case 'profit': return TrendingUp
      default: return Target
    }
  }

  // إحصائيات سريعة
  const quickStats = [
    {
      label: 'إجمالي الأهداف',
      value: goals.length,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: `أهداف ${selectedYear}`,
      value: goals.length,
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      label: 'الأهداف الشهرية',
      value: goals.filter((g: DevelopmentGoal) => g.type === 'monthly').length,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'الأهداف السنوية',
      value: goals.filter((g: DevelopmentGoal) => g.type === 'yearly').length,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    }
  ]

  // حفظ هدف جديد أو تحديثه
  const handleSaveGoal = async (goalData: Partial<DevelopmentGoal>) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData)
    } else {
      await addGoal(goalData as Omit<DevelopmentGoal, 'id'> & { id?: string })
    }
    setEditingGoal(null)
  }

  // فتح Dialog لإضافة هدف جديد
  const openAddGoalDialog = () => {
    setEditingGoal(null)
    setIsGoalDialogOpen(true)
  }

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'إضافة هدف جديد',
      icon: Plus,
      onClick: openAddGoalDialog,
      primary: true
    },
    {
      label: 'تحديث القيم الحالية',
      icon: RefreshCw,
      onClick: async () => {
        await updateCurrentValues({})
        toast.success('تم تحديث القيم الحالية من البيانات الفعلية')
      },
      variant: 'outline' as const
    },
    {
      label: 'حفظ جميع التغييرات',
      icon: Save,
      onClick: () => {
        try {
          safeLocalStorage.setItem('development_goals', goals)
          toast.success('تم حفظ جميع الأهداف')
        } catch (error) {
          console.error('❌ فشل حفظ الأهداف في التخزين المحلي', error)
          toast.error('تعذر حفظ الأهداف محلياً')
        }
      },
      variant: 'outline' as const
    },
    {
      label: 'تقرير الأهداف',
      icon: BarChart3,
      onClick: () => toast.info('سيتم إضافة تقرير الأهداف قريباً'),
      variant: 'outline' as const
    }
  ]

  return (
    <PageLayout
      tone="info"
      title="إدارة التطوير"
      description="إدارة الأهداف الاستراتيجية وخطط التطوير للسنوات القادمة"
      icon={Target}
      quickStats={quickStats}
      quickActions={quickActions}
    >
      <div className="space-y-6">
        
        {/* تبويبات السنوات - نفس تصميم الصفحات الأخرى */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">خطة التطوير الاستراتيجية</h2>
              <div className="text-sm text-muted-foreground">
                {goals.length} هدف استراتيجي
              </div>
            </div>
            
            <div className="relative">
              <div className="flex bg-muted rounded-lg p-1.5 gap-1">
                {['2025', '2026', '2027'].map((year) => {
                  const isActive = selectedYear === year
                  
                  return (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year as '2025' | '2026' | '2027')}
                      className={`
                        relative flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200 flex-1 justify-center
                        ${isActive 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 transform scale-[0.98]' 
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                        }
                      `}
                    >
                      <Calendar className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                      <span className="whitespace-nowrap">خطة {year}</span>
                      
                      {isActive && (
                        <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary-foreground rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* بطاقات الأهداف */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal: DevelopmentGoal) => {
            const Icon = getCategoryIcon(goal.category)
            const targetValue = getTargetValue(goal, selectedYear)
            const currentValue = goal.currentValue
            const isEditingThis = isEditing === goal.id
            
            return (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-sm">{goal.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={goal.type === 'monthly' ? 'secondary' : 'default'} className="text-xs">
                        {goal.type === 'monthly' ? 'شهري' : 'سنوي'}
                      </Badge>
                    </div>
                  </div>
                  {/* description may not exist in type; keep UI compact */}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* القيمة الحالية */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">القيمة الحالية:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatValue(currentValue, goal.unit)}</span>
                      <div className="text-xs text-success bg-success/10 px-2 py-1 rounded-full" title="محدث تلقائياً من النظام">
                        ⚡ محدث
                      </div>
                    </div>
                  </div>

                  {/* القيمة المستهدفة */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">المستهدف {selectedYear}:</span>
                    {isEditingThis ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editValues[goal.id] ?? targetValue}
                          onChange={(e) => {
                            const parsedValue = Number.parseFloat(e.target.value)
                            setEditValues((prev) => ({
                              ...prev,
                              [goal.id]: Number.isNaN(parsedValue) ? 0 : parsedValue
                            }))
                          }}
                          className="w-20 h-7 text-xs"
                        />
                        <Button size="sm" onClick={() => saveEdit(goal.id)} className="h-7 px-2">
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 px-2">
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getIndicatorColor(currentValue, targetValue)}`}>
                          {formatValue(targetValue, goal.unit)}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => startEdit(goal.id, targetValue)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* شريط التقدم */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>التقدم:</span>
                      <span className={getIndicatorColor(currentValue, targetValue)}>
                        {Math.min(100, Math.round((currentValue / targetValue) * 100))}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`bg-primary rounded-full h-2 transition-all duration-300`}
                        data-width={Math.min(100, (currentValue / targetValue) * 100)}
                      />
                    </div>
                  </div>

                  {/* الفجوة */}
                  <div className="text-xs text-center">
                    {currentValue >= targetValue ? (
                      <span className="text-success">✅ تم تحقيق الهدف</span>
                    ) : (
                      <span className="text-warning">
                        الفجوة: {formatValue(targetValue - currentValue, goal.unit)}
                      </span>
                    )}
                  </div>

                  {/* أيقونات التحرير والحذف */}
                  <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-border">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-info/10" 
                      onClick={() => startEdit(goal.id, getTargetValue(goal, selectedYear))}
                      title="تعديل الهدف"
                    >
                      <Edit className="h-4 w-4 text-info" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-destructive/10"
                      onClick={() => requestDeleteGoal(goal)}
                      title="حذف الهدف"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ملخص الخطة الاستراتيجية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ملخص الخطة الاستراتيجية {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal: DevelopmentGoal) => {
                const targetValue = getTargetValue(goal, selectedYear)
                const currentValue = goal.currentValue
                const achievement = Math.min(100, (currentValue / targetValue) * 100)
                
                return (
                  <div key={goal.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">{goal.title}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {formatValue(currentValue, goal.unit)} / {formatValue(targetValue, goal.unit)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            achievement >= 100 ? 'bg-success' :
                            achievement >= 80 ? 'bg-primary' :
                            achievement >= 60 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          data-width={achievement}
                        />
                      </div>
                      <span className="text-xs font-medium">{Math.round(achievement)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <DeleteConfirmation
        itemName={deleteTarget?.title ?? 'هذا الهدف'}
        onConfirm={confirmDeleteGoal}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      />

      <DevelopmentGoalDialog
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />
    </PageLayout>
  )
}