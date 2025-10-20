/**
 * @fileoverview Pricing Template Manager Component
 * @description Comprehensive template management system for the bidding process.
 * Provides template creation, editing, categorization, search, and application functionality.
 *
 * @author Desktop Management System Team
 * @version 1.0.0
 * @since Phase 1 Implementation
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Copy,
  Edit3,
  Trash2,
  Star,
  Building,
  Home,
  Factory,
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
  Brain,
  Target,
  AlertCircle
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { analyticsService } from '@/services/analyticsService'
import type { BidPerformance } from '@/types/analytics'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { PricingTemplate, TemplateCategory } from '@/types/templates'

interface PricingTemplateManagerProps {
  onSelectTemplate: (template: PricingTemplate) => void
  onCreateTemplate: (template: Omit<PricingTemplate, 'id' | 'createdAt' | 'usageCount' | 'lastUsed'>) => void
  onUpdateTemplate: (template: PricingTemplate) => void
  onDeleteTemplate: (templateId: string) => void
  /** Optional tender context for AI-powered recommendations */
  tenderContext?: {
    category: string
    estimatedValue: number
    region: string
    competitorCount: number
    clientType: string
  }
  /** Enable AI-powered template recommendations */
  enableAIRecommendations?: boolean
}

// Mock data for demonstration
const mockTemplates: PricingTemplate[] = [
  {
    id: '1',
    name: 'مشروع سكني متوسط',
    description: 'قالب للمشاريع السكنية متوسطة الحجم (100-500 وحدة)',
    category: 'residential',
    isStarred: true,
    createdAt: '2024-01-15',
    lastUsed: '2024-03-10',
    usageCount: 15,
    averageAccuracy: 92,
    estimatedDuration: 8,
    defaultPercentages: { administrative: 8, operational: 12, profit: 18 },
    costBreakdown: { materials: 45, labor: 30, equipment: 15, subcontractors: 10 },
    tags: ['سكني', 'متوسط', 'مجمع']
  },
  {
    id: '2',
    name: 'مبنى تجاري',
    description: 'قالب للمباني التجارية والمكاتب',
    category: 'commercial',
    isStarred: false,
    createdAt: '2024-02-01',
    lastUsed: '2024-03-08',
    usageCount: 8,
    averageAccuracy: 88,
    estimatedDuration: 12,
    defaultPercentages: { administrative: 10, operational: 15, profit: 22 },
    costBreakdown: { materials: 40, labor: 25, equipment: 20, subcontractors: 15 },
    tags: ['تجاري', 'مكاتب', 'مول']
  },
  {
    id: '3',
    name: 'مشروع طرق',
    description: 'قالب لمشاريع الطرق والبنية التحتية',
    category: 'infrastructure',
    isStarred: true,
    createdAt: '2024-01-20',
    usageCount: 12,
    averageAccuracy: 95,
    estimatedDuration: 16,
    defaultPercentages: { administrative: 12, operational: 18, profit: 15 },
    costBreakdown: { materials: 50, labor: 20, equipment: 25, subcontractors: 5 },
    tags: ['طرق', 'بنية تحتية', 'أسفلت']
  }
]

const categoryIcons: Record<TemplateCategory, typeof Home> = {
  residential: Home,
  commercial: Building,
  infrastructure: Zap,
  industrial: Factory
}

const categoryLabels: Record<TemplateCategory, string> = {
  residential: 'سكني',
  commercial: 'تجاري',
  infrastructure: 'بنية تحتية',
  industrial: 'صناعي'
}

