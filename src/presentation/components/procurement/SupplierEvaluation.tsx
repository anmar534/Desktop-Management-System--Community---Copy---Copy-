/**
 * مكون تقييم أداء الموردين
 * Supplier Performance Evaluation Component
 */

import type React from 'react';
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Progress } from '../ui/progress'
import { 
  Star, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { 
  Supplier} from '../../services/supplierManagementService';
import { 
  SupplierEvaluation,
  supplierManagementService 
} from '../../services/supplierManagementService'

// ===========================
// 📊 Types & Interfaces
// ===========================

interface EvaluationStats {
  total: number
  excellent: number // 4.5+
  good: number // 3.5-4.4
  average: number // 2.5-3.4
  poor: number // <2.5
  averageRating: number
}

interface EvaluationFormData {
  supplierId: string
  evaluationDate: string
  evaluatedBy: string
  qualityScore: number
  deliveryScore: number
  serviceScore: number
  priceCompetitiveness: number
  communicationScore: number
  overallRating: number
  strengths: string
  weaknesses: string
  recommendations: string
  notes: string
}

// ===========================
// 🎨 Component
// ===========================

export const SupplierEvaluation: React.FC = () => {
  // ===========================
  // 📊 State Management
  // ===========================
  
  const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState<SupplierEvaluation | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const [formData, setFormData] = useState<EvaluationFormData>({
    supplierId: '',
    evaluationDate: new Date().toISOString().split('T')[0],
    evaluatedBy: 'مدير المشتريات',
    qualityScore: 0,
    deliveryScore: 0,
    serviceScore: 0,
    priceCompetitiveness: 0,
    communicationScore: 0,
    overallRating: 0,
    strengths: '',
    weaknesses: '',
    recommendations: '',
    notes: ''
  })

  // ===========================
  // 📊 Data Loading
  // ===========================

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [evaluationsData, suppliersData] = await Promise.all([
        supplierManagementService.getAllEvaluations(),
        supplierManagementService.getAllSuppliers()
      ])
      setEvaluations(evaluationsData)
      setSuppliers(suppliersData)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  // ===========================
  // 📊 Computed Values
  // ===========================

  const stats = useMemo((): EvaluationStats => {
    const total = evaluations.length
    const excellent = evaluations.filter(e => e.overallRating >= 4.5).length
    const good = evaluations.filter(e => e.overallRating >= 3.5 && e.overallRating < 4.5).length
    const average = evaluations.filter(e => e.overallRating >= 2.5 && e.overallRating < 3.5).length
    const poor = evaluations.filter(e => e.overallRating < 2.5).length
    
    const totalRating = evaluations.reduce((sum, e) => sum + e.overallRating, 0)
    const averageRating = total > 0 ? totalRating / total : 0

    return { total, excellent, good, average, poor, averageRating }
  }, [evaluations])

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => {
      const supplier = suppliers.find(s => s.id === evaluation.supplierId)
      const matchesSearch = 
        supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.evaluatedBy.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSupplier = supplierFilter === 'all' || evaluation.supplierId === supplierFilter

      return matchesSearch && matchesSupplier
    })
  }, [evaluations, suppliers, searchTerm, supplierFilter])

  // ===========================
  // 🎯 Event Handlers
  // ===========================

  const calculateOverallRating = (scores: Partial<EvaluationFormData>) => {
    const { qualityScore = 0, deliveryScore = 0, serviceScore = 0, priceCompetitiveness = 0, communicationScore = 0 } = scores
    return (qualityScore + deliveryScore + serviceScore + priceCompetitiveness + communicationScore) / 5
  }

  const handleScoreChange = (field: keyof EvaluationFormData, value: number) => {
    const updatedData = { ...formData, [field]: value }
    const overallRating = calculateOverallRating(updatedData)
    setFormData(prev => ({ ...prev, [field]: value, overallRating }))
  }

  const handleCreateEvaluation = async () => {
    try {
      const newEvaluation: SupplierEvaluation = {
        id: `eval_${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await supplierManagementService.createEvaluation(newEvaluation)
      setEvaluations(prev => [...prev, newEvaluation])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('تم إنشاء التقييم بنجاح')
    } catch (error) {
      console.error('خطأ في إنشاء التقييم:', error)
      toast.error('فشل في إنشاء التقييم')
    }
  }

  const handleEditEvaluation = async () => {
    if (!selectedEvaluation) return

    try {
      const updatedEvaluation = {
        ...selectedEvaluation,
        ...formData,
        updatedAt: new Date().toISOString()
      }

      await supplierManagementService.updateEvaluation(selectedEvaluation.id, updatedEvaluation)
      setEvaluations(prev => 
        prev.map(e => e.id === selectedEvaluation.id ? updatedEvaluation : e)
      )
      setIsEditDialogOpen(false)
      setSelectedEvaluation(null)
      resetForm()
      toast.success('تم تحديث التقييم بنجاح')
    } catch (error) {
      console.error('خطأ في تحديث التقييم:', error)
      toast.error('فشل في تحديث التقييم')
    }
  }

  const handleDeleteEvaluation = async (evaluationId: string) => {
    try {
      await supplierManagementService.deleteEvaluation(evaluationId)
      setEvaluations(prev => prev.filter(e => e.id !== evaluationId))
      toast.success('تم حذف التقييم بنجاح')
    } catch (error) {
      console.error('خطأ في حذف التقييم:', error)
      toast.error('فشل في حذف التقييم')
    }
  }

  const resetForm = () => {
    setFormData({
      supplierId: '',
      evaluationDate: new Date().toISOString().split('T')[0],
      evaluatedBy: 'مدير المشتريات',
      qualityScore: 0,
      deliveryScore: 0,
      serviceScore: 0,
      priceCompetitiveness: 0,
      communicationScore: 0,
      overallRating: 0,
      strengths: '',
      weaknesses: '',
      recommendations: '',
      notes: ''
    })
  }

  const openEditDialog = (evaluation: SupplierEvaluation) => {
    setSelectedEvaluation(evaluation)
    setFormData({
      supplierId: evaluation.supplierId,
      evaluationDate: evaluation.evaluationDate,
      evaluatedBy: evaluation.evaluatedBy,
      qualityScore: evaluation.qualityScore,
      deliveryScore: evaluation.deliveryScore,
      serviceScore: evaluation.serviceScore,
      priceCompetitiveness: evaluation.priceCompetitiveness,
      communicationScore: evaluation.communicationScore,
      overallRating: evaluation.overallRating,
      strengths: evaluation.strengths || '',
      weaknesses: evaluation.weaknesses || '',
      recommendations: evaluation.recommendations || '',
      notes: evaluation.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (evaluation: SupplierEvaluation) => {
    setSelectedEvaluation(evaluation)
    setIsViewDialogOpen(true)
  }

  // ===========================
  // 🎨 Helper Functions
  // ===========================

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) {
      return <Badge variant="default" className="bg-green-600 gap-1"><Award className="h-3 w-3" />ممتاز</Badge>
    } else if (rating >= 3.5) {
      return <Badge variant="default" className="bg-blue-600 gap-1"><CheckCircle className="h-3 w-3" />جيد</Badge>
    } else if (rating >= 2.5) {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />متوسط</Badge>
    } else {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />ضعيف</Badge>
    }
  }

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier?.name || 'غير محدد'
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground mr-1">({rating.toFixed(1)})</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل التقييمات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">تقييم أداء الموردين</h2>
          <p className="text-muted-foreground">تقييم ومتابعة أداء الموردين</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              تقييم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء تقييم جديد</DialogTitle>
              <DialogDescription>
                قم بتقييم أداء المورد في المعايير المختلفة
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">المورد</Label>
                  <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evaluationDate">تاريخ التقييم</Label>
                  <Input
                    id="evaluationDate"
                    type="date"
                    value={formData.evaluationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, evaluationDate: e.target.value }))}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="evaluatedBy">المقيم</Label>
                  <Input
                    id="evaluatedBy"
                    value={formData.evaluatedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, evaluatedBy: e.target.value }))}
                    placeholder="اسم المقيم"
                  />
                </div>
              </div>

              {/* Evaluation Scores */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">معايير التقييم</h4>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>جودة المنتجات/الخدمات</Label>
                      <span className="text-sm font-medium">{formData.qualityScore}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Button
                          key={score}
                          variant={formData.qualityScore >= score ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleScoreChange('qualityScore', score)}
                        >
                          <Star className={`h-4 w-4 ${formData.qualityScore >= score ? 'fill-current' : ''}`} />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>الالتزام بمواعيد التسليم</Label>
                      <span className="text-sm font-medium">{formData.deliveryScore}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Button
                          key={score}
                          variant={formData.deliveryScore >= score ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleScoreChange('deliveryScore', score)}
                        >
                          <Star className={`h-4 w-4 ${formData.deliveryScore >= score ? 'fill-current' : ''}`} />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>جودة خدمة العملاء</Label>
                      <span className="text-sm font-medium">{formData.serviceScore}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Button
                          key={score}
                          variant={formData.serviceScore >= score ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleScoreChange('serviceScore', score)}
                        >
                          <Star className={`h-4 w-4 ${formData.serviceScore >= score ? 'fill-current' : ''}`} />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>تنافسية الأسعار</Label>
                      <span className="text-sm font-medium">{formData.priceCompetitiveness}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Button
                          key={score}
                          variant={formData.priceCompetitiveness >= score ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleScoreChange('priceCompetitiveness', score)}
                        >
                          <Star className={`h-4 w-4 ${formData.priceCompetitiveness >= score ? 'fill-current' : ''}`} />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>التواصل والاستجابة</Label>
                      <span className="text-sm font-medium">{formData.communicationScore}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Button
                          key={score}
                          variant={formData.communicationScore >= score ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleScoreChange('communicationScore', score)}
                        >
                          <Star className={`h-4 w-4 ${formData.communicationScore >= score ? 'fill-current' : ''}`} />
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Overall Rating Display */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-lg font-semibold">التقييم الإجمالي</Label>
                      <span className="text-2xl font-bold">{formData.overallRating.toFixed(1)}/5</span>
                    </div>
                    <Progress value={(formData.overallRating / 5) * 100} className="h-3" />
                    <div className="mt-2">
                      {getRatingBadge(formData.overallRating)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">ملاحظات التقييم</h4>

                <div className="space-y-2">
                  <Label htmlFor="strengths">نقاط القوة</Label>
                  <Textarea
                    id="strengths"
                    value={formData.strengths}
                    onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                    placeholder="اذكر نقاط القوة في أداء المورد"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weaknesses">نقاط الضعف</Label>
                  <Textarea
                    id="weaknesses"
                    value={formData.weaknesses}
                    onChange={(e) => setFormData(prev => ({ ...prev, weaknesses: e.target.value }))}
                    placeholder="اذكر نقاط الضعف التي تحتاج تحسين"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommendations">التوصيات</Label>
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                    placeholder="توصيات للتحسين أو الاستمرار"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="أي ملاحظات أخرى"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateEvaluation}>
                حفظ التقييم
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التقييمات</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                جميع التقييمات
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ممتاز</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.excellent}</div>
              <p className="text-xs text-muted-foreground">
                4.5+ نجوم
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">جيد</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.good}</div>
              <p className="text-xs text-muted-foreground">
                3.5-4.4 نجوم
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ضعيف</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.poor}</div>
              <p className="text-xs text-muted-foreground">
                أقل من 2.5 نجوم
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط التقييم</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                من 5 نجوم
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في التقييمات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="فلترة حسب المورد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموردين</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            قائمة التقييمات ({filteredEvaluations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المورد</TableHead>
                  <TableHead>تاريخ التقييم</TableHead>
                  <TableHead>المقيم</TableHead>
                  <TableHead>الجودة</TableHead>
                  <TableHead>التسليم</TableHead>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>التقييم الإجمالي</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Star className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">لا توجد تقييمات</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">
                        {getSupplierName(evaluation.supplierId)}
                      </TableCell>
                      <TableCell>
                        {new Date(evaluation.evaluationDate).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>{evaluation.evaluatedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Progress value={(evaluation.qualityScore / 5) * 100} className="w-16 h-2" />
                          <span className="text-sm">{evaluation.qualityScore}/5</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Progress value={(evaluation.deliveryScore / 5) * 100} className="w-16 h-2" />
                          <span className="text-sm">{evaluation.deliveryScore}/5</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Progress value={(evaluation.serviceScore / 5) * 100} className="w-16 h-2" />
                          <span className="text-sm">{evaluation.serviceScore}/5</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderStarRating(evaluation.overallRating)}
                          {getRatingBadge(evaluation.overallRating)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(evaluation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(evaluation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvaluation(evaluation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


