// أدوات مساعدة لعرض حالات المنافسات بشكل بصري مفهوم
import type { LucideIcon } from 'lucide-react';
import {
  Trophy,
  XCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Zap
} from 'lucide-react';
import type { Tender } from '@/data/centralData';

export interface TenderStatusInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  description: string;
}

type TenderStatus = Tender['status'];

const KNOWN_TENDER_STATUSES: readonly TenderStatus[] = [
  'new',
  'under_action',
  'ready_to_submit',
  'submitted',
  'won',
  'lost',
  'expired',
  'cancelled'
] as const;

const TENDER_STATUS_SET = new Set<string>(KNOWN_TENDER_STATUSES);

const normalizeTenderStatus = (status: unknown): TenderStatus | null => {
  if (typeof status !== 'string') {
    return null;
  }

  return TENDER_STATUS_SET.has(status) ? (status as TenderStatus) : null;
};

const DEFAULT_STATUS_INFO: TenderStatusInfo = {
  label: 'غير محدد',
  color: 'text-muted-foreground',
  bgColor: 'bg-muted',
  icon: AlertTriangle,
  description: 'حالة غير معروفة'
};

const STATUS_INFO_MAP: Record<TenderStatus, TenderStatusInfo> = {
  new: {
    label: 'جديدة',
    color: 'text-info',
    bgColor: 'bg-info/10',
    icon: FileText,
    description: 'منافسة جديدة لم يبدأ العمل عليها بعد'
  },
  under_action: {
    label: 'تحت الإجراء',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: Zap,
    description: 'جاري العمل على التسعير أو رفع الملفات'
  },
  ready_to_submit: {
    label: 'جاهزة للتقديم',
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: CheckCircle,
    description: 'تم إنجاز التسعير والملفات الفنية'
  },
  submitted: {
    label: 'بانتظار النتائج',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: Clock,
    description: 'تم تقديم العرض وننتظر إعلان النتائج'
  },
  won: {
    label: 'فائزة 🏆',
    color: 'text-success-foreground',
    bgColor: 'bg-success',
    icon: Trophy,
    description: 'تم الفوز بهذه المنافسة'
  },
  lost: {
    label: 'خاسرة',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: XCircle,
    description: 'لم يتم الفوز بهذه المنافسة'
  },
  expired: {
    label: 'منتهية الصلاحية',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: AlertTriangle,
    description: 'انتهت مدة تقديم العروض'
  },
  cancelled: {
    label: 'ملغاة',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: XCircle,
    description: 'تم إلغاء هذه المنافسة'
  }
};

export const getTenderStatusInfo = (status: TenderStatus | string | undefined | null): TenderStatusInfo => {
  const normalizedStatus = normalizeTenderStatus(status ?? undefined);
  return (normalizedStatus ? STATUS_INFO_MAP[normalizedStatus] : undefined) ?? DEFAULT_STATUS_INFO;
};

const NEXT_ACTION_BY_STATUS: Partial<Record<TenderStatus, string>> = {
  new: 'ابدأ عملية التسعير',
  under_action: 'أكمل التسعير ورفع الملفات الفنية',
  ready_to_submit: 'قدم العرض للعميل',
  submitted: 'انتظر إعلان النتائج',
  won: 'ابدأ تنفيذ المشروع',
  lost: 'راجع التسعير للمنافسات القادمة'
};

// دالة للحصول على الخطوة التالية المطلوبة
export const getNextAction = (status: TenderStatus | string | undefined | null): string => {
  const normalizedStatus = normalizeTenderStatus(status ?? undefined);
  return (normalizedStatus ? NEXT_ACTION_BY_STATUS[normalizedStatus] : undefined) ?? '';
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const hasUploadedTechnicalFiles = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

type TenderProgressSource = Pick<Tender, 'status'> & Partial<Pick<Tender, 'pricedItems' | 'itemsPriced' | 'totalItems' | 'technicalFilesUploaded' | 'daysLeft'>> & {
  pricedItems?: number | string | null;
  itemsPriced?: number | string | null;
  totalItems?: number | string | null;
  daysLeft?: number | string | null;
};

// دالة لحساب نسبة الإنجاز العامة
export const getTenderCompletionPercentage = (tender: TenderProgressSource): number => {
  const status = normalizeTenderStatus(tender.status);

  if (status === 'under_action') {
    const totalItems = toFiniteNumber(tender.totalItems, 0);
    const pricedItems = toFiniteNumber(tender.pricedItems ?? tender.itemsPriced, 0);
    const ratio = totalItems > 0 ? Math.min(pricedItems, totalItems) / totalItems : 0;
    const pricingProgress = ratio * 70;
    const filesProgress = hasUploadedTechnicalFiles(tender.technicalFilesUploaded) ? 20 : 0;
    return clamp(pricingProgress + filesProgress, 0, 90);
  }

  switch (status) {
    case 'new':
      return 0;
    case 'ready_to_submit':
      return 95;
    case 'submitted':
      return 98;
    case 'won':
    case 'lost':
      return 100;
    default:
      return 0;
  }
};

const URGENT_STATUSES: readonly TenderStatus[] = [
  'new',
  'under_action',
  'ready_to_submit'
] as const;

// دالة للحصول على أولوية العمل (للترتيب)
export const getTenderPriority = (tender: TenderProgressSource): number => {
  const status = normalizeTenderStatus(tender.status);
  if (!status) {
    return 6;
  }

  const daysLeft = toFiniteNumber(tender.daysLeft, 0);

  if (daysLeft <= 3 && URGENT_STATUSES.includes(status)) {
    return 1; // أولوية عاجلة
  }

  switch (status) {
    case 'ready_to_submit':
      return 2; // جاهزة للتقديم
    case 'under_action':
      return 3; // تحت الإجراء
    case 'submitted':
      return 4; // بانتظار النتائج
    case 'new':
      return 5; // جديدة
    default:
      return 6; // أولوية منخفضة
  }
};