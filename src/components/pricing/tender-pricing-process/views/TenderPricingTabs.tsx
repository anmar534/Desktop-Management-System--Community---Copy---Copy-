import { useCallback } from 'react';
import type { ComponentProps } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calculator, FileText, PieChart } from 'lucide-react';
import { SummaryView, PricingView, TechnicalView } from '../components';
import { isPricingViewName, type PricingViewName } from '../types';

interface TenderPricingTabsProps {
  currentView: PricingViewName;
  onViewChange: (view: PricingViewName) => void;
  completionPercentage: number;
  currentItemCompleted: boolean;
  summaryProps: ComponentProps<typeof SummaryView>;
  pricingProps: ComponentProps<typeof PricingView>;
  technicalProps: ComponentProps<typeof TechnicalView>;
}

export const TenderPricingTabs: React.FC<TenderPricingTabsProps> = ({
  currentView,
  onViewChange,
  completionPercentage,
  currentItemCompleted,
  summaryProps,
  pricingProps,
  technicalProps
}) => {
  const handleValueChange = useCallback((value: string) => {
    if (isPricingViewName(value)) {
      onViewChange(value);
    }
  }, [onViewChange]);

  const roundedCompletion = Math.round(Number.isFinite(completionPercentage) ? completionPercentage : 0);

  return (
    <Tabs value={currentView} onValueChange={handleValueChange} className="mb-6" dir="rtl">
      <TabsList className="grid grid-cols-3 w-full max-w-2xl" dir="rtl">
        <TabsTrigger value="summary" className="flex items-center gap-2 flex-row-reverse">
          <Badge variant="secondary" className="mr-1">
            {roundedCompletion}%
          </Badge>
          <span>الملخص</span>
          <PieChart className="w-4 h-4" />
        </TabsTrigger>
        <TabsTrigger value="pricing" className="flex items-center gap-2 flex-row-reverse">
          {currentItemCompleted && (
            <Badge variant="outline" className="mr-1 text-success border-success/40">
              محفوظ
              <CheckCircle className="w-3 h-3 mr-1" />
            </Badge>
          )}
          <span>التسعير</span>
          <Calculator className="w-4 h-4" />
        </TabsTrigger>
        <TabsTrigger value="technical" className="flex items-center gap-2 flex-row-reverse">
          <span>العرض الفني</span>
          <FileText className="w-4 h-4" />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary">
        <SummaryView {...summaryProps} />
      </TabsContent>

      <TabsContent value="pricing">
        <PricingView {...pricingProps} />
      </TabsContent>

      <TabsContent value="technical">
        <TechnicalView {...technicalProps} />
      </TabsContent>
    </Tabs>
  );
};
