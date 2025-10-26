/**
 * Project Form Component
 * Create and edit project form with validation and RTL support
 */

import type React from 'react'
import { useState, useEffect } from 'react'
import { Save, X, Calendar, DollarSign, MapPin, Tag, Users, AlertCircle } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Label } from '@/presentation/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import type {
  EnhancedProject,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../../types/projects'
import { enhancedProjectService } from '@/services/enhancedProjectService'

interface ProjectFormProps {
  project?: EnhancedProject | null
  onSave?: (project: EnhancedProject) => void
  onCancel?: () => void
  className?: string
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSave,
  onCancel,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    clientId: '',
    projectManagerId: '',
    startDate: '',
    endDate: '',
    budget: '',
    location: '',
    category: '',
    type: '',
    priority: 'medium' as const,
    tags: [] as string[],
  })

  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  const isEditing = !!project

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        nameEn: project.nameEn || '',
        description: project.description,
        clientId: project.clientId,
        projectManagerId: project.team.projectManager.id,
        startDate: project.startDate.split('T')[0], // Convert to date input format
        endDate: project.endDate.split('T')[0],
        budget: project.budget.totalBudget.toString(),
        location: project.location,
        category: project.category,
        type: project.type,
        priority: project.priority,
        tags: project.tags,
      })
    }
  }, [project])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const validateForm = async () => {
    const requestData = isEditing
      ? ({
          id: project!.id,
          version: project!.version,
          ...formData,
          budget: parseFloat(formData.budget),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        } as UpdateProjectRequest)
      : ({
          ...formData,
          budget: parseFloat(formData.budget),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        } as CreateProjectRequest)

    const validation = await enhancedProjectService.validateProjectData(requestData)
    setErrors(validation.errors)
    setWarnings(validation.warnings)

    return validation.isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = await validateForm()
    if (!isValid) return

    try {
      setLoading(true)

      let savedProject: EnhancedProject

      if (isEditing) {
        const updateData: UpdateProjectRequest = {
          id: project!.id,
          version: project!.version,
          ...formData,
          budget: parseFloat(formData.budget),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }

        const result = await enhancedProjectService.updateProject(updateData)
        if (!result) {
          throw new Error('فشل في تحديث المشروع')
        }
        savedProject = result
      } else {
        const createData: CreateProjectRequest = {
          ...formData,
          budget: parseFloat(formData.budget),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }

        savedProject = await enhancedProjectService.createProject(createData)
      }

      onSave?.(savedProject)
    } catch (error) {
      console.error('Error saving project:', error)
      setErrors([error instanceof Error ? error.message : 'حدث خطأ غير متوقع'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`} dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{isEditing ? 'تعديل المشروع' : 'إنشاء مشروع جديد'}</span>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 ml-2" />
              إلغاء
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {errors.length > 0 && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المشروع *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="أدخل اسم المشروع"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  placeholder="Project Name in English"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف المشروع *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="أدخل وصف تفصيلي للمشروع"
                rows={4}
                required
              />
            </div>

            {/* Client and Manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientId">العميل *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => handleInputChange('clientId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client1">شركة البناء المتقدم</SelectItem>
                    <SelectItem value="client2">مؤسسة التطوير العقاري</SelectItem>
                    <SelectItem value="client3">شركة المقاولات الحديثة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectManagerId">مدير المشروع *</Label>
                <Select
                  value={formData.projectManagerId}
                  onValueChange={(value) => handleInputChange('projectManagerId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مدير المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager1">أحمد محمد</SelectItem>
                    <SelectItem value="manager2">سارة أحمد</SelectItem>
                    <SelectItem value="manager3">محمد علي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ البدء *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">تاريخ الانتهاء *</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">الميزانية (ريال سعودي) *</Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="0"
                    className="pr-10"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location and Classification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">الموقع *</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="أدخل موقع المشروع"
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">الفئة *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">إنشاءات</SelectItem>
                    <SelectItem value="infrastructure">بنية تحتية</SelectItem>
                    <SelectItem value="renovation">تجديد</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">النوع *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">سكني</SelectItem>
                    <SelectItem value="commercial">تجاري</SelectItem>
                    <SelectItem value="industrial">صناعي</SelectItem>
                    <SelectItem value="government">حكومي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger className="w-full md:w-1/3">
                  <SelectValue placeholder="اختر الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="critical">حرجة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">العلامات</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="أدخل علامة جديدة"
                      className="pr-10"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    إضافة
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 ml-2" />
                {loading ? 'جاري الحفظ...' : isEditing ? 'تحديث المشروع' : 'إنشاء المشروع'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectForm
