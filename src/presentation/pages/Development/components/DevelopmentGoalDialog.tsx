/**
 * Development Goal Dialog Component
 *
 * مكون Dialog لإضافة وتعديل الأهداف التطويرية
 *
 * @version 1.0.0
 * @date 2025-10-08
 */

import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { Textarea } from '@/presentation/components/ui/textarea';
import type { DevelopmentGoal } from '@/application/hooks/useDevelopment';
import { toast } from 'sonner';
import {
  Target,
  Award,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react';

// ============================================
// Goal Categories with Icons
// ============================================

const goalCategories = [
  { value: 'tenders', label: 'المنافسات', icon: Award },
  { value: 'projects', label: 'المشاريع', icon: Building2 },
  { value: 'revenue', label: 'الإيرادات', icon: DollarSign },
  { value: 'profit', label: 'الأرباح', icon: TrendingUp },
  { value: 'team', label: 'الفريق', icon: Users },
  { value: 'other', label: 'أخرى', icon: Target },
];

const goalTypes = [
  { value: 'monthly', label: 'شهري' },
  { value: 'yearly', label: 'سنوي' },
];

const goalUnits = [
  { value: 'currency', label: 'عملة (ريال)' },
  { value: 'percentage', label: 'نسبة مئوية (%)' },
  { value: 'number', label: 'عدد' },
];

// ============================================
// Props Interface
// ============================================

export interface DevelopmentGoalDialogProps {
  /**
   * حالة فتح/إغلاق الـ Dialog
   */
  open: boolean;

  /**
   * دالة لتغيير حالة فتح/إغلاق الـ Dialog
   */
  onOpenChange: (open: boolean) => void;

  /**
   * الهدف المراد تعديله (اختياري - في حالة الإضافة يكون null)
   */
  goal?: DevelopmentGoal | null;

  /**
   * دالة يتم استدعاؤها عند حفظ الهدف
   */
  onSave: (goal: Partial<DevelopmentGoal>) => Promise<void>;
}

// ============================================
// Component
// ============================================

export function DevelopmentGoalDialog({
  open,
  onOpenChange,
  goal = null,
  onSave,
}: DevelopmentGoalDialogProps) {
  const isEditMode = Boolean(goal);

  // State
  const [formData, setFormData] = useState<Partial<DevelopmentGoal>>(() => ({
    id: goal?.id ?? `goal_${Date.now()}`,
    title: goal?.title ?? '',
    description: goal?.description ?? '',
    category: goal?.category ?? 'other',
    type: goal?.type ?? 'yearly',
    unit: goal?.unit ?? 'number',
    currentValue: goal?.currentValue ?? 0,
    targetValue2025: goal?.targetValue2025 ?? 0,
    targetValue2026: goal?.targetValue2026 ?? 0,
    targetValue2027: goal?.targetValue2027 ?? 0,
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens with a different goal
  React.useEffect(() => {
    if (open) {
      setFormData({
        id: goal?.id ?? `goal_${Date.now()}`,
        title: goal?.title ?? '',
        description: goal?.description ?? '',
        category: goal?.category ?? 'other',
        type: goal?.type ?? 'yearly',
        unit: goal?.unit ?? 'number',
        currentValue: goal?.currentValue ?? 0,
        targetValue2025: goal?.targetValue2025 ?? 0,
        targetValue2026: goal?.targetValue2026 ?? 0,
        targetValue2027: goal?.targetValue2027 ?? 0,
      });
    }
  }, [open, goal]);

  // Handle input change
  const handleChange = (
    field: keyof DevelopmentGoal,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title?.trim()) {
      toast.error('يرجى إدخال عنوان الهدف');
      return;
    }

    if (!formData.category) {
      toast.error('يرجى اختيار فئة الهدف');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      toast.success(isEditMode ? 'تم تحديث الهدف بنجاح' : 'تم إضافة الهدف بنجاح');
      onOpenChange(false);
    } catch (error) {
      console.error('فشل حفظ الهدف:', error);
      toast.error('حدث خطأ أثناء حفظ الهدف');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get category icon
  const getCategoryIcon = () => {
    const category = goalCategories.find((c) => c.value === formData.category);
  return category?.icon ?? Target;
  };

  const CategoryIcon = getCategoryIcon();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CategoryIcon className="h-5 w-5 text-primary" />
              {isEditMode ? 'تعديل الهدف التطويري' : 'إضافة هدف تطويري جديد'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'قم بتعديل بيانات الهدف التطويري'
                : 'أضف هدفاً استراتيجياً جديداً لخطة التطوير'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* العنوان */}
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-right">
                عنوان الهدف <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title ?? ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="مثال: زيادة عدد المشاريع المنفذة"
                className="text-right"
                required
              />
            </div>

            {/* الوصف */}
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-right">
                الوصف (اختياري)
              </Label>
              <Textarea
                id="description"
                value={formData.description ?? ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="وصف تفصيلي للهدف..."
                className="text-right min-h-[80px]"
                rows={3}
              />
            </div>

            {/* الفئة والنوع */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-right">
                  الفئة <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalCategories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type" className="text-right">
                  نوع الهدف <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* الوحدة والقيمة الحالية */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit" className="text-right">
                  الوحدة <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleChange('unit', value)}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="اختر الوحدة" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalUnits.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currentValue" className="text-right">
                  القيمة الحالية
                </Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  value={formData.currentValue ?? 0}
                  onChange={(e) =>
                    handleChange('currentValue', (() => {
                      const parsed = Number.parseFloat(e.target.value)
                      return Number.isNaN(parsed) ? 0 : parsed
                    })())
                  }
                  placeholder="0"
                  className="text-right"
                />
              </div>
            </div>

            {/* القيم المستهدفة */}
            <div className="space-y-3">
              <Label className="text-right text-base font-semibold">
                القيم المستهدفة
              </Label>

              <div className="grid grid-cols-3 gap-3">
                {[2025, 2026, 2027].map((year) => (
                  <div key={year} className="grid gap-2">
                    <Label
                      htmlFor={`target${year}`}
                      className="text-right text-sm"
                    >
                      {year}
                    </Label>
                    <Input
                      id={`target${year}`}
                      type="number"
                      step="0.01"
                      value={
                        (() => {
                          const raw = formData[`targetValue${year}` as keyof DevelopmentGoal]
                          return typeof raw === 'number' && !Number.isNaN(raw) ? raw : 0
                        })()
                      }
                      onChange={(e) =>
                        handleChange(
                          `targetValue${year}` as keyof DevelopmentGoal,
                          (() => {
                            const parsed = Number.parseFloat(e.target.value)
                            return Number.isNaN(parsed) ? 0 : parsed
                          })()
                        )
                      }
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'جاري الحفظ...'
                : isEditMode
                  ? 'حفظ التعديلات'
                  : 'إضافة الهدف'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
