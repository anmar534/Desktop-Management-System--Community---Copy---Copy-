import type React from 'react';
import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * CostPercentagesPanel
 * لوحة قابلة لإعادة الاستخدام لإدارة نسب (إدارية / تشغيلية / ربح) مع واجهة inputs صغيرة.
 * - توفر onChange لكل تعديل
 * - تدعم زر "تطبيق على الجميع" عبر onApplyAll
 * - تدعم RTL وتهيئة قيم أولية نصية أو رقمية
 */

export interface CostPercentagesValue {
  administrative: number;
  operational: number;
  profit: number;
}

interface CostPercentagesPanelProps {
  value: CostPercentagesValue;
  onChange: (next: CostPercentagesValue) => void;
  onApplyAll?: () => void;
  labels?: { administrative?: string; operational?: string; profit?: string; applyAllHint?: string };
  className?: string;
  disabled?: boolean;
}

export const CostPercentagesPanel: React.FC<CostPercentagesPanelProps> = ({
  value,
  onChange,
  onApplyAll,
  labels,
  className,
  disabled
}) => {

  const [inputs, setInputs] = useState({
    administrative: String(value.administrative),
    operational: String(value.operational),
    profit: String(value.profit)
  });

  useEffect(() => {
    setInputs({
      administrative: String(value.administrative),
      operational: String(value.operational),
      profit: String(value.profit)
    });
  }, [value.administrative, value.operational, value.profit]);

  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const commit = (field: keyof CostPercentagesValue) => {
    const raw = inputs[field].replace(/,/g, '').trim();
    const num = Number(raw);
    const clamped = isNaN(num) ? value[field] : clamp(num);
    if (clamped !== value[field]) {
      onChange({ ...value, [field]: clamped });
    } else {
      // إعادة مزامنة النص إذا كان المستخدم كتب قيمة غير رقمية
      setInputs(prev => ({ ...prev, [field]: String(clamped) }));
    }
  };

  const commonInput = (field: keyof CostPercentagesValue, aria: string) => (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={inputs[field]}
      onChange={e => setInputs(prev => ({ ...prev, [field]: e.target.value }))}
      onBlur={() => commit(field)}
      className="w-full h-8 px-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
      aria-label={aria}
    />
  );

  return (
    <div className={"p-2 border rounded-md bg-blue-50 space-y-2 " + (className ?? '')} dir="rtl">
      <div className="grid grid-cols-3 gap-2">
        <div className="min-w-0">
          <span className="block text-[11px] text-gray-600">{labels?.administrative ?? 'الإدارية (%)'}</span>
          {commonInput('administrative', 'النسبة الإدارية')}
        </div>
        <div className="min-w-0">
          <span className="block text-[11px] text-gray-600">{labels?.operational ?? 'التشغيلية (%)'}</span>
          {commonInput('operational', 'النسبة التشغيلية')}
        </div>
        <div className="min-w-0">
          <span className="block text-[11px] text-gray-600">{labels?.profit ?? 'الربح (%)'}</span>
          {commonInput('profit', 'نسبة الربح')}
        </div>
      </div>
      {onApplyAll && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-600 whitespace-nowrap">{labels?.applyAllHint ?? 'تُطبق على البنود الجديدة'}</span>
          <button
            onClick={onApplyAll}
            disabled={disabled}
            title="تطبيق على البنود الموجودة"
            aria-label="تطبيق على البنود الموجودة"
            className="h-8 w-8 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
