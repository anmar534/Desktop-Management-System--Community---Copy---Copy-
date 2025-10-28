/**
 * File Manager Module
 * Responsible for copying and managing attachments from tender to project
 */

export class FileManager {
  /**
   * Copy attachments from tender to project
   * Creates project attachments from tender files
   */
  static async copyAttachments(tenderId: string, projectId: string): Promise<void> {
    try {
      console.log(`🔄 نسخ المرفقات من المنافسة: ${tenderId}`)

      const { FileUploadService } = await import('@/utils/fileUploadService')

      // جلب ملفات المنافسة الفنية
      const tenderFiles = FileUploadService.getFilesByTender(tenderId)

      if (!tenderFiles || tenderFiles.length === 0) {
        console.log('⚠️ لا توجد مرفقات للنسخ من المنافسة')
        return
      }

      // نسخ الملفات للمشروع (تغيير tenderId إلى projectId)
      const projectFiles = tenderFiles.map((file) => ({
        ...file,
        id: `proj_file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenderId: projectId, // استخدام projectId كمعرف للمشروع
        uploadDate: new Date().toISOString(),
      }))

      // حفظ الملفات في التخزين
      const existingFiles = FileUploadService.getAllFiles()
      const allFiles = [...existingFiles, ...projectFiles]
      const { safeLocalStorage } = await import('@/shared/utils/storage/storage')
      safeLocalStorage.setItem('tender_technical_files', allFiles)

      console.log(`✅ تم نسخ ${projectFiles.length} مرفق من المنافسة إلى المشروع`)
    } catch (error) {
      console.error('❌ خطأ في نسخ المرفقات:', error)
      // لا نرمي الخطأ لأن المرفقات ليست ضرورية لإنشاء المشروع
      console.warn('⚠️ تم تخطي نسخ المرفقات بسبب خطأ')
    }
  }
}
