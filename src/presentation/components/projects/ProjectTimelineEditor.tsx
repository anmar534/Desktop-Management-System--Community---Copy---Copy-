/**
 * ProjectTimelineEditor Component
 *
 * Advanced timeline editor for managing project phases and milestones.
 * Features drag-drop reordering, milestone tracking, and visual timeline display.
 *
 * Week 4 - Task 3.1: Timeline Management
 */

import React, { useState, useCallback } from 'react'
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GripVertical,
  Edit,
  Trash2,
} from 'lucide-react'
import type { ProjectPhase, ProjectMilestone } from '@/types/projects'
import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Badge } from '@/presentation/components/ui/badge'
import { Progress } from '@/presentation/components/ui/progress'
import { cn } from '@/utils/cn'

// =====================================
// Types & Interfaces
// =====================================

interface ProjectTimelineEditorProps {
  projectId: string
  phases: ProjectPhase[]
  onUpdate?: (phases: ProjectPhase[]) => void
  readonly?: boolean
}

interface PhaseFormData {
  name: string
  nameEn: string
  description: string
  estimatedDuration: number
}

interface MilestoneFormData {
  name: string
  nameEn: string
  description: string
  targetDate: string
}

// =====================================
// Helper Functions
// =====================================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

const getStatusColor = (status: ProjectMilestone['status']): string => {
  const colors = {
    pending: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    delayed: 'bg-red-500',
  }
  return colors[status] || colors.pending
}

const getStatusLabel = (status: ProjectMilestone['status']): string => {
  const labels = {
    pending: 'معلق',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    delayed: 'متأخر',
  }
  return labels[status] || 'غير معروف'
}

const calculatePhaseProgress = (phase: ProjectPhase): number => {
  if (phase.milestones.length === 0) return 0
  const completed = phase.milestones.filter((m) => m.status === 'completed').length
  return Math.round((completed / phase.milestones.length) * 100)
}

// =====================================
// Main Component
// =====================================

