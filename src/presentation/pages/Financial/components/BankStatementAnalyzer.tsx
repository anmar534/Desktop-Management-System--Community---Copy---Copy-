import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { BankStatementProcessor } from './BankStatementProcessor'
import type { BankTransaction } from './BankStatementProcessor'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Download,
  Search,
  AlertTriangle,
  CheckCircle,
  Building2,
  Tag
} from 'lucide-react'
import { formatCurrency } from '../data/centralData'
import { motion } from 'framer-motion'

interface BankStatementAnalyzerProps {
  transactions: BankTransaction[]
  onClose: () => void
  onExport: () => void
}

export function BankStatementAnalyzer({ 
  transactions, 
  onClose, 
  onExport 
}: BankStatementAnalyzerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProject, setFilterProject] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterType, setFilterType] = useState('all')

  // تحليل البيانات
  const analysis = useMemo(() => {
    return BankStatementProcessor.analyzeBankStatement(transactions)
  }, [transactions])

  // ربط البيانات بالمشاريع
  const reconciledTransactions = useMemo(() => {
    return BankStatementProcessor.reconcileWithProjects(
      BankStatementProcessor.autoClassifyTransactions(transactions)
    )
  }, [transactions])

  // تصفية البيانات
  const filteredTransactions = useMemo(() => {
    let filtered = reconciledTransactions

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterProject !== 'all') {
      filtered = filtered.filter(t => t.project === filterProject)
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory)
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.transactionType === filterType)
    }

    return filtered
  }, [reconciledTransactions, searchTerm, filterProject, filterCategory, filterType])

  // استخراج القوائم للفلاتر
  const uniqueProjects = useMemo(() => {
    const projects = [...new Set(reconciledTransactions.map(t => t.project))]
    return projects.filter(p => p !== 'غير محدد')
  }, [reconciledTransactions])

  const uniqueCategories = useMemo(() => {
    return [...new Set(reconciledTransactions.map(t => t.category))]
  }, [reconciledTransactions])

  const getTransactionTypeColor = (type: 'income' | 'expense') => {
    return type === 'income'
      ? 'text-success bg-success/10 border-success/30'
      : 'text-destructive bg-destructive/10 border-destructive/30'
  }

  const getTransactionTypeIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? TrendingUp : TrendingDown
  }

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  return (
    <div className="space-y-6">
      
      {/* هيدر التحليل */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            تحليل كشف الحساب البنكي
          </h2>
          <p className="text-muted-foreground">
            {analysis.totalTransactions} معاملة من {analysis.dateRange.startDate} إلى {analysis.dateRange.endDate}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 ml-2" />
            تصدير التحليل
          </Button>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(analysis.totalIncome)}
                  </p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(analysis.totalExpenses)}
                  </p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">صافي التدفق</p>
                  <p className={`text-2xl font-bold ${
                    analysis.netFlow >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {formatCurrency(analysis.netFlow)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  analysis.netFlow >= 0 
                    ? 'bg-success/10' 
                    : 'bg-destructive/10'
                }`}>
                  <DollarSign className={`h-6 w-6 ${
                    analysis.netFlow >= 0 ? 'text-success' : 'text-destructive'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عدد المعاملات</p>
                  <p className="text-2xl font-bold text-info">
                    {analysis.totalTransactions}
                  </p>
                </div>
                <div className="p-3 bg-info/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="arabic-tabs-list">
          <TabsTrigger value="overview" className="arabic-tabs-trigger">
            <PieChart className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="projects" className="arabic-tabs-trigger">
            <Building2 className="h-4 w-4" />
            المشاريع
          </TabsTrigger>
          <TabsTrigger value="categories" className="arabic-tabs-trigger">
            <Tag className="h-4 w-4" />
            التصنيفات
          </TabsTrigger>
          <TabsTrigger value="transactions" className="arabic-tabs-trigger">
            <BarChart3 className="h-4 w-4" />
            المعاملات
          </TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* التدفق الشهري */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-info" />
                  التدفق الشهري
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.values(analysis.monthlyBreakdown).map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{month.month}</span>
                      <span className={`font-bold ${
                        month.netFlow >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {formatCurrency(month.netFlow)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>إيرادات:</span>
                        <span className="text-success">{formatCurrency(month.totalIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>مصروفات:</span>
                        <span className="text-destructive">{formatCurrency(month.totalExpenses)}</span>
                      </div>
                    </div>
                    <Progress 
                      value={calculatePercentage(
                        month.totalIncome - month.totalExpenses,
                        Math.max(month.totalIncome, month.totalExpenses)
                      )} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* أكبر المشاريع */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-success" />
                  أكبر المشاريع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.values(analysis.projectBreakdown)
                  .sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow))
                  .slice(0, 5)
                  .map((project) => (
                    <div key={project.projectName} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{project.projectName}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.transactionCount} معاملة
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${
                          project.netFlow >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {formatCurrency(project.netFlow)}
                        </p>
                        <div className="flex gap-1 text-xs">
                          <span className="text-success">
                            +{formatCurrency(project.totalIncome)}
                          </span>
                          <span className="text-destructive">
                            -{formatCurrency(project.totalExpenses)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* المشاريع */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.values(analysis.projectBreakdown).map((project, index) => (
              <motion.div
                key={project.projectName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{project.projectName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.transactionCount} معاملة</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-success">الإيرادات:</span>
                        <span className="font-medium">{formatCurrency(project.totalIncome)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-destructive">المصروفات:</span>
                        <span className="font-medium">{formatCurrency(project.totalExpenses)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>صافي التدفق:</span>
                        <span className={project.netFlow >= 0 ? 'text-success' : 'text-destructive'}>
                          {formatCurrency(project.netFlow)}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={calculatePercentage(
                        project.totalIncome,
                        project.totalIncome + project.totalExpenses
                      )} 
                      className="h-2"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* التصنيفات */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.values(analysis.categoryBreakdown).map((category, index) => (
              <motion.div
                key={category.categoryName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{category.categoryName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(category.totalAmount)} • {category.transactionCount} معاملة
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.values(category.subcategories).map((subcategory) => (
                      <div key={subcategory.subcategoryName} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{subcategory.subcategoryName}</span>
                          <span className="font-medium">{formatCurrency(subcategory.totalAmount)}</span>
                        </div>
                        <Progress 
                          value={calculatePercentage(subcategory.totalAmount, category.totalAmount)} 
                          className="h-1"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* المعاملات */}
        <TabsContent value="transactions" className="space-y-6">
          
          {/* أدوات التصفية */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="البحث في المعاملات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="w-full p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="فلترة حسب المشروع"
                >
                  <option value="all">جميع المشاريع</option>
                  {uniqueProjects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="فلترة حسب التصنيف"
                >
                  <option value="all">جميع التصنيفات</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="فلترة حسب النوع"
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="income">إيرادات</option>
                  <option value="expense">مصروفات</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* جدول المعاملات */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>المعاملات المصرفية</CardTitle>
                <Badge variant="outline">
                  {filteredTransactions.length} من {reconciledTransactions.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2 font-medium">التاريخ</th>
                      <th className="text-right p-2 font-medium">الوصف</th>
                      <th className="text-right p-2 font-medium">النوع</th>
                      <th className="text-right p-2 font-medium">المبلغ</th>
                      <th className="text-right p-2 font-medium">التصنيف</th>
                      <th className="text-right p-2 font-medium">المشروع</th>
                      <th className="text-right p-2 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 50).map((transaction) => {
                      const Icon = getTransactionTypeIcon(transaction.transactionType)
                      const amount = transaction.transactionType === 'income' ? transaction.credit : transaction.debit
                      
                      return (
                        <tr key={transaction.id} className="border-b border-border hover:bg-muted/40">
                          <td className="p-2">{transaction.date}</td>
                          <td className="p-2 max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                                {transaction.transactionType === 'income' ? 'إيراد' : 'مصروف'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-2 font-medium">
                            <span className={transaction.transactionType === 'income' ? 'text-success' : 'text-destructive'}>
                              {formatCurrency(amount)}
                            </span>
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{transaction.category}</div>
                              <div className="text-xs text-muted-foreground">{transaction.subcategory}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            {transaction.project !== 'غير محدد' ? (
                              <Badge variant={transaction.isReconciled ? 'default' : 'outline'}>
                                {transaction.project}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">غير محدد</span>
                            )}
                          </td>
                          <td className="p-2">
                            {transaction.isReconciled ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredTransactions.length > 50 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    يتم عرض أول 50 معاملة من أصل {filteredTransactions.length}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
