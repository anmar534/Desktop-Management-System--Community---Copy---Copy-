/**
 * Event Bus بسيط يعتمد EventTarget
 * on(event, handler), off(event, handler), emit(event, detail?)
 */

type Handler<T = unknown> = (event: CustomEvent<T>) => void;

class SimpleEventBus {
  private target = new EventTarget();

  on<T = unknown>(event: string, handler: Handler<T>) {
    this.target.addEventListener(event, handler as EventListener);
  }

  off<T = unknown>(event: string, handler: Handler<T>) {
    this.target.removeEventListener(event, handler as EventListener);
  }

  emit<T = unknown>(event: string, detail?: T) {
    const evt = new CustomEvent(event, { detail });
    this.target.dispatchEvent(evt);
  }
}

export const bus = new SimpleEventBus();

// أسماء أحداث قياسية
// المصدر الموحد لأسماء الأحداث في النظام
export const APP_EVENTS = {
  // منافسات
  TENDERS_UPDATED: 'tenders-updated',
  TENDER_UPDATED: 'tender-updated',
  OPEN_TENDER_DETAILS: 'open-tender-details',

  // مشاريع
  PROJECTS_UPDATED: 'projects-updated',

  // عملاء
  CLIENTS_UPDATED: 'clients-updated',

  // مصروفات
  EXPENSES_UPDATED: 'expenses-updated',

  // مالية - حسابات وبنود
  BANK_ACCOUNTS_UPDATED: 'bank-accounts-updated',
  INVOICES_UPDATED: 'financial-invoices-updated',
  BUDGETS_UPDATED: 'financial-budgets-updated',
  FINANCIAL_REPORTS_UPDATED: 'financial-reports-updated',

  // أوامر شراء
  PURCHASE_ORDERS_UPDATED: 'purchase-orders-updated',
  SYSTEM_PURCHASE_UPDATED: 'system-purchase-updated',

  // BOQ
  BOQ_UPDATED: 'boq-updated',

  // تطوير/إحصاءات
  DEVELOPMENT_UPDATED: 'development-updated',
  SYSTEM_STATS_UPDATED: 'system-stats-updated',

  // تكلفة المشروع / المشتريات
  OPEN_EXPENSE_MODAL: 'open-expense-modal', // فتح نافذة إضافة مصروف/أمر شراء مع سياق بند التكلفة
  PURCHASE_ALLOCATED_TO_COST: 'purchase-allocated-to-cost', // تم تخصيص مبلغ PO إلى بند تكلفة
  COST_ENVELOPE_UPDATED: 'cost-envelope-updated', // أي تغيير في مسودة BOQ التكلفة للمشروع
} as const;

export type AppEventName = typeof APP_EVENTS[keyof typeof APP_EVENTS];

export function emit<T = unknown>(event: AppEventName, detail?: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  } catch (error) {
    console.warn('تعذر إرسال الحدث عبر EventTarget:', { event, error });
  }
}
