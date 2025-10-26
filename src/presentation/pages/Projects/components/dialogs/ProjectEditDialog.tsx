/**
 * ProjectEditDialog Component
 *
 * Dialog for editing project details with form validation
 * Reusable across different views
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'

export interface ProjectEditFormData {
  name: string
  client: string
  description: string
  location: string
  contractValue: number
  budget: number
  estimatedCost: number
  startDate: string
  endDate: string
  status: string
  priority: string
  progress: number
}

interface ProjectEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ProjectEditFormData
  onFormDataChange: (data: ProjectEditFormData) => void
  onSave: () => void
}

export function ProjectEditDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSave,
}: ProjectEditDialogProps) {
  const updateField = <K extends keyof ProjectEditFormData>(
    field: K,
    value: ProjectEditFormData[K],
  ) => {
    onFormDataChange({ ...formData, [field]: value })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تعديل المشروع</DialogTitle>
          <DialogDescription>تحديث بيانات ومعلومات المشروع</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* اسم المشروع والعميل */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">اسم المشروع *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="client">العميل *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => updateField('client', e.target.value)}
              />
            </div>
          </div>

          {/* الوصف */}
          <div>
            <Label htmlFor="description">وصف المشروع</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* الموقع */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">الموقع</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>
          </div>

          {/* القيم المالية */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contractValue">قيمة العقد (الإيرادات) - ريال</Label>
              <Input
                id="contractValue"
                type="number"
                value={formData.contractValue ?? formData.budget ?? 0}
                onChange={(e) => updateField('contractValue', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="estimatedCost">التكلفة التقديرية (الميزانية المخططة) - ريال</Label>
              <Input
                id="estimatedCost"
                type="number"
                value={formData.estimatedCost ?? 0}
                onChange={(e) => updateField('estimatedCost', Number(e.target.value))}
              />
            </div>
          </div>

          {/* التواريخ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">تاريخ البداية</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">تاريخ الانتهاء</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* الحالة والأولوية والإنجاز */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateField('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">تحت التخطيط</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="paused">متوقف مؤقتاً</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="delayed">متأخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">الأولوية</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => updateField('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="critical">حرجة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="progress">نسبة الإنجاز (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => updateField('progress', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onSave}>حفظ التحديثات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
