import type React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { DeleteConfirmation } from './ui/confirmation-dialog';
import { EmptyState } from './PageLayout';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Trash2
} from 'lucide-react';
import type { UploadedFile } from '../utils/fileUploadService';
import { FileUploadService } from '../utils/fileUploadService';
import { formatDateValue } from '../utils/formatters';
import { authorizeDragAndDrop } from '../utils/desktopSecurity';
import type { DragFileDescriptor } from '../utils/desktopSecurity';
import { useFinancialState } from '@/application/context';
import { toast } from 'sonner';
import { APP_EVENTS, emit } from '@/events/bus';

interface TechnicalFilesUploadProps {
  tenderId: string;
}

export function TechnicalFilesUpload({ tenderId }: TechnicalFilesUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // استخدام hooks للتحديث التلقائي
  const { tenders: tendersState } = useFinancialState();
  const { tenders, updateTender } = tendersState;

  const formattedTenderFiles = useMemo(() => files, [files]);

  // تحميل الملفات المحفوظة عند بدء التشغيل
  useEffect(() => {
    if (!tenderId) {
      return;
    }

    const savedFiles = FileUploadService.getFilesByTender(tenderId) ?? [];
    setFiles(savedFiles);
  }, [tenderId]);

  const evaluateIncomingFiles = useCallback(
    async (incoming: File[]): Promise<File[]> => {
      if (!incoming.length) {
        return [];
      }

      if (!tenderId) {
        toast.error('يرجى تحديد منافسة أولاً');
        return [];
      }

      try {
        const assessment = await authorizeDragAndDrop({
          intent: 'technical-files-upload',
          source: 'component:TechnicalFilesUpload',
          tenderId,
          files: incoming.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size
          })),
          metadata: {
            count: incoming.length
          }
        });

        const descriptors: DragFileDescriptor[] =
          (assessment.payload?.files as DragFileDescriptor[] | undefined) ??
          incoming.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
            allowed: assessment.allowed
          }));

        const allowedFiles: File[] = [];
        const blocked: string[] = [];

        descriptors.forEach((descriptor, index) => {
          const original = incoming[index];
          if (!original) {
            return;
          }

          const isAllowed = descriptor.allowed !== false;
          if (isAllowed) {
            allowedFiles.push(original);
          } else {
            const reason = descriptor.reason ? ` (${descriptor.reason})` : '';
            blocked.push(`${descriptor.name ?? original.name}${reason}`);
          }
        });

        if (blocked.length > 0) {
          const description = blocked.slice(0, 3).join('، ');
          toast.warning('تم رفض بعض الملفات لأسباب أمنية', {
            description: blocked.length > 3 ? `${description}، وغير ذلك ${blocked.length - 3} ملفات أخرى` : description
          });
        }

        if (!allowedFiles.length) {
          toast.error('لا توجد ملفات متوافقة مع سياسة الأمان');
        }

        return allowedFiles;
      } catch (error) {
        console.warn('[TechnicalFilesUpload] فشل تقييم سياسة السحب والإفلات:', error);
        return incoming;
      }
    },
    [tenderId]
  );

  // دالة تحديث حالة المنافسة عند رفع أو حذف الملفات
  const updateTenderTechnicalFilesStatus = useCallback(async () => {
    if (!tenderId) return;

    try {
      // البحث عن المنافسة الحالية
      const currentTender = tenders.find(tender => tender.id === tenderId);
      if (!currentTender) return;

      // فحص إذا كان هناك ملفات مرفوعة
      const tenderFiles = FileUploadService.getFilesByTender(tenderId) ?? [];
      const hasFiles = tenderFiles.length > 0;

      // تحديث حالة المنافسة
      const updatedTender = {
        ...currentTender,
        technicalFilesUploaded: hasFiles,
        lastUpdate: new Date().toISOString(),
        lastAction: hasFiles ? 'تم رفع ملفات العرض الفني' : 'تم حذف ملفات العرض الفني'
      };

      await updateTender(updatedTender);

      // إطلاق حدث مخصص لإشعار المكونات الأخرى
      emit(APP_EVENTS.TENDERS_UPDATED, { tenderId, updatedTender, technicalFilesUploaded: hasFiles });

      console.log('🔄 تم تحديث حالة الملفات الفنية:', {
        tenderId,
        technicalFilesUploaded: hasFiles,
        filesCount: tenderFiles.length
      });

    } catch (error) {
      console.error('Error updating tender technical files status:', error);
    }
  }, [tenderId, tenders, updateTender]);

  // معالجة رفع الملفات
  const handleFileUpload = useCallback(async (selectedFiles: File[]) => {
    if (!tenderId) {
      toast.error('يرجى تحديد منافسة أولاً');
      return;
    }

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        try {
          const uploadedFile = await FileUploadService.uploadFile(file, tenderId);
          setFiles(current => [...current, uploadedFile]);
          toast.success(`تم رفع الملف: ${file.name}`);
        } catch (error) {
          toast.error(`فشل رفع الملف ${file.name}: ${(error as Error).message}`);
        }
      }

      // تحديث قائمة الملفات
      const updatedFiles = FileUploadService.getFilesByTender(tenderId) ?? [];
      setFiles(updatedFiles);

      // تحديث حالة المنافسة تلقائياً
      await updateTenderTechnicalFilesStatus();

    } catch (error) {
      console.error('⚠️ فشل رفع الملفات:', error);
      toast.error('حدث خطأ أثناء رفع الملفات');
    } finally {
      setIsUploading(false);
    }
  }, [tenderId, updateTenderTechnicalFilesStatus]);

  // معالجة السحب والإفلات
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const filesArray = Array.from(droppedFiles);
      void (async () => {
        const evaluated = await evaluateIncomingFiles(filesArray);
        if (evaluated.length > 0) {
          await handleFileUpload(evaluated);
        }
      })();
    }
  }, [handleFileUpload, evaluateIncomingFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // معالجة اختيار الملفات
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const filesArray = Array.from(selectedFiles);
      void (async () => {
        const evaluated = await evaluateIncomingFiles(filesArray);
        if (evaluated.length > 0) {
          await handleFileUpload(evaluated);
        }
      })();
    }
    // إعادة تعيين قيمة الـ input لتمكين رفع نفس الملف مرة أخرى
    e.target.value = '';
  };

  // حذف ملف
  const requestDeleteFile = (file: UploadedFile) => {
    setDeleteTarget(file);
  };

  const confirmDeleteFile = async () => {
    if (!deleteTarget) {
      return;
    }

    const fileId = deleteTarget.id;

    if (FileUploadService.deleteFile(fileId)) {
      setFiles(current => current.filter(file => file.id !== fileId));
      toast.success('تم حذف الملف بنجاح');

      await updateTenderTechnicalFilesStatus();
    } else {
      toast.error('فشل في حذف الملف');
    }

    setDeleteTarget(null);
  };

  // تحميل ملف
  const handleDownloadFile = async (file: UploadedFile) => {
    try {
      await FileUploadService.downloadFile(file);
      toast.success('تم تحميل الملف بنجاح');
    } catch (error) {
      console.error('⚠️ فشل تحميل الملف:', error);
      toast.error('فشل في تحميل الملف');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* منطقة رفع الملفات */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleFileSelect}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          رفع ملفات العرض الفني
        </h3>
        <p className="text-gray-500 mb-4">
          اسحب وأفلت الملفات هنا أو انقر للاختيار
        </p>
        <Button
          variant="outline"
          disabled={isUploading || !tenderId}
          className="mx-auto"
        >
          {isUploading ? 'جارٍ الرفع...' : 'اختيار الملفات'}
        </Button>
        
        {/* معلومات الملفات المدعومة */}
        <div className="mt-4 text-xs text-gray-500">
          <p>الملفات المدعومة: Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), PDF (.pdf)</p>
          <p>الحد الأقصى: 10 ميجابايت لكل ملف</p>
        </div>
      </div>

      {/* حقل الإدخال المخفي */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="رفع ملفات العرض الفني"
      />

      {/* تحذير إذا لم يتم تحديد منافسة */}
      {!tenderId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            يرجى تحديد منافسة من القائمة أولاً لتتمكن من رفع الملفات
          </AlertDescription>
        </Alert>
      )}

      {/* قائمة الملفات المرفوعة */}
      {formattedTenderFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            الملفات المرفوعة ({formattedTenderFiles.length})
          </h4>
          
          <div className="grid gap-3">
            {formattedTenderFiles.map(file => (
              <Card key={file.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {FileUploadService.getFileIcon(file.type)}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{FileUploadService.formatFileSize(file.size)}</span>
                          <span>{formatDateValue(file.uploadDate ?? Date.now(), { locale: 'ar-SA' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        مرفوع
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestDeleteFile(file)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* رسالة عدم وجود ملفات */}
      {formattedTenderFiles.length === 0 && tenderId && (
        <EmptyState
          icon={FileText}
          title="لا توجد ملفات مرفوعة"
          description="ابدأ برفع ملفات العرض الفني للمنافسة لتظهر هنا."
          actionLabel="رفع الملفات"
          onAction={handleFileSelect}
        />
      )}
      <DeleteConfirmation
        itemName={deleteTarget?.name ?? 'هذا الملف'}
        onConfirm={confirmDeleteFile}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}