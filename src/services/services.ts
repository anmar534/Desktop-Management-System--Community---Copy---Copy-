/**
 * @deprecated تمت إزالة وحدة الخدمات القديمة.
 * يرجى استيراد الخدمات من الوحدات المتخصصة مثل centralDataService أو pricingService.
 * أي محاولة لاستيراد الكائن legacy "services" ستُطلق خطأً واضحًا للمطور.
 */

const errorMessage = 'تم نقل الخدمات إلى src/application/services/*. حدّث الواردات إلى الوحدات الجديدة.';

export const services = new Proxy<Record<string, never>>(
  {},
  {
    get() {
      throw new Error(errorMessage);
    },
    set() {
      throw new Error(errorMessage);
    },
    has() {
      throw new Error(errorMessage);
    }
  }
) as never;

export default services;
