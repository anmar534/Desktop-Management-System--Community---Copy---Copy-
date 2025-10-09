// خدمة رفع وحفظ الملفات في التخزين المحلي
export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64 encoded content
  uploadDate: string;
  tenderId: string;
}

import { authorizeExport } from './desktopSecurity'
import type { ExportAuthorizationRequest } from './desktopSecurity'
import { safeLocalStorage } from './storage'

export class FileUploadService {
  private static readonly STORAGE_KEY = 'tender_technical_files';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-powerpoint': 'ppt'
  };

  // التحقق من نوع الملف المسموح
  static isFileTypeAllowed(file: File): boolean {
    return Object.keys(this.ALLOWED_TYPES).includes(file.type);
  }

  // التحقق من حجم الملف
  static isFileSizeValid(file: File): boolean {
    return file.size <= this.MAX_FILE_SIZE;
  }

  // تحويل الملف إلى base64
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // إزالة بادئة data:type;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // رفع وحفظ ملف
  static async uploadFile(file: File, tenderId: string): Promise<UploadedFile> {
    // التحقق من نوع الملف
    if (!this.isFileTypeAllowed(file)) {
      throw new Error('نوع الملف غير مدعوم. الملفات المدعومة: Word, Excel, PowerPoint, PDF');
    }

    // التحقق من حجم الملف
    if (!this.isFileSizeValid(file)) {
      throw new Error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
    }

    try {
      const content = await this.fileToBase64(file);
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        content,
        uploadDate: new Date().toISOString(),
        tenderId
      };

      // حفظ في التخزين المحلي
      this.saveFile(uploadedFile);
      return uploadedFile;
    } catch (error) {
      throw new Error('فشل في رفع الملف: ' + (error as Error).message);
    }
  }

  // حفظ الملف في التخزين المحلي
  private static saveFile(file: UploadedFile): void {
    const existingFiles = this.getAllFiles();
    const updatedFiles = [...existingFiles, file];
    safeLocalStorage.setItem(this.STORAGE_KEY, updatedFiles);
  }

  // جلب جميع الملفات
  static getAllFiles(): UploadedFile[] {
    try {
      return safeLocalStorage.getItem<UploadedFile[]>(this.STORAGE_KEY, []);
    } catch (error) {
      console.error('Error loading files:', error);
      return [];
    }
  }

  // جلب ملفات منافسة محددة
  static getFilesByTender(tenderId: string): UploadedFile[] {
    const allFiles = this.getAllFiles();
    return allFiles.filter(file => file.tenderId === tenderId);
  }

  // حذف ملف
  static deleteFile(fileId: string): boolean {
    try {
      const existingFiles = this.getAllFiles();
      const updatedFiles = existingFiles.filter(file => file.id !== fileId);
      safeLocalStorage.setItem(this.STORAGE_KEY, updatedFiles);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // تحميل ملف
  static async downloadFile(file: UploadedFile): Promise<void> {
    try {
      const extension = file.name.includes('.')
        ? file.name.split('.').pop()?.toLowerCase() ?? ''
        : '';

      const format = (
        ['csv', 'json', 'xlsx', 'xls', 'pdf', 'docx', 'doc', 'pptx', 'ppt'].includes(extension)
          ? extension
          : 'binary'
      ) as ExportAuthorizationRequest['format'];

      const approximateBytes = Math.floor((file.content.length * 3) / 4);

      const authorization = await authorizeExport({
        format,
        filename: file.name,
        bytes: approximateBytes,
        origin: 'FileUploadService.downloadFile',
        metadata: {
          tenderId: file.tenderId,
          mimeType: file.type
        }
      });

      if (!authorization.allowed) {
        throw new Error(authorization.reason ?? 'export-not-authorized');
      }

      const payload = authorization.payload ?? {
        format,
        filename: file.name
      };

      const sanitizedFilename = payload.filename && payload.filename.length > 0 ? payload.filename : file.name;
      const finalFilename = sanitizedFilename.includes('.') ? sanitizedFilename : `${sanitizedFilename}.${extension || 'bin'}`;

      const dataUrl = `data:${file.type};base64,${file.content}`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = finalFilename;
      link.click();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('فشل في تحميل الملف');
    }
  }

  // تنسيق حجم الملف للعرض
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 بايت';
    
    const k = 1024;
    const sizes = ['بايت', 'كيلو بايت', 'ميجا بايت', 'جيجا بايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // الحصول على أيقونة الملف حسب النوع
  static getFileIcon(fileType: string): string {
    const type = this.ALLOWED_TYPES[fileType as keyof typeof this.ALLOWED_TYPES];
    switch (type) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📽️';
      default: return '📎';
    }
  }
}