/**
 * @deprecated تمت إزالة الواجهة التجميعية للخدمات.
 * استخدم الوحدات المتخصصة (centralDataService، pricingService، tenderNotifications، ...إلخ).
 */

const errorMessage = 'تمت إعادة هيكلة الخدمات إلى src/application/services/*. حدث الواردات إلى المسار الجديد.';

export const apiService = new Proxy<Record<string, never>>(
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

export class StorageService {
  constructor() {
    throw new Error(errorMessage);
  }
}

export const storageService = new Proxy<Record<string, never>>(
  {},
  {
    get() {
      throw new Error(errorMessage);
    }
  }
) as never;

export const projectService = storageService;
export const clientService = storageService;
export const tenderService = storageService;
export const fileService = storageService;
export const exportService = storageService;
export const notificationService = storageService;
