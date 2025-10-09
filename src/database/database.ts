/**
 * @deprecated تمت إزالة طبقة SQLite التشغيلية.
 * يعتمد النظام الآن على electron-store و centralDataService.
 * بقيت أدوات SQLite ضمن test/support لأغراض الاختبارات فقط.
 */

const errorMessage = 'databaseService تمت إزالته من المسار التشغيلي. حدّث الواردات إلى الخدمات الحية (centralDataService).';

export const databaseService = new Proxy<Record<string, never>>(
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

export default databaseService;
