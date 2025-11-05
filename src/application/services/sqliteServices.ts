/**
 * @deprecated تمت إزالة خدمات SQLite. استخدم centralDataService والخدمات المتخصصة الحالية.
 * بقيت وحدات SQLite الاختبارية داخل test/support/sqlite لأغراض التكافؤ فقط.
 */

const errorMessage = 'تمت إعادة هيكلة الخدمات إلى src/application/services/*. استخدم المسار الجديد للخدمات النشطة.';

export const databaseServices = new Proxy<Record<string, never>>(
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

export default databaseServices;
