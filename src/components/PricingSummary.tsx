import type React from 'react'
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter'

interface PricingSummaryMetrics {
  totalValue: number
  vatAmount: number
  totalWithVat: number
  profit: number
  adminOperational: number
  profitPercentage: number
  adminOperationalPercentage: number
  vatRate: number
}

interface PricingSummaryProps {
  totals?: PricingSummaryMetrics | null
  dir?: 'rtl' | 'ltr'
}

/**
 * يعرض ملخص الأسعار اعتماداً بالكامل على totals القادمة من Snapshot.
 * لا يقوم بأي حسابات إضافية – العرض فقط.
 */
export const PricingSummary: React.FC<PricingSummaryProps> = ({ totals, dir = 'rtl' }) => {
  console.log('🎯 [PricingSummary] Rendering with totals:', totals)
  
  if (!totals) {
    console.log('⚠️ [PricingSummary] No totals provided - not rendering')
    return null
  }
  
  const { formatCurrencyValue } = useCurrencyFormatter()

  const {
    totalValue,
    vatAmount,
    totalWithVat,
    profit,
    adminOperational,
    profitPercentage,
    adminOperationalPercentage,
    vatRate
  } = totals
  
  console.log('💰 [PricingSummary] Extracted values:', {
    totalValue,
    vatAmount, 
    totalWithVat,
    profit,
    adminOperational,
    profitPercentage,
    adminOperationalPercentage,
    vatRate
  })
  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3" dir={dir}>
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 flex flex-col items-center text-center">
        <div className="text-blue-600 text-[11px] font-medium tracking-wide">إجمالي المشروع</div>
        <div className="text-lg font-bold text-blue-800 mt-1 leading-tight">{formatCurrencyValue(totalValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        <div className="text-blue-600 text-[11px] mt-0.5">ر.س (قبل الضريبة)</div>
      </div>
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200 flex flex-col items-center text-center">
        <div className="text-orange-600 text-[11px] font-medium tracking-wide">ضريبة القيمة المضافة ({(vatRate*100).toFixed(0)}%)</div>
        <div className="text-lg font-bold text-orange-800 mt-1 leading-tight">{formatCurrencyValue(vatAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        <div className="text-orange-600 text-[11px] mt-0.5">ر.س</div>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200 flex flex-col items-center text-center">
        <div className="text-green-600 text-[11px] font-medium tracking-wide">الإجمالي شامل الضريبة</div>
        <div className="text-lg font-bold text-green-800 mt-1 leading-tight">{formatCurrencyValue(totalWithVat, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        <div className="text-green-600 text-[11px] mt-0.5">ر.س</div>
      </div>
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200 flex flex-col items-center text-center">
        <div className="text-purple-600 text-[11px] font-medium tracking-wide">إجمالي الربح ({profitPercentage?.toFixed(2)}%)</div>
        <div className="text-lg font-bold text-purple-800 mt-1 leading-tight">{formatCurrencyValue(profit, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        <div className="text-purple-600 text-[11px] mt-0.5">ر.س</div>
      </div>
      <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-3 rounded-lg border border-pink-200 flex flex-col items-center text-center">
        <div className="text-pink-600 text-[11px] font-medium tracking-wide">التكاليف الإدارية + التشغيلية ({adminOperationalPercentage?.toFixed(2)}%)</div>
        <div className="text-lg font-bold text-pink-800 mt-1 leading-tight">{formatCurrencyValue(adminOperational, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        <div className="text-pink-600 text-[11px] mt-0.5">ر.س</div>
      </div>
    </div>
  )
}
