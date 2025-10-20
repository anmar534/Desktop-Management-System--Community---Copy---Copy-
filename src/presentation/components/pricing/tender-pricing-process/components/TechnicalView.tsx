import React from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { ScrollArea } from '@/presentation/components/ui/scroll-area';
import { TechnicalFilesUpload } from '@/presentation/pages/Tenders/components/TechnicalFilesUpload';

interface TechnicalViewProps {
  tenderId: string;
}

export const TechnicalView: React.FC<TechnicalViewProps> = ({ tenderId }) => {
  return (
    <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">
      <div className="space-y-6 p-1 pb-20" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-info" />
              رفع ملفات العرض الفني
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TechnicalFilesUpload tenderId={tenderId} />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};


