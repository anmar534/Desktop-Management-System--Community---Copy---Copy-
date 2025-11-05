/**
 * Task Form Component
 * مكون نموذج المهمة لإنشاء وتعديل المهام
 */

import type React from 'react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { CalendarIcon, X, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskPriority,
  TaskType,
} from '../../types/tasks'
import { taskManagementService } from '@/application/services/taskManagementService'
import { toast } from 'sonner'

// مخطط التحقق من صحة البيانات
const taskSchema = z
  .object({
    title: z.string().min(1, 'عنوان المهمة مطلوب').max(200, 'العنوان طويل جداً'),
    titleEn: z.string().optional(),
    description: z.string().min(1, 'وصف المهمة مطلوب').max(1000, 'الوصف طويل جداً'),
    descriptionEn: z.string().optional(),
    type: z.enum(['task', 'milestone', 'phase', 'deliverable']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    plannedStartDate: z.date({ required_error: 'تاريخ البداية مطلوب' }),
    plannedEndDate: z.date({ required_error: 'تاريخ النهاية مطلوب' }),
    estimatedHours: z.number().min(0, 'الساعات المقدرة يجب أن تكون أكبر من أو تساوي صفر'),
    estimatedCost: z.number().min(0, 'التكلفة المقدرة يجب أن تكون أكبر من أو تساوي صفر'),
    assigneeId: z.string().optional(),
    reviewerId: z.string().optional(),
    budgetCode: z.string().optional(),
    category: z.string().optional(),
    phase: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => data.plannedEndDate > data.plannedStartDate, {
    message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
    path: ['plannedEndDate'],
  })

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  projectId: string
  task?: Task
  onSubmit?: (task: Task) => void
  onCancel?: () => void
  className?: string
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'منخفضة' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'high', label: 'عالية' },
  { value: 'critical', label: 'حرجة' },
]

const typeOptions: { value: TaskType; label: string }[] = [
  { value: 'task', label: 'مهمة' },
  { value: 'milestone', label: 'معلم' },
  { value: 'phase', label: 'مرحلة' },
  { value: 'deliverable', label: 'مخرج' },
]

export const TaskForm: React.FC<TaskFormProps> = ({
  projectId,
  task,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [loading, setLoading] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [tags, setTags] = useState<string[]>(task?.tags || [])

  const isEditMode = !!task

  const form = useForm<any>({
    // resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      titleEn: task?.titleEn || '',
      description: task?.description || '',
      descriptionEn: task?.descriptionEn || '',
      type: task?.type || 'task',
      priority: task?.priority || 'medium',
      plannedStartDate: task ? new Date(task.plannedStartDate) : new Date(),
      plannedEndDate: task ? new Date(task.plannedEndDate) : new Date(),
      estimatedHours: task?.estimatedHours || 0,
      estimatedCost: task?.estimatedCost || 0,
      assigneeId: task?.assigneeId || '',
      reviewerId: task?.reviewerId || '',
      budgetCode: task?.budgetCode || '',
      category: task?.category || '',
      phase: task?.phase || '',
      tags: task?.tags || [],
    },
  })

  const handleSubmit = async (data: TaskFormData) => {
    try {
      setLoading(true)

      const taskData = {
        ...data,
        plannedStartDate: data.plannedStartDate.toISOString(),
        plannedEndDate: data.plannedEndDate.toISOString(),
        tags,
      }

      let result: Task

      if (isEditMode && task) {
        // تحديث المهمة
        const updateRequest: UpdateTaskRequest = {
          id: task.id,
          ...taskData,
          version: task.version,
        }
        result = await taskManagementService.updateTask(updateRequest)
        toast.success('تم تحديث المهمة بنجاح')
      } else {
        // إنشاء مهمة جديدة
        const createRequest: CreateTaskRequest = {
          projectId,
          ...taskData,
        }
        result = await taskManagementService.createTask(createRequest)
        toast.success('تم إنشاء المهمة بنجاح')
      }

      onSubmit?.(result)
    } catch (error) {
      console.error('خطأ في حفظ المهمة:', error)
      toast.error(error instanceof Error ? error.message : 'فشل في حفظ المهمة')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'تعديل المهمة' : 'إنشاء مهمة جديدة'}</CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* المعلومات الأساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان المهمة *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل عنوان المهمة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان بالإنجليزية</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title in English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* الوصف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف المهمة *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل وصف تفصيلي للمهمة"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف بالإنجليزية</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter detailed task description in English"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* النوع والأولوية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المهمة *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المهمة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {typeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأولوية *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر أولوية المهمة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* التواريخ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plannedStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>تاريخ البداية المخطط *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-right font-normal ${
                                !field.value && 'text-muted-foreground'
                              }`}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ar })
                              ) : (
                                <span>اختر تاريخ البداية</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>تاريخ النهاية المخطط *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-right font-normal ${
                                !field.value && 'text-muted-foreground'
                              }`}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ar })
                              ) : (
                                <span>اختر تاريخ النهاية</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < form.getValues('plannedStartDate')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* الساعات والتكلفة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الساعات المقدرة</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التكلفة المقدرة (ريال)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* التصنيف والمرحلة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التصنيف</FormLabel>
                      <FormControl>
                        <Input placeholder="مثل: تطوير، تصميم، اختبار" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المرحلة</FormLabel>
                      <FormControl>
                        <Input placeholder="مثل: المرحلة الأولى، التحليل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رمز الميزانية</FormLabel>
                      <FormControl>
                        <Input placeholder="مثل: DEV-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* العلامات */}
              <div className="space-y-3">
                <Label>العلامات</Label>

                <div className="flex gap-2">
                  <Input
                    placeholder="أضف علامة جديدة"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                  إلغاء
                </Button>

                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? 'جاري التحديث...' : 'جاري الإنشاء...'}
                    </>
                  ) : isEditMode ? (
                    'تحديث المهمة'
                  ) : (
                    'إنشاء المهمة'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default TaskForm