export function ProjectTimelineEditor({
  projectId,
  phases: initialPhases,
  onUpdate,
  readonly = false,
}: ProjectTimelineEditorProps) {
  const [phases, setPhases] = useState<ProjectPhase[]>(initialPhases)
  const [showAddPhaseDialog, setShowAddPhaseDialog] = useState(false)
  const [showEditPhaseDialog, setShowEditPhaseDialog] = useState(false)
  const [showAddMilestoneDialog, setShowAddMilestoneDialog] = useState(false)
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null)
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null)
  const [draggedPhaseId, setDraggedPhaseId] = useState<string | null>(null)

  // Form states
  const [phaseFormData, setPhaseFormData] = useState<PhaseFormData>({
    name: '',
    nameEn: '',
    description: '',
    estimatedDuration: 30,
  })

  const [milestoneFormData, setMilestoneFormData] = useState<MilestoneFormData>({
    name: '',
    nameEn: '',
    description: '',
    targetDate: '',
  })

  // =====================================
  // Phase Management
  // =====================================

  const handleAddPhase = useCallback(() => {
    const newPhase: ProjectPhase = {
      id: generateId(),
      name: phaseFormData.name,
      nameEn: phaseFormData.nameEn,
      order: phases.length + 1,
      description: phaseFormData.description,
      estimatedDuration: phaseFormData.estimatedDuration,
      dependencies: [],
      milestones: [],
    }

    const updatedPhases = [...phases, newPhase]
    setPhases(updatedPhases)
    onUpdate?.(updatedPhases)

    // Reset form
    setPhaseFormData({
      name: '',
      nameEn: '',
      description: '',
      estimatedDuration: 30,
    })
    setShowAddPhaseDialog(false)
  }, [phases, phaseFormData, onUpdate])

  const handleEditPhase = useCallback(() => {
    if (!editingPhase) return

    const updatedPhases = phases.map((p) =>
      p.id === editingPhase.id
        ? {
            ...p,
            name: phaseFormData.name,
            nameEn: phaseFormData.nameEn,
            description: phaseFormData.description,
            estimatedDuration: phaseFormData.estimatedDuration,
          }
        : p,
    )

    setPhases(updatedPhases)
    onUpdate?.(updatedPhases)

    setEditingPhase(null)
    setShowEditPhaseDialog(false)
    setPhaseFormData({
      name: '',
      nameEn: '',
      description: '',
      estimatedDuration: 30,
    })
  }, [phases, editingPhase, phaseFormData, onUpdate])

  const handleDeletePhase = useCallback(
    (phaseId: string) => {
      if (!confirm('هل أنت متأكد من حذف هذه المرحلة؟')) return

      const updatedPhases = phases
        .filter((p) => p.id !== phaseId)
        .map((p, index) => ({ ...p, order: index + 1 }))

      setPhases(updatedPhases)
      onUpdate?.(updatedPhases)
    },
    [phases, onUpdate],
  )

  const openEditPhaseDialog = useCallback((phase: ProjectPhase) => {
    setEditingPhase(phase)
    setPhaseFormData({
      name: phase.name,
      nameEn: phase.nameEn,
      description: phase.description,
      estimatedDuration: phase.estimatedDuration,
    })
    setShowEditPhaseDialog(true)
  }, [])

  // =====================================
  // Milestone Management
  // =====================================

  const handleAddMilestone = useCallback(() => {
    if (!selectedPhaseId) return

    const newMilestone: ProjectMilestone = {
      id: generateId(),
      name: milestoneFormData.name,
      nameEn: milestoneFormData.nameEn,
      description: milestoneFormData.description,
      targetDate: milestoneFormData.targetDate,
      status: 'pending',
      progress: 0,
      deliverables: [],
      dependencies: [],
    }

    const updatedPhases = phases.map((p) =>
      p.id === selectedPhaseId ? { ...p, milestones: [...p.milestones, newMilestone] } : p,
    )

    setPhases(updatedPhases)
    onUpdate?.(updatedPhases)

    // Reset form
    setMilestoneFormData({
      name: '',
      nameEn: '',
      description: '',
      targetDate: '',
    })
    setSelectedPhaseId(null)
    setShowAddMilestoneDialog(false)
  }, [phases, selectedPhaseId, milestoneFormData, onUpdate])

  const handleDeleteMilestone = useCallback(
    (phaseId: string, milestoneId: string) => {
      if (!confirm('هل أنت متأكد من حذف هذا المعلم؟')) return

      const updatedPhases = phases.map((p) =>
        p.id === phaseId
          ? { ...p, milestones: p.milestones.filter((m) => m.id !== milestoneId) }
          : p,
      )

      setPhases(updatedPhases)
      onUpdate?.(updatedPhases)
    },
    [phases, onUpdate],
  )

  const handleToggleMilestoneStatus = useCallback(
    (phaseId: string, milestoneId: string) => {
      const updatedPhases = phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              milestones: p.milestones.map((m) =>
                m.id === milestoneId
                  ? {
                      ...m,
                      status: m.status === 'completed' ? 'pending' : 'completed',
                      progress: m.status === 'completed' ? 0 : 100,
                      actualDate:
                        m.status === 'completed'
                          ? undefined
                          : new Date().toISOString().split('T')[0],
                    }
                  : m,
              ),
            }
          : p,
      )

      setPhases(updatedPhases)
      onUpdate?.(updatedPhases)
    },
    [phases, onUpdate],
  )

  const openAddMilestoneDialog = useCallback((phaseId: string) => {
    setSelectedPhaseId(phaseId)
    setShowAddMilestoneDialog(true)
  }, [])

  // =====================================
  // Drag & Drop
  // =====================================

  const handleDragStart = useCallback((phaseId: string) => {
    setDraggedPhaseId(phaseId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (targetPhaseId: string) => {
      if (!draggedPhaseId || draggedPhaseId === targetPhaseId) return

      const draggedIndex = phases.findIndex((p) => p.id === draggedPhaseId)
      const targetIndex = phases.findIndex((p) => p.id === targetPhaseId)

      if (draggedIndex === -1 || targetIndex === -1) return

      const newPhases = [...phases]
      const [draggedPhase] = newPhases.splice(draggedIndex, 1)
      newPhases.splice(targetIndex, 0, draggedPhase)

      // Update order numbers
      const reorderedPhases = newPhases.map((p, index) => ({
        ...p,
        order: index + 1,
      }))

      setPhases(reorderedPhases)
      onUpdate?.(reorderedPhases)
      setDraggedPhaseId(null)
    },
    [phases, draggedPhaseId, onUpdate],
  )

  // =====================================
  // Render
  // =====================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">مراحل المشروع</h3>
          <p className="text-sm text-muted-foreground">إدارة مراحل المشروع والمعالم الزمنية</p>
        </div>
        {!readonly && (
          <Button onClick={() => setShowAddPhaseDialog(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مرحلة
          </Button>
        )}
      </div>

      {/* Phases List */}
      {phases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              لا توجد مراحل محددة بعد
              <br />
              <span className="text-sm">ابدأ بإضافة مرحلة جديدة للمشروع</span>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <Card
              key={phase.id}
              draggable={!readonly}
              onDragStart={() => handleDragStart(phase.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(phase.id)}
              className={cn(
                'transition-all',
                draggedPhaseId === phase.id && 'opacity-50',
                !readonly && 'cursor-move',
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {!readonly && <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {phase.name}
                        <Badge variant="outline" className="font-normal">
                          {phase.nameEn}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">{phase.description}</CardDescription>
                    </div>
                  </div>
                  {!readonly && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditPhaseDialog(phase)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePhase(phase.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Phase Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">المدة:</span>
                    <span className="font-medium">{phase.estimatedDuration} يوم</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">المعالم:</span>
                    <span className="font-medium">{phase.milestones.length}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">التقدم:</span>
                    <span className="font-medium">{calculatePhaseProgress(phase)}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <Progress value={calculatePhaseProgress(phase)} className="h-2" />

                {/* Milestones */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">المعالم الزمنية</h4>
                    {!readonly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddMilestoneDialog(phase.id)}
                      >
                        <Plus className="h-3 w-3 ml-1" />
                        إضافة معلم
                      </Button>
                    )}
                  </div>

                  {phase.milestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      لا توجد معالم زمنية لهذه المرحلة
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {phase.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() =>
                                !readonly && handleToggleMilestoneStatus(phase.id, milestone.id)
                              }
                              disabled={readonly}
                              className={cn(
                                'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                                milestone.status === 'completed'
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300 hover:border-green-500',
                                readonly && 'cursor-default',
                              )}
                            >
                              {milestone.status === 'completed' && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{milestone.name}</span>
                                <Badge
                                  variant="secondary"
                                  className={cn('text-xs', getStatusColor(milestone.status))}
                                >
                                  {getStatusLabel(milestone.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {milestone.nameEn}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  التاريخ المستهدف:{' '}
                                  {new Date(milestone.targetDate).toLocaleDateString('ar-EG')}
                                </span>
                                {milestone.actualDate && (
                                  <span className="text-xs text-green-600">
                                    تم الإنجاز:{' '}
                                    {new Date(milestone.actualDate).toLocaleDateString('ar-EG')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!readonly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMilestone(phase.id, milestone.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Phase Dialog */}
      <Dialog open={showAddPhaseDialog} onOpenChange={setShowAddPhaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مرحلة جديدة</DialogTitle>
            <DialogDescription>أضف مرحلة جديدة لجدول المشروع الزمني</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phase-name">الاسم بالعربية</Label>
              <Input
                id="phase-name"
                value={phaseFormData.name}
                onChange={(e) => setPhaseFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: التخطيط والتصميم"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phase-name-en">الاسم بالإنجليزية</Label>
              <Input
                id="phase-name-en"
                value={phaseFormData.nameEn}
                onChange={(e) => setPhaseFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                placeholder="Example: Planning & Design"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phase-description">الوصف</Label>
              <Textarea
                id="phase-description"
                value={phaseFormData.description}
                onChange={(e) =>
                  setPhaseFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="وصف تفصيلي للمرحلة"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phase-duration">المدة المتوقعة (بالأيام)</Label>
              <Input
                id="phase-duration"
                type="number"
                min="1"
                value={phaseFormData.estimatedDuration}
                onChange={(e) =>
                  setPhaseFormData((prev) => ({
                    ...prev,
                    estimatedDuration: parseInt(e.target.value) || 30,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPhaseDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAddPhase}
              disabled={!phaseFormData.name || !phaseFormData.nameEn}
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phase Dialog */}
      <Dialog open={showEditPhaseDialog} onOpenChange={setShowEditPhaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المرحلة</DialogTitle>
            <DialogDescription>تعديل بيانات المرحلة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phase-name">الاسم بالعربية</Label>
              <Input
                id="edit-phase-name"
                value={phaseFormData.name}
                onChange={(e) => setPhaseFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phase-name-en">الاسم بالإنجليزية</Label>
              <Input
                id="edit-phase-name-en"
                value={phaseFormData.nameEn}
                onChange={(e) => setPhaseFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phase-description">الوصف</Label>
              <Textarea
                id="edit-phase-description"
                value={phaseFormData.description}
                onChange={(e) =>
                  setPhaseFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phase-duration">المدة المتوقعة (بالأيام)</Label>
              <Input
                id="edit-phase-duration"
                type="number"
                min="1"
                value={phaseFormData.estimatedDuration}
                onChange={(e) =>
                  setPhaseFormData((prev) => ({
                    ...prev,
                    estimatedDuration: parseInt(e.target.value) || 30,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPhaseDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleEditPhase}
              disabled={!phaseFormData.name || !phaseFormData.nameEn}
            >
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog open={showAddMilestoneDialog} onOpenChange={setShowAddMilestoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة معلم زمني</DialogTitle>
            <DialogDescription>أضف معلم زمني جديد للمرحلة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-name">الاسم بالعربية</Label>
              <Input
                id="milestone-name"
                value={milestoneFormData.name}
                onChange={(e) =>
                  setMilestoneFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="مثال: اعتماد التصاميم"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-name-en">الاسم بالإنجليزية</Label>
              <Input
                id="milestone-name-en"
                value={milestoneFormData.nameEn}
                onChange={(e) =>
                  setMilestoneFormData((prev) => ({ ...prev, nameEn: e.target.value }))
                }
                placeholder="Example: Design Approval"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-description">الوصف</Label>
              <Textarea
                id="milestone-description"
                value={milestoneFormData.description}
                onChange={(e) =>
                  setMilestoneFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="وصف تفصيلي للمعلم"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-target-date">التاريخ المستهدف</Label>
              <Input
                id="milestone-target-date"
                type="date"
                value={milestoneFormData.targetDate}
                onChange={(e) =>
                  setMilestoneFormData((prev) => ({ ...prev, targetDate: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMilestoneDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAddMilestone}
              disabled={
                !milestoneFormData.name ||
                !milestoneFormData.nameEn ||
                !milestoneFormData.targetDate
              }
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
