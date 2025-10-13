'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Trophy,
  XCircle,
  X,
  DollarSign,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSystemData } from '@/application/hooks/useSystemData';
import { toast } from 'sonner';
import type { Tender } from '@/data/centralData';
import { APP_EVENTS, emit } from '../events/bus';
import { TenderNotificationService } from '../utils/tenderNotifications';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

type AllowedStatus = 'cancelled' | 'won' | 'lost' | 'submitted';
type DevelopmentStatsEvent = 'submitted_tender' | 'won_tender' | 'lost_tender';

interface StatusOption {
  value: AllowedStatus;
  label: string;
  icon: LucideIcon;
  color: string;
}

const updateDevelopmentStats = async (eventType: DevelopmentStatsEvent, tender: Tender) => {
  try {
    const { developmentStatsService } = await import('@/application/services/developmentStatsService');

    switch (eventType) {
      case 'submitted_tender':
        developmentStatsService.updateStatsForTenderSubmission(tender);
        break;
      case 'won_tender':
        developmentStatsService.updateStatsForTenderWon(tender);
        break;
      case 'lost_tender':
        developmentStatsService.updateStatsForTenderLost(tender);
        break;
    }

    console.log('✅ تم تحديث إحصائيات التطوير:', eventType);
  } catch (error) {
    console.error('❌ خطأ في تحديث إحصائيات التطوير:', error);
  }
};

interface TenderStatusManagerProps {
  tender: Tender;
  trigger?: ReactNode;
}