export function PricingTemplateManager({
  onSelectTemplate,
  onCreateTemplate: _onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  tenderContext,
  enableAIRecommendations = false
}: PricingTemplateManagerProps) {
  const [templates] = useState<PricingTemplate[]>(mockTemplates)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // AI Recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<{
    recommendedTemplates: string[]
    insights: string[]
    loading: boolean
  }>({
    recommendedTemplates: [],
    insights: [],
    loading: false
  })

  // Helper function to calculate value suitability
  const calculateValueSuitability = useCallback((template: PricingTemplate, estimatedValue: number) => {
    // This is a simplified calculation - in practice, you'd have historical data
    // about which templates work best for different value ranges
    const valueRanges = {
      residential: { min: 1000000, max: 50000000 },
      commercial: { min: 5000000, max: 100000000 },
      infrastructure: { min: 10000000, max: 500000000 },
      industrial: { min: 20000000, max: 200000000 }
    }

    const range = valueRanges[template.category]
    if (estimatedValue >= range.min && estimatedValue <= range.max) {
      return 10 // Perfect match
    } else if (estimatedValue < range.min) {
      return Math.max(0, 10 - (range.min - estimatedValue) / range.min * 10)
    } else {
      return Math.max(0, 10 - (estimatedValue - range.max) / range.max * 10)
    }
  }, [])

  // Helper function to generate recommendation reasons
  const generateRecommendationReasons = useCallback((template: PricingTemplate, context: typeof tenderContext) => {
    const reasons: string[] = []

    if (template.category === context?.category) {
      reasons.push(`مناسب لمشاريع ${categoryLabels[template.category]}`)
    }

    if (template.averageAccuracy > 90) {
      reasons.push(`دقة عالية ${template.averageAccuracy}%`)
    }

    if (template.usageCount > 10) {
      reasons.push(`مجرب ومستخدم ${template.usageCount} مرة`)
    }

    return reasons
  }, [])

  // Helper function to analyze template performance
  const analyzeTemplatePerformance = useCallback((
    _performances: BidPerformance[],
    templates: PricingTemplate[],
  ) => {
    return templates.map(template => {
      // Calculate performance score based on category match, accuracy, and usage
      let score = template.averageAccuracy * 0.4 // 40% weight on accuracy

      if (tenderContext) {
        // Category match bonus
        if (template.category === tenderContext.category) {
          score += 20
        }

        // Value range suitability
        const templateSuitability = calculateValueSuitability(template, tenderContext.estimatedValue)
        score += templateSuitability * 0.3 // 30% weight on value suitability

        // Usage frequency bonus
        score += Math.min(template.usageCount * 2, 20) // Max 20 points for usage
      }

      return {
        templateId: template.id,
        score: Math.round(score),
        reasons: generateRecommendationReasons(template, tenderContext)
      }
    })
  }, [tenderContext, calculateValueSuitability, generateRecommendationReasons])



  // Helper function to generate insights
  const generateTemplateInsights = useCallback((context: typeof tenderContext, templatePerformance: {templateId: string; score: number; reasons: string[]}[]) => {
    const insights: string[] = []

    if (!context) return insights

    const categoryTemplates = templatePerformance.filter(tp => {
      const template = templates.find(t => t.id === tp.templateId)
      return template?.category === context.category
    })

    if (categoryTemplates.length > 0) {
      const avgAccuracy = categoryTemplates.reduce((sum, tp) => {
        const template = templates.find(t => t.id === tp.templateId)
        return sum + (template?.averageAccuracy ?? 0)
      }, 0) / categoryTemplates.length

      insights.push(`متوسط دقة قوالب ${categoryLabels[context.category as keyof typeof categoryLabels]}: ${Math.round(avgAccuracy)}%`)
    }

    if (context.estimatedValue > 50000000) {
      insights.push('المشاريع الكبيرة تتطلب هوامش ربح أعلى لتغطية المخاطر')
    }

    if (context.competitorCount > 5) {
      insights.push('المنافسة الشديدة تتطلب تسعير أكثر دقة وهوامش أقل')
    }

    return insights
  }, [templates])

  // Load AI recommendations when tender context is available
  useEffect(() => {
    if (!enableAIRecommendations || !tenderContext) return

    const loadAIRecommendations = async () => {
      setAiRecommendations(prev => ({ ...prev, loading: true }))

      try {
        // Load historical performance data for similar projects
        const historicalPerformances = await analyticsService.getAllBidPerformances({
          filters: {
            categories: [tenderContext.category],
            regions: [tenderContext.region]
          }
        })

        // Analyze template performance for similar projects
        const templatePerformance = analyzeTemplatePerformance(historicalPerformances, templates)

        // Generate insights based on tender context
        const insights = generateTemplateInsights(tenderContext, templatePerformance)

        // Recommend top templates
        const recommendedTemplates = templatePerformance
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(tp => tp.templateId)

        setAiRecommendations({
          recommendedTemplates,
          insights,
          loading: false
        })
      } catch (error) {
        console.error('Error loading AI recommendations:', error)
        setAiRecommendations(prev => ({ ...prev, loading: false }))
      }
    }

    void loadAIRecommendations()
  }, [enableAIRecommendations, tenderContext, templates, analyzeTemplatePerformance, generateTemplateInsights])

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.includes(searchQuery))
      
  const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      const matchesStarred = !showStarredOnly || template.isStarred
      
      return matchesSearch && matchesCategory && matchesStarred
    })
  }, [templates, searchQuery, selectedCategory, showStarredOnly])

  const handleSelectTemplate = useCallback((template: PricingTemplate) => {
    onSelectTemplate(template)
  }, [onSelectTemplate])

  const handleToggleStar = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      onUpdateTemplate({ ...template, isStarred: !template.isStarred })
    }
  }, [templates, onUpdateTemplate])

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-success'
    if (accuracy >= 80) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">قوالب التسعير</h2>
          <p className="text-muted-foreground">استخدم القوالب الجاهزة لتسريع عملية التسعير</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              قالب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء قالب تسعير جديد</DialogTitle>
              <DialogDescription>
                أنشئ قالب تسعير جديد لاستخدامه في المشاريع المشابهة
              </DialogDescription>
            </DialogHeader>
            {/* Template creation form would go here */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">اسم القالب</Label>
                <Input id="template-name" placeholder="مثال: مشروع سكني كبير" />
              </div>
              <div>
                <Label htmlFor="template-description">الوصف</Label>
                <Textarea id="template-description" placeholder="وصف مختصر للقالب..." />
              </div>
              <div>
                <Label htmlFor="template-category">الفئة</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">سكني</SelectItem>
                    <SelectItem value="commercial">تجاري</SelectItem>
                    <SelectItem value="infrastructure">بنية تحتية</SelectItem>
                    <SelectItem value="industrial">صناعي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Recommendations Section */}
      {enableAIRecommendations && tenderContext && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Brain className="h-5 w-5" />
              توصيات الذكاء الاصطناعي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiRecommendations.loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Brain className="h-4 w-4 animate-pulse" />
                <span>جاري تحليل القوالب المناسبة...</span>
              </div>
            ) : (
              <>
                {/* Recommended Templates */}
                {aiRecommendations.recommendedTemplates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-card-foreground flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      القوالب المُوصى بها
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {aiRecommendations.recommendedTemplates.map(templateId => {
                        const template = templates.find(t => t.id === templateId)
                        if (!template) return null

                        return (
                          <Badge
                            key={templateId}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            {template.name}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                {aiRecommendations.insights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-card-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      رؤى ذكية
                    </h4>
                    <div className="space-y-1">
                      {aiRecommendations.insights.map((insight, index) => (
                        <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في القوالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select
          value={selectedCategory}
          onValueChange={value => setSelectedCategory(value as TemplateCategory | 'all')}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="جميع الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            <SelectItem value="residential">سكني</SelectItem>
            <SelectItem value="commercial">تجاري</SelectItem>
            <SelectItem value="infrastructure">بنية تحتية</SelectItem>
            <SelectItem value="industrial">صناعي</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant={showStarredOnly ? "default" : "outline"}
          onClick={() => setShowStarredOnly(!showStarredOnly)}
          className="gap-2"
        >
          <Star className={`h-4 w-4 ${showStarredOnly ? 'fill-current' : ''}`} />
          المفضلة
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTemplates.map((template, index) => {
            const CategoryIcon = categoryIcons[template.category]
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[template.category]}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStar(template.id)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Star className={`h-4 w-4 ${template.isStarred ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>
                    
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-sm font-medium ${getAccuracyColor(template.averageAccuracy)}`}>
                            {template.averageAccuracy}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">دقة</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium text-card-foreground">
                            {template.estimatedDuration}س
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">مدة</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <Copy className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium text-card-foreground">
                            {template.usageCount}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">استخدام</p>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">توزيع التكاليف</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>مواد:</span>
                          <span className="font-medium">{template.costBreakdown.materials}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>عمالة:</span>
                          <span className="font-medium">{template.costBreakdown.labor}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>معدات:</span>
                          <span className="font-medium">{template.costBreakdown.equipment}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>مقاولين:</span>
                          <span className="font-medium">{template.costBreakdown.subcontractors}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleSelectTemplate(template)}
                        className="flex-1 gap-2"
                        size="sm"
                      >
                        <DollarSign className="h-4 w-4" />
                        استخدام
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle edit
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTemplate(template.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لم يتم العثور على قوالب مطابقة</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إنشاء قالب جديد
          </Button>
        </div>
      )}
    </div>
  )
}
