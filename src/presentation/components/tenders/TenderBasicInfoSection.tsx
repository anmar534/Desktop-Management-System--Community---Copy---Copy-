/**
 * Tender Basic Info Section Component
 *
 * @fileoverview Form section for basic tender information fields.
 * Extracted from NewTenderForm.tsx for better organization.
 *
 * @module presentation/components/tenders/TenderBasicInfoSection
 */

import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Textarea } from '@/presentation/components/ui/textarea'
import { StatusBadge } from '@/presentation/components/ui/status-badge'
import { InlineAlert } from '@/presentation/components/ui/inline-alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Building2, MapPin, Clock, DollarSign, Calendar } from 'lucide-react'
import type { TenderFormData, ProjectDurationUnit } from '@/shared/utils/tender/tenderFormDefaults'
import { getDurationUnitLabel } from '@/shared/utils/tender/tenderFormDefaults'
import {
  parseNumericValue,
  calculateDaysRemaining,
  formatCurrency,
} from '@/shared/utils/tender/tenderFormValidators'
import {
  computeUrgencyInfo,
  computeCompetitionInfo,
  computeTenderInsightsAlert,
} from '@/shared/utils/tender/tenderInsightCalculator'

/**
 * Props for TenderBasicInfoSection component
 */
export interface TenderBasicInfoSectionProps {
  /** Form data */
  formData: TenderFormData
  /** Callback when form data changes */
  onFormDataChange: (field: keyof TenderFormData, value: string) => void
}

/**
 * TenderBasicInfoSection Component
 *
 * Displays all basic tender information fields with real-time insights.
 *
 * @example
 * ```tsx
 * <TenderBasicInfoSection
 *   formData={formData}
 *   onFormDataChange={handleInputChange}
 * />
 * ```
 */
export function TenderBasicInfoSection({
  formData,
  onFormDataChange,
}: TenderBasicInfoSectionProps) {
  const handleInputChange = useCallback(
    (field: keyof TenderFormData, value: string) => {
      onFormDataChange(field, value)
    },
    [onFormDataChange],
  )

  // Calculate insights
  const daysRemaining = useMemo(
    () => calculateDaysRemaining(formData.deadline),
    [formData.deadline],
  )
  const urgencyInfo = useMemo(() => computeUrgencyInfo(daysRemaining), [daysRemaining])
  const parsedEstimatedValue = useMemo(
    () => parseNumericValue(formData.estimatedValue),
    [formData.estimatedValue],
  )
  const competitionInfo = useMemo(
    () => computeCompetitionInfo(parsedEstimatedValue),
    [parsedEstimatedValue],
  )
  const formattedEstimatedValue = useMemo(
    () => formatCurrency(parsedEstimatedValue ?? 0),
    [parsedEstimatedValue],
  )
  const tenderInsightsAlert = useMemo(() => {
    return computeTenderInsightsAlert({
      deadline: formData.deadline,
      estimatedValue: formData.estimatedValue,
      daysRemaining,
      urgencyInfo,
      competitionInfo,
      formattedEstimatedValue,
    })
  }, [
    competitionInfo,
    daysRemaining,
    formData.deadline,
    formData.estimatedValue,
    formattedEstimatedValue,
    urgencyInfo,
  ])

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          معلومات المنافسة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* الخانات الإلزامية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* اسم المنافسة - إلزامي */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
              اسم المنافسة
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="أدخل اسم المنافسة"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-background"
              required
            />
          </div>

          {/* الجهة المالكة - إلزامي */}
          <div className="space-y-2">
            <Label htmlFor="ownerEntity" className="text-sm font-medium flex items-center gap-1">
              الجهة المالكة
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ownerEntity"
              placeholder="أدخل اسم الجهة المالكة"
              value={formData.ownerEntity}
              onChange={(e) => handleInputChange('ownerEntity', e.target.value)}
              className="bg-background"
              required
            />
          </div>

          {/* موقع التنفيذ - إلزامي */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              موقع التنفيذ
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              placeholder="أدخل موقع تنفيذ المشروع"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="bg-background"
              required
            />
          </div>

          {/* مدة المشروع - إلزامي */}
          <div className="space-y-2">
            <Label
              htmlFor="projectDuration"
              className="text-sm font-medium flex items-center gap-1"
            >
              <Clock className="h-4 w-4" />
              مدة المشروع
              <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="projectDuration"
                type="number"
                placeholder="12"
                value={formData.projectDuration}
                onChange={(e) => handleInputChange('projectDuration', e.target.value)}
                className="bg-background flex-1"
                required
                min="1"
              />
              <Select
                value={formData.projectDurationUnit}
                onValueChange={(value) =>
                  handleInputChange('projectDurationUnit', value as ProjectDurationUnit)
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{getDurationUnitLabel('day')}</SelectItem>
                  <SelectItem value="month">{getDurationUnitLabel('month')}</SelectItem>
                  <SelectItem value="year">{getDurationUnitLabel('year')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* سعر الكراسة - إلزامي */}
          <div className="space-y-2">
            <Label htmlFor="bookletPrice" className="text-sm font-medium flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              سعر الكراسة
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bookletPrice"
              type="number"
              placeholder="0.00"
              value={formData.bookletPrice}
              onChange={(e) => handleInputChange('bookletPrice', e.target.value)}
              className="bg-background"
              required
            />
          </div>

          {/* الموعد النهائي للتقديم - إلزامي */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              الموعد النهائي للتقديم
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              className="bg-background"
              required
            />
          </div>
        </div>

        {/* الحقول الاختيارية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">نوع المنافسة</Label>
            <Input
              id="type"
              placeholder="مثال: إنشاءات، صيانة، توريدات"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedValue">القيمة المتوقعة</Label>
            <Input
              id="estimatedValue"
              type="number"
              placeholder="القيمة التقديرية بالريال السعودي"
              value={formData.estimatedValue}
              onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">وصف المنافسة</Label>
          <Textarea
            id="description"
            placeholder="وصف مفصل للمنافسة والنطاق المطلوب"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="bg-background"
          />
        </div>

        {/* تحليل المواعيد والقيمة */}
        {(formData.deadline || formData.estimatedValue) && (
          <div className="mt-4 space-y-3">
            {tenderInsightsAlert && (
              <InlineAlert
                variant={tenderInsightsAlert.variant}
                title={tenderInsightsAlert.title}
                description={tenderInsightsAlert.description}
              />
            )}
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <h4 className="mb-3 font-medium text-foreground">تحليل سريع</h4>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                {formData.deadline && (
                  <div>
                    <span className="text-muted-foreground">الأيام المتبقية:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-warning">{daysRemaining} أيام</span>
                      <StatusBadge
                        status={urgencyInfo.status}
                        label={urgencyInfo.label}
                        size="sm"
                        showIcon={false}
                        className="shadow-none"
                      />
                    </div>
                  </div>
                )}
                {formData.estimatedValue && (
                  <>
                    <div>
                      <span className="text-muted-foreground">مستوى المنافسة:</span>
                      <StatusBadge
                        status={competitionInfo.status}
                        label={competitionInfo.label}
                        size="sm"
                        showIcon={false}
                        className="shadow-none"
                      />
                    </div>
                    <div>
                      <span className="text-muted-foreground">القيمة المنسقة:</span>
                      <div className="font-medium text-success">{formattedEstimatedValue}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