export function TenderStatusManager({ tender, trigger }: TenderStatusManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AllowedStatus | ''>('');
  const [winningBidValue, setWinningBidValue] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { updateTender } = useSystemData();
  const { formatCurrencyValue } = useCurrencyFormatter();
  const tenderBaseValue = tender.totalValue ?? tender.value ?? 0;

  const getAvailableStatuses = (): StatusOption[] => {
    const baseOptions: StatusOption[] = [
      { value: 'cancelled', label: 'ملغاة', icon: X, color: 'text-muted-foreground' },
    ];

    if (tender.status === 'submitted') {
      return [
        ...baseOptions,
        { value: 'won', label: 'فائزة', icon: Trophy, color: 'text-success' },
        { value: 'lost', label: 'خاسرة', icon: XCircle, color: 'text-destructive' },
      ];
    }

    if (tender.status === 'ready_to_submit') {
      return [
        ...baseOptions,
        { value: 'submitted', label: 'تم التقديم', icon: FileText, color: 'text-info' },
      ];
    }

    return baseOptions;
  };

  const availableStatuses = getAvailableStatuses();

  const resetForm = () => {
    setSelectedStatus('');
    setWinningBidValue('');
    setResultNotes('');
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error('يرجى اختيار الحالة الجديدة');
      return;
    }

    setIsLoading(true);

    try {
      const currentDate = new Date().toISOString();
      const trimmedNotes = resultNotes.trim();
      const newStatus = selectedStatus;

      const updatePayload: Partial<Tender> = {
        status: newStatus,
        lastUpdate: currentDate,
      };

      if (trimmedNotes.length > 0) {
        updatePayload.resultNotes = trimmedNotes;
      }

      switch (newStatus) {
        case 'won':
          updatePayload.lastAction = 'تم الفوز بالمنافسة';
          updatePayload.winDate = currentDate;
          updatePayload.resultDate = currentDate;
          updatePayload.winningBidValue = tenderBaseValue;
          break;
        case 'lost': {
          const parsedWinningBidValue = Number.parseFloat(winningBidValue);

          if (!Number.isFinite(parsedWinningBidValue) || parsedWinningBidValue <= 0) {
            toast.error('يرجى إدخال قيمة العرض الفائز في حالة الخسارة');
            setIsLoading(false);
            return;
          }

          updatePayload.lastAction = 'لم يتم الفوز بالمنافسة';
          updatePayload.lostDate = currentDate;
          updatePayload.resultDate = currentDate;
          updatePayload.winningBidValue = parsedWinningBidValue;
          updatePayload.ourBidValue = tenderBaseValue;
          break;
        }
        case 'submitted':
          updatePayload.lastAction = 'تم تقديم المنافسة';
          updatePayload.submissionDate = currentDate;
          break;
        case 'cancelled':
          updatePayload.lastAction = 'تم إلغاء المنافسة';
          updatePayload.cancelledDate = currentDate;
          break;
      }

      const updatedTender = await updateTender(tender.id, updatePayload);

      if (newStatus === 'won') {
        await updateDevelopmentStats('won_tender', updatedTender);
      } else if (newStatus === 'lost') {
        await updateDevelopmentStats('lost_tender', updatedTender);
      } else if (newStatus === 'submitted') {
        await updateDevelopmentStats('submitted_tender', updatedTender);
      }

      TenderNotificationService.notifyStatusChange(updatedTender, newStatus);

      const messages: Record<AllowedStatus, { title: string; description: string }> = {
        won: {
          title: '🎉 تم الفوز بالمنافسة!',
          description: 'تم تحديث حالة المنافسة إلى "فائزة"',
        },
        lost: {
          title: 'تم تحديث النتيجة',
          description: 'تم تحديث حالة المنافسة إلى "خاسرة"',
        },
        submitted: {
          title: 'تم تقديم المنافسة',
          description: 'تم تحديث حالة المنافسة إلى "بانتظار النتائج"',
        },
        cancelled: {
          title: 'تم إلغاء المنافسة',
          description: 'تم تحديث حالة المنافسة إلى "ملغاة"',
        },
      };

      toast.success(messages[newStatus].title, {
        description: messages[newStatus].description,
      });

      setIsOpen(false);
      resetForm();

      emit(APP_EVENTS.TENDER_UPDATED);
    } catch (error) {
      console.error('Error updating tender status:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStatusIs = (status: AllowedStatus) => selectedStatus === status;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            تحديث الحالة
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تحديث حالة المنافسة
          </DialogTitle>
          <DialogDescription>
            المنافسة: {tender.name} - الحالة الحالية{' '}
            <Badge variant="outline">{tender.status}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">الحالة الجديدة *</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as AllowedStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة الجديدة" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((statusOption) => (
                  <SelectItem key={statusOption.value} value={statusOption.value}>
                    <div className="flex items-center gap-2">
                      <statusOption.icon className={`h-4 w-4 ${statusOption.color}`} />
                      {statusOption.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStatusIs('lost') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="winningBid" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  قيمة العرض الفائز <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="winningBid"
                  type="number"
                  placeholder="0.00"
                  value={winningBidValue}
                  onChange={(event) => setWinningBidValue(event.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">مطلوب لتحسين التسعيرات المستقبلية</p>
              </div>

              <div className="bg-info/10 p-3 rounded-lg border border-info/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-info">
                    <p>ملاحظة: قيمة عرضنا كانت {formatCurrencyValue(tenderBaseValue)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedStatusIs('won') && (
            <div className="bg-success/10 p-3 rounded-lg border border-success/20">
              <div className="flex items-start gap-2">
                <Trophy className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <div className="text-sm text-success">
                  <p>
                    <strong>تهانينا!</strong> عرضنا بقيمة {formatCurrencyValue(tenderBaseValue)} هو العرض الفائز.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات النتيجة</Label>
            <Textarea
              id="notes"
              placeholder="ملاحظات حول نتيجة المنافسة أو سبب الإلغاء..."
              value={resultNotes}
              onChange={(event) => setResultNotes(event.target.value)}
              rows={3}
            />
          </div>

          {selectedStatusIs('cancelled') && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">تحذير</span>
              </div>
              <p className="text-sm text-warning mt-1">
                سيتم إلغاء المنافسة نهائياً ولن يتم احتسابها في الإحصائيات.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleStatusUpdate}
            disabled={!selectedStatus || isLoading}
            className={
              selectedStatusIs('won')
                ? 'bg-success text-background hover:bg-success/90'
                : selectedStatusIs('lost')
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : selectedStatusIs('submitted')
                ? 'bg-info text-background hover:bg-info/90'
                : selectedStatusIs('cancelled')
                ? 'bg-muted text-foreground hover:bg-muted/90'
                : ''
            }
          >
            {isLoading ? 'جاري التحديث...' : 'تأكيد التحديث'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
