// AttachmentItem Component
// Displays a single attachment with icon, name, size, and actions

import React from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { FileText, Grid3X3, Building2, CheckCircle, Eye, Download, Calendar } from 'lucide-react'
import type { TenderAttachment } from '../types'

interface AttachmentItemProps {
  attachment: TenderAttachment & { source?: string; uploadDate?: string }
  index: number
  onPreview: (attachment: any) => void
  onDownload: (attachment: any) => void
}

export function AttachmentItem({ attachment, index, onPreview, onDownload }: AttachmentItemProps) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'specifications':
      case 'report':
        return <FileText className="w-5 h-5 text-destructive" />
      case 'excel':
      case 'quantity':
        return <Grid3X3 className="w-5 h-5 text-success" />
      case 'dwg':
      case 'drawings':
        return <Building2 className="w-5 h-5 text-info" />
      case 'technical':
        return <CheckCircle className="w-5 h-5 text-accent" />
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">{getFileIcon(attachment.type)}</div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{attachment.name || `مرفق ${index + 1}`}</p>
                {attachment.source === 'technical' && (
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                    ملف فني
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span>
                  {typeof attachment.size === 'number'
                    ? formatFileSize(attachment.size)
                    : attachment.size}
                </span>
                {(attachment.uploadDate || attachment.uploadedAt) && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{attachment.uploadDate || attachment.uploadedAt}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPreview(attachment)}>
              <Eye className="w-4 h-4 mr-2" />
              معاينة
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDownload(attachment)}>
              <Download className="w-4 h-4 mr-2" />
              تحميل
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
