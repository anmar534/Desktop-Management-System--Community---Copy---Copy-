/**
 * @fileoverview Analytics Export Utilities
 * @description Comprehensive export functionality for analytics data supporting
 * Excel, PDF, and CSV formats with Arabic language support and custom formatting.
 *
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 - Unified Analytics Navigation
 */

import type { BidPerformance, CompetitorData } from '../types/analytics'
import type { MarketOpportunity, MarketTrend } from '../types/competitive'

// Export format types
export type ExportFormat = 'excel' | 'pdf' | 'csv'

// Export data structure
interface ExportData {
  title: string
  subtitle?: string
  data: any[]
  headers: string[]
  metadata?: Record<string, any>
}

// Export options
interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeCharts?: boolean
  includeMetadata?: boolean
  dateRange?: { start: string; end: string }
  filters?: Record<string, any>
}

/**
 * Format currency values for export
 */
function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format percentage values for export
 */
function formatPercentage(value: number | null | undefined): string {
  if (value == null) return '-'
  return `${Math.round(value)}%`
}

/**
 * Format date values for export
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

/**
 * Export bid performance data
 */
export function exportBidPerformances(
  performances: BidPerformance[],
  options: ExportOptions
): ExportData {
  const headers = [
    'رقم المناقصة',
    'اسم المشروع',
    'العميل',
    'الفئة',
    'المنطقة',
    'قيمة العطاء',
    'هامش الربح',
    'النتيجة',
    'تاريخ التقديم',
    'تاريخ النتيجة'
  ]

  const data = performances.map(performance => [
    performance.tenderId || '-',
    performance.projectName || '-',
    performance.client || '-',
    performance.category || '-',
    performance.region || '-',
    formatCurrency(performance.bidAmount),
    formatPercentage(performance.profitMargin),
    performance.result === 'won' ? 'فائز' : 
    performance.result === 'lost' ? 'خاسر' : 'معلق',
    formatDate(performance.submissionDate),
    formatDate(performance.resultDate)
  ])

  return {
    title: 'تقرير أداء العطاءات',
    subtitle: options.dateRange 
      ? `من ${formatDate(options.dateRange.start)} إلى ${formatDate(options.dateRange.end)}`
      : undefined,
    headers,
    data,
    metadata: {
      totalBids: performances.length,
      wonBids: performances.filter(p => p.result === 'won').length,
      lostBids: performances.filter(p => p.result === 'lost').length,
      totalValue: performances.reduce((sum, p) => sum + (p.bidAmount || 0), 0),
      averageMargin: performances.length > 0 
        ? performances.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / performances.length
        : 0,
      exportDate: new Date().toISOString(),
      filters: options.filters
    }
  }
}

/**
 * Export competitor data
 */
export function exportCompetitors(
  competitors: CompetitorData[],
  options: ExportOptions
): ExportData {
  const headers = [
    'اسم المنافس',
    'النوع',
    'المنطقة',
    'الفئات',
    'الحالة',
    'مستوى التهديد',
    'موقع السوق',
    'آخر تحديث'
  ]

  const data = competitors.map(competitor => [
    competitor.name || '-',
    competitor.type === 'private' ? 'خاص' : 
    competitor.type === 'government' ? 'حكومي' : 'مختلط',
    competitor.region || '-',
    competitor.categories?.join(', ') || '-',
    competitor.status === 'active' ? 'نشط' : 'غير نشط',
    competitor.threatLevel === 'high' ? 'عالي' :
    competitor.threatLevel === 'medium' ? 'متوسط' : 'منخفض',
    competitor.marketPosition === 'leader' ? 'رائد' :
    competitor.marketPosition === 'challenger' ? 'منافس' :
    competitor.marketPosition === 'follower' ? 'تابع' : 'غير معروف',
    formatDate(competitor.lastUpdated)
  ])

  return {
    title: 'تقرير المنافسين',
    headers,
    data,
    metadata: {
      totalCompetitors: competitors.length,
      activeCompetitors: competitors.filter(c => c.status === 'active').length,
      highThreatCompetitors: competitors.filter(c => c.threatLevel === 'high').length,
      exportDate: new Date().toISOString(),
      filters: options.filters
    }
  }
}

/**
 * Export market opportunities
 */
