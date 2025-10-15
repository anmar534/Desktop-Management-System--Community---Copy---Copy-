import type React from 'react';
import clsx from 'clsx';
import { FileText, ExternalLink } from 'lucide-react';
import type { DocumentsWidgetData, BaseWidgetProps, DocumentItem } from '../types';
import { WidgetContainer, type WidgetStatusVariant } from './WidgetContainer';

export interface DocumentsWidgetProps extends Omit<BaseWidgetProps, 'data'> {
  data: DocumentsWidgetData;
  onOpenDocument?: (document: DocumentItem) => void;
}

const statusClasses: Record<string, string> = {
  completed: 'text-success',
  generating: 'text-info',
  pending: 'text-warning',
  failed: 'text-destructive',
};

export const DocumentsWidget: React.FC<DocumentsWidgetProps> = ({ data, loading, error, onRefresh, onOpenDocument }) => {
  const { title, subtitle, documents, status = 'normal' } = data;
  const statusVariant: WidgetStatusVariant = status === 'normal' ? 'default' : status;

  return (
    <WidgetContainer
      title={title}
      description={subtitle}
      icon={<FileText className="h-4 w-4 text-primary" />}
      status={statusVariant}
      isLoading={loading}
      error={error}
      onRefresh={onRefresh}
      contentClassName="flex flex-col gap-3"
    >
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد مستندات حديثة.</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto">
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => onOpenDocument?.(doc)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-right transition hover:border-primary/50 hover:bg-background"
              >
                <div className="flex flex-col text-xs">
                  <span className="text-sm font-semibold text-foreground">{doc.name}</span>
                  <span className="text-muted-foreground">آخر تحديث {doc.updatedAt}</span>
                  {doc.owner && <span className="text-muted-foreground/80">بواسطة {doc.owner}</span>}
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  <span className={clsx('font-medium', statusClasses[doc.status] ?? '')}>{doc.status}</span>
                  {doc.size && <span>{doc.size}</span>}
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </WidgetContainer>
  );
};

export default DocumentsWidget;
