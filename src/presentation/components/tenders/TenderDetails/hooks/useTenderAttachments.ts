// useTenderAttachments Hook
// Manages tender attachments and technical files

import { useMemo, useCallback } from 'react'
import { FileUploadService } from '@/shared/utils/fileUploadService'
import type { TenderAttachment } from '../types'

export function useTenderAttachments(tender: any) {
  // جلب جميع المرفقات (الأصلية + الفنية)
  const allAttachments = useMemo(() => {
    // 1. جلب المرفقات الأصلية من بيانات المنافسة
    const originalAttachments: TenderAttachment[] = tender.attachments || []

    // 2. جلب الملفات الفنية من خدمة رفع الملفات
    let technicalFiles: TenderAttachment[] = []

    try {
      technicalFiles = FileUploadService.getFilesByTender(tender.id).map((file) => ({
        ...file,
        source: 'technical',
        type: 'technical',
      })) as TenderAttachment[]
    } catch (error) {
      console.log('خطأ في قراءة الملفات الفنية:', error)
    }

    console.log('Checking for attachments for tender:', tender.id)
    console.log('Original attachments:', originalAttachments)
    console.log('Technical files found:', technicalFiles)

    // 3. دمج المرفقات الأصلية مع الملفات الفنية
    const combined = [...originalAttachments, ...technicalFiles]

    console.log('All attachments (original + technical):', combined)

    // إذا لم توجد مرفقات، استخدم بيانات افتراضية للعرض
    if (combined.length === 0) {
      return [
        {
          id: '1',
          name: 'كراسة الشروط والمواصفات.pdf',
          type: 'specifications',
          size: 2621440, // 2.5 MB in bytes
          uploadedAt: '2024-08-15',
          source: 'original',
        },
        {
          id: '2',
          name: 'جدول الكميات.xlsx',
          type: 'quantity',
          size: 1258291, // 1.2 MB in bytes
          uploadedAt: '2024-08-15',
          source: 'original',
        },
        {
          id: '3',
          name: 'المخططات المعمارية.dwg',
          type: 'drawings',
          size: 9123225, // 8.7 MB in bytes
          uploadedAt: '2024-08-15',
          source: 'original',
        },
        {
          id: '4',
          name: 'تقرير الموقع.pdf',
          type: 'report',
          size: 3250585, // 3.1 MB in bytes
          uploadedAt: '2024-08-15',
          source: 'original',
        },
        {
          id: '5',
          name: 'العرض الفني والمواصفات التقنية.pdf',
          type: 'technical',
          size: 5033164, // 4.8 MB in bytes
          uploadedAt: '2024-08-20',
          source: 'technical',
        },
      ] as TenderAttachment[]
    }

    return combined
  }, [tender.id, tender.attachments])

  const handlePreview = useCallback((attachment: any) => {
    if (attachment.source === 'technical') {
      alert(`معاينة الملف الفني: ${attachment.name}\n\nهذا الملف تم رفعه من خلال صفحة التسعير`)
    } else {
      alert(`معاينة الملف: ${attachment.name}\n\nهذه الميزة ستكون متاحة قريباً`)
    }
  }, [])

  const handleDownload = useCallback((attachment: any) => {
    if (attachment.source === 'technical') {
      alert(`تحميل الملف الفني: ${attachment.name}\n\nهذا الملف تم رفعه من خلال صفحة التسعير`)
    } else {
      alert(`تحميل الملف: ${attachment.name}\n\nهذه الميزة ستكون متاحة قريباً`)
    }
  }, [])

  return {
    allAttachments,
    handlePreview,
    handleDownload,
  }
}
