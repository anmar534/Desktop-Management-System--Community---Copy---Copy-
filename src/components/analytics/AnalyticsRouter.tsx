/**
 * @fileoverview Analytics Router Component
 * @description Unified navigation system for Phase 2 analytics components with routing,
 * breadcrumbs, data synchronization, and export functionality.
 *
 * @author Desktop Management System Team
 * @version 2.0.0
 * @since Phase 2 - Unified Analytics Navigation
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Brain,
  Shield,
  TrendingUp,
  Target,
  Users,
  ChevronRight,
  Home,
  Download,
  Printer,
  RefreshCw,
  Settings,
  ArrowLeft,
  FileText
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

// Import analytics components
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { PredictiveAnalytics } from './PredictiveAnalytics'
import { HistoricalComparison } from './HistoricalComparison'
import { AnalyticsOverview } from './AnalyticsOverview'

// Import competitive intelligence components
import { CompetitorTracker } from '../competitive/CompetitorTracker'
import { MarketMonitor } from '../competitive/MarketMonitor'
import { SWOTAnalysis } from '../competitive/SWOTAnalysis'
import { CompetitiveBenchmark } from '../competitive/CompetitiveBenchmark'

// Import context and utilities
import { AnalyticsProvider, useAnalytics } from './AnalyticsContext'
import { exportAnalyticsData, type ExportFormat } from '../../utils/analyticsExport'

// Analytics section definitions
export type AnalyticsSection = 
  | 'overview'
  | 'dashboard'
  | 'predictive'
  | 'historical'
  | 'competitors'
  | 'market'
  | 'swot'
  | 'benchmark'

interface AnalyticsSectionConfig {
  id: AnalyticsSection
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'analytics' | 'competitive' | 'intelligence'
  component: React.ComponentType<any>
  requiresData?: boolean
  exportable?: boolean
}

const ANALYTICS_SECTIONS: AnalyticsSectionConfig[] = [
  {
    id: 'overview',
    title: 'نظرة عامة',
    description: 'ملخص شامل لجميع التحليلات والمؤشرات',
    icon: BarChart3,
    category: 'analytics',
    component: AnalyticsOverview,
    exportable: true
  },
  {
    id: 'dashboard',
    title: 'لوحة التحليلات',
    description: 'تحليلات الأداء والمؤشرات الرئيسية',
    icon: BarChart3,
    category: 'analytics',
    component: AnalyticsDashboard,
    requiresData: true,
    exportable: true
  },
  {
    id: 'predictive',
    title: 'التحليلات التنبؤية',
    description: 'توقعات الفوز وتحسين الأسعار بالذكاء الاصطناعي',
    icon: Brain,
    category: 'intelligence',
    component: PredictiveAnalytics,
    requiresData: true,
    exportable: true
  },
  {
    id: 'historical',
    title: 'المقارنات التاريخية',
    description: 'تحليل الاتجاهات والمقارنات الزمنية',
    icon: TrendingUp,
    category: 'analytics',
    component: HistoricalComparison,
    requiresData: true,
    exportable: true
  },
  {
    id: 'competitors',
    title: 'تتبع المنافسين',
    description: 'مراقبة وتحليل أنشطة المنافسين',
    icon: Users,
    category: 'competitive',
    component: CompetitorTracker,
    exportable: true
  },
  {
    id: 'market',
    title: 'مراقبة السوق',
    description: 'تحليل الفرص والاتجاهات السوقية',
    icon: Target,
    category: 'competitive',
    component: MarketMonitor,
    exportable: true
  },
  {
    id: 'swot',
    title: 'تحليل SWOT',
    description: 'تحليل نقاط القوة والضعف والفرص والتهديدات',
    icon: Shield,
    category: 'intelligence',
    component: SWOTAnalysis,
    exportable: true
  },
  {
    id: 'benchmark',
    title: 'المقارنة التنافسية',
    description: 'مقارنة الأداء مع المنافسين الرئيسيين',
    icon: TrendingUp,
    category: 'competitive',
    component: CompetitiveBenchmark,
    requiresData: true,
    exportable: true
  }
]

interface AnalyticsRouterProps {
  initialSection?: AnalyticsSection
  onSectionChange?: (section: AnalyticsSection) => void
  onBack?: () => void
  className?: string
}

// Analytics Router with Context Integration
function AnalyticsRouterContent({
  initialSection = 'overview',
  onSectionChange,
  onBack,
  className = ''
}: AnalyticsRouterProps) {
  const [activeSection, setActiveSection] = useState<AnalyticsSection>(initialSection)
  const [isLoading, setIsLoading] = useState(false)

  // Use analytics context
  const { state, refreshData } = useAnalytics()

  // Get current section configuration
  const currentSectionConfig = useMemo(() =>
    ANALYTICS_SECTIONS.find(section => section.id === activeSection) || ANALYTICS_SECTIONS[0],
    [activeSection]
  )

  // Handle section navigation
  const handleSectionChange = useCallback((section: AnalyticsSection) => {
    setActiveSection(section)
    onSectionChange?.(section)
  }, [onSectionChange])

  // Handle export functionality
  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsLoading(true)
    try {
      // Determine data type based on active section
      let dataType: 'bidPerformances' | 'competitors' | 'marketOpportunities' | 'marketTrends'
      let data: any[]

      switch (activeSection) {
        case 'dashboard':
        case 'predictive':
        case 'historical':
          dataType = 'bidPerformances'
          data = state.bidPerformances
          break
        case 'competitors':
          dataType = 'competitors'
          data = state.competitors
          break
        case 'market':
          dataType = 'marketOpportunities'
          data = state.marketOpportunities
          break
        default:
          dataType = 'bidPerformances'
          data = state.bidPerformances
      }

      await exportAnalyticsData(dataType, data, {
        format,
        includeMetadata: true,
        filters: state.globalFilter
      })
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeSection, state])

  // Handle print functionality
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      await refreshData()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [refreshData])

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => [
    { label: 'لوحة التحكم', href: '#', onClick: onBack },
    { label: 'التحليلات والذكاء التنافسي', href: '#' },
    { label: currentSectionConfig.title }
  ], [currentSectionConfig, onBack])

  // Get current component
  const CurrentComponent = currentSectionConfig.component

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink 
                        href={crumb.href}
                        onClick={crumb.onClick}
                        className="hover:text-primary"
                      >
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  العودة
                </Button>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <currentSectionConfig.icon className="h-6 w-6 text-primary" />
                  {currentSectionConfig.title}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {currentSectionConfig.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              {currentSectionConfig.exportable && (
                <>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        تصدير
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport('csv')}>
                        <FileText className="h-4 w-4 mr-2" />
                        CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('excel')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <Tabs value={activeSection} onValueChange={(value) => handleSectionChange(value as AnalyticsSection)}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
              {ANALYTICS_SECTIONS.map((section) => {
                const Icon = section.icon
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex flex-col items-center gap-1 p-3 text-xs"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{section.title}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'overview' ? (
              <CurrentComponent onNavigate={handleSectionChange} />
            ) : (
              <CurrentComponent />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Main export component with provider
export function AnalyticsRouter(props: AnalyticsRouterProps) {
  return (
    <AnalyticsProvider>
      <AnalyticsRouterContent {...props} />
    </AnalyticsProvider>
  )
}