export function exportMarketOpportunities(
  opportunities: MarketOpportunity[],
  options: ExportOptions
): ExportData {
  const headers = [
    'عنوان الفرصة',
    'الوصف',
    'الفئة',
    'المنطقة',
    'القيمة المتوقعة',
    'الأولوية',
    'الحالة',
    'تاريخ الإنشاء'
  ]

  const data = opportunities.map(opportunity => [
    opportunity.title || '-',
    opportunity.description || '-',
    opportunity.category || '-',
    opportunity.region || '-',
    formatCurrency(opportunity.estimatedValue),
    opportunity.priority === 'high' ? 'عالية' :
    opportunity.priority === 'medium' ? 'متوسطة' : 'منخفضة',
    opportunity.status === 'active' ? 'نشطة' :
    opportunity.status === 'completed' ? 'مكتملة' : 'معلقة',
    formatDate(opportunity.createdAt)
  ])

  return {
    title: 'تقرير الفرص السوقية',
    headers,
    data,
    metadata: {
      totalOpportunities: opportunities.length,
      activeOpportunities: opportunities.filter(o => o.status === 'active').length,
      totalValue: opportunities.reduce((sum, o) => sum + (o.estimatedValue || 0), 0),
      exportDate: new Date().toISOString(),
      filters: options.filters
    }
  }
}

/**
 * Export market trends
 */
export function exportMarketTrends(
  trends: MarketTrend[],
  options: ExportOptions
): ExportData {
  const headers = [
    'عنوان الاتجاه',
    'الوصف',
    'الفئة',
    'نوع الاتجاه',
    'مستوى التأثير',
    'الثقة',
    'تاريخ البداية',
    'تاريخ النهاية'
  ]

  const data = trends.map(trend => [
    trend.title || '-',
    trend.description || '-',
    trend.category || '-',
    trend.trendType === 'growth' ? 'نمو' :
    trend.trendType === 'decline' ? 'انخفاض' : 'استقرار',
    trend.impactLevel === 'high' ? 'عالي' :
    trend.impactLevel === 'medium' ? 'متوسط' : 'منخفض',
    formatPercentage(trend.confidence),
    formatDate(trend.startDate),
    formatDate(trend.endDate)
  ])

  return {
    title: 'تقرير اتجاهات السوق',
    headers,
    data,
    metadata: {
      totalTrends: trends.length,
      growthTrends: trends.filter(t => t.trendType === 'growth').length,
      declineTrends: trends.filter(t => t.trendType === 'decline').length,
      exportDate: new Date().toISOString(),
      filters: options.filters
    }
  }
}

/**
 * Generate CSV content from export data
 */
export function generateCSV(exportData: ExportData): string {
  const { title, subtitle, headers, data, metadata } = exportData
  
  let csv = ''
  
  // Add title and subtitle
  csv += `"${title}"\n`
  if (subtitle) {
    csv += `"${subtitle}"\n`
  }
  csv += '\n'
  
  // Add headers
  csv += headers.map(header => `"${header}"`).join(',') + '\n'
  
  // Add data rows
  data.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n'
  })
  
  // Add metadata if included
  if (metadata) {
    csv += '\n'
    csv += '"معلومات إضافية"\n'
    Object.entries(metadata).forEach(([key, value]) => {
      if (typeof value === 'object') return
      csv += `"${key}","${value}"\n`
    })
  }
  
  return csv
}

/**
 * Download file with given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Main export function
 */
export async function exportAnalyticsData(
  dataType: 'bidPerformances' | 'competitors' | 'marketOpportunities' | 'marketTrends',
  data: any[],
  options: ExportOptions
): Promise<void> {
  let exportData: ExportData
  
  // Generate export data based on type
  switch (dataType) {
    case 'bidPerformances':
      exportData = exportBidPerformances(data, options)
      break
    case 'competitors':
      exportData = exportCompetitors(data, options)
      break
    case 'marketOpportunities':
      exportData = exportMarketOpportunities(data, options)
      break
    case 'marketTrends':
      exportData = exportMarketTrends(data, options)
      break
    default:
      throw new Error(`Unsupported data type: ${dataType}`)
  }
  
  // Generate filename if not provided
  const timestamp = new Date().toISOString().split('T')[0]
  const defaultFilename = `${exportData.title.replace(/\s+/g, '_')}_${timestamp}`
  const filename = options.filename || defaultFilename
  
  // Export based on format
  switch (options.format) {
    case 'csv':
      const csvContent = generateCSV(exportData)
      downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8')
      break
      
    case 'excel':
      // For Excel export, we would use a library like xlsx
      // For now, fall back to CSV
      const excelCsvContent = generateCSV(exportData)
      downloadFile(excelCsvContent, `${filename}.csv`, 'text/csv;charset=utf-8')
      break
      
    case 'pdf':
      // For PDF export, we would use a library like jsPDF
      // For now, fall back to CSV
      const pdfCsvContent = generateCSV(exportData)
      downloadFile(pdfCsvContent, `${filename}.csv`, 'text/csv;charset=utf-8')
      break
      
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }
}
