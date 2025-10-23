// GeneralInfoTab Component
// General information tab displaying tender details, dates, and values

import React from 'react'
import { TenderInfoCard, InfoRow } from '../components/TenderInfoCard'
import { Building2, Calendar, MapPin, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'

interface GeneralInfoTabProps {
  tender: any
  isReadyToSubmit: boolean
  isPricingCompleted: boolean
  isTechnicalFilesUploaded: boolean
  formatCurrencyValue: (value: number, options?: any) => string
}

export function GeneralInfoTab({
  tender,
  isReadyToSubmit,
  isPricingCompleted,
  isTechnicalFilesUploaded,
  formatCurrencyValue,
}: GeneralInfoTabProps) {
  const formatBookletPrice = () => {
    const documentPrice = tender.documentPrice
    const bookletPrice = tender.bookletPrice
    const rawPrice = documentPrice ?? bookletPrice

    if (rawPrice === null || rawPrice === undefined || rawPrice === '') {
      return '-'
    }

    const numeric = typeof rawPrice === 'string' ? Number.parseFloat(rawPrice) : Number(rawPrice)

    if (!Number.isFinite(numeric) || numeric <= 0) {
      return '-'
    }

    return formatCurrencyValue(numeric, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatExpectedValue = () => {
    if (tender.totalValue !== undefined && tender.totalValue !== null) {
      return `${formatCurrencyValue(tender.totalValue)} (من التسعير)`
    }
    if (tender.value !== undefined && tender.value !== null) {
      return formatCurrencyValue(tender.value)
    }
    return '-'
  }

  return (
    <div className="space-y-6">
      {/* تنبيهات الحالة */}
      {isReadyToSubmit && (
        <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">جاهزة للإرسال</p>
          </div>
          <p className="text-sm text-success mt-1 opacity-80">
            تم إكمال التسعير ورفع الملفات الفنية بنجاح. يمكنك الآن إرسال العرض للمنافسة.
          </p>
        </div>
      )}

      {isPricingCompleted && !isTechnicalFilesUploaded && (
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-center gap-2 text-warning">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">يحتاج ملفات فنية</p>
          </div>
          <p className="text-sm text-warning mt-1 opacity-90">
            تم إكمال التسعير ولكن لم يتم رفع الملفات الفنية بعد. يرجى الذهاب إلى صفحة التسعير وتبويب
            &quot;العرض الفني&quot; لرفع الملفات المطلوبة.
          </p>
        </div>
      )}

      {!isPricingCompleted && (
        <div className="p-4 bg-info/10 border border-info/30 rounded-lg">
          <div className="flex items-center gap-2 text-info">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">التسعير غير مكتمل</p>
          </div>
          <p className="text-sm text-info mt-1 opacity-90">
            لم يتم إكمال تسعير هذه المنافسة بعد. يرجى الذهاب إلى صفحة التسعير لإكمال العملية قبل
            إرسال العرض.
          </p>
        </div>
      )}

      {/* البطاقات الرئيسية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* معلومات عامة */}
        <TenderInfoCard title="معلومات عامة" icon={Building2}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="العميل" value={tender.client || tender.ownerEntity || 'غير محدد'} />
            <InfoRow label="النوع" value={tender.type || 'غير محدد'} />
            <InfoRow label="الموقع" value={tender.location || 'غير محدد'} icon={MapPin} fullWidth />
            <InfoRow
              label="الوصف"
              value={
                <div className="text-muted-foreground">
                  {tender.description || tender.scope || 'لا يوجد وصف متاح'}
                </div>
              }
              fullWidth
            />
          </div>
        </TenderInfoCard>

        {/* المواعيد والقيمة */}
        <TenderInfoCard title="المواعيد والقيمة" icon={Calendar}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="الموعد النهائي" value={tender.deadline || '-'} />
            <InfoRow label="تاريخ التقديم" value={tender.submissionDate || '-'} />
            <InfoRow
              label="مدة التنفيذ"
              value={tender.executionPeriod || tender.projectDuration || '-'}
            />
            <InfoRow label="سعر الكراسة" value={formatBookletPrice()} />
            <InfoRow
              label="القيمة المتوقعة"
              value={
                <div>
                  <div className="font-bold text-lg text-success">{formatExpectedValue()}</div>
                  {tender.totalValue && tender.value && (
                    <div className="text-xs text-muted-foreground mt-1">
                      القيمة الأولية: {formatCurrencyValue(tender.value)}
                    </div>
                  )}
                </div>
              }
              icon={DollarSign}
              fullWidth
            />
          </div>
        </TenderInfoCard>

        {/* معلومات تقنية ومالية */}
        <TenderInfoCard title="معلومات تقنية ومالية" icon={Building2} className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <InfoRow label="رقم المنافسة" value={tender.tenderNumber || tender.id || '-'} />
            <InfoRow label="المصدر" value={tender.source || '-'} />
            <InfoRow label="التصنيف" value={tender.category || tender.classification || '-'} />
            <InfoRow label="تاريخ البدء" value={tender.startDate || '-'} />
            <InfoRow label="تاريخ الانتهاء" value={tender.endDate || '-'} />
            <InfoRow label="نوع العقد" value={tender.contractType || '-'} />
            <InfoRow label="طريقة الدفع" value={tender.paymentMethod || '-'} />
            <InfoRow
              label="ضمان العرض"
              value={
                tender.bidBond !== undefined && tender.bidBond !== null && tender.bidBond !== ''
                  ? formatCurrencyValue(tender.bidBond, { maximumFractionDigits: 0 })
                  : '-'
              }
            />
            <InfoRow
              label="ضمان الأداء"
              value={tender.performanceBond ? `${tender.performanceBond}%` : '-'}
            />
          </div>
        </TenderInfoCard>
      </div>
    </div>
  )
}
