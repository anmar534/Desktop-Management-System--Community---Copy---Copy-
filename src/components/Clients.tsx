'use client'

import { useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog'
import { PageLayout, EmptyState } from './PageLayout'
import { 
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  Plus,
  FileText,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { EntityActions } from './ui/ActionButtons'
import { motion } from 'framer-motion'
import { formatCurrency, type Client, type Project } from '../data/centralData'
import { useFinancialState } from '@/application/context'

interface ClientsProps {
  onSectionChange: (section: string) => void
}

interface ClientProjectsSummary {
  active: number
  completed: number
  total: number
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'primary'

interface BadgeDisplay {
  text: string
  variant: BadgeVariant
}

export function Clients({ onSectionChange }: ClientsProps) {
  const { clients: clientsState, projects: projectsState } = useFinancialState()
  const { clients, deleteClient } = clientsState
  const { projects } = projectsState
  const [searchTerm, setSearchTerm] = useState('')
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)

  // حساب عدد المشاريع لكل عميل من البيانات الحقيقية
  const getClientProjects = (clientName: string): ClientProjectsSummary => {
    const summary: ClientProjectsSummary = { active: 0, completed: 0, total: 0 }
    const normalizedName = clientName.trim().toLowerCase()

    if (!normalizedName) {
      return summary
    }

    const clientProjects = projects.filter((project: Project) =>
      project.client?.toLowerCase() === normalizedName
    )

    if (clientProjects.length === 0) {
      return summary
    }

    const active = clientProjects.filter((project) => project.status === 'active').length
    const completed = clientProjects.filter((project) => project.status === 'completed').length

    return {
      active,
      completed,
      total: clientProjects.length
    }
  }

  // حساب القيمة الإجمالية لمشاريع العميل
  const getClientTotalValue = (clientName: string) => {
    const normalizedName = clientName.trim().toLowerCase()

    if (!normalizedName) {
      return 0
    }

    const clientProjects = projects.filter((project: Project) =>
      project.client?.toLowerCase() === normalizedName
    )

    if (clientProjects.length === 0) {
      return 0
    }

    return clientProjects.reduce((sum, project) =>
      sum + (project.value ?? project.budget ?? 0),
      0
    )
  }

  // دالة حذف العميل مع التحقق من وجود مشاريع مرتبطة
  const handleDeleteClient = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return

    try {
      await deleteClient(clientId)
      setClientToDelete(null)
    } catch (error) {
      console.error('خطأ في حذف العميل:', error)
    }
  }

  // تصفية العملاء
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredClients = clients.filter((client) => {
    if (!normalizedSearch) {
      return true
    }

    const nameMatch = client.name?.toLowerCase().includes(normalizedSearch)
    const contactMatch = client.contact?.toLowerCase().includes(normalizedSearch)

    return Boolean(nameMatch || contactMatch)
  })

  // إحصائيات العملاء مع البيانات الحقيقية
  const stats = {
    total: clients.length,
    active: clients.filter((client) => client.status === 'active').length,
    strategic: clients.filter((client) => client.relationship === 'strategic').length,
    government: clients.filter((client) => client.type === 'government').length,
    private: clients.filter((client) => client.type === 'private').length,
    totalValue: clients.reduce((sum, client) => sum + getClientTotalValue(client.name), 0),
    avgProjects: clients.length > 0
      ? Math.round(
          clients.reduce((sum, client) => sum + getClientProjects(client.name).total, 0) /
          clients.length
        )
      : 0
  }

  // الإحصائيات السريعة للمدير
  const quickStats = [
    {
      label: 'إجمالي العملاء',
      value: stats.total,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'عملاء نشطون',
      value: stats.active,
      trend: 'up' as const,
      trendValue: '+2',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'عملاء استراتيجيون',
      value: stats.strategic,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'جهات حكومية',
      value: stats.government,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      label: 'شركات خاصة',
      value: stats.private,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'القيمة الإجمالية',
      value: formatCurrency(stats.totalValue),
      trend: 'up' as const,
      trendValue: '+12%',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ]

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'التقارير',
      icon: FileText,
      onClick: () => onSectionChange('reports'),
      variant: 'outline' as const
    },
    {
      label: 'التحليلات',
      icon: BarChart3,
      onClick: () => onSectionChange('reports'),
      variant: 'outline' as const
    },
    {
      label: 'عميل جديد',
      icon: Plus,
      onClick: () => onSectionChange('new-client'),
      primary: true
    }
  ]

  const getClientTypeIcon = (type: Client['type'] | undefined) => {
    switch (type) {
      case 'government':
        return <Building2 className="h-4 w-4 text-indigo-500" />
      case 'private':
        return <Users className="h-4 w-4 text-warning" />
      default:
        return <Building2 className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getClientTypeDisplay = (type: Client['type'] | undefined): BadgeDisplay => {
    switch (type) {
      case 'government':
        return { text: 'جهة حكومية', variant: 'info' }
      case 'private':
        return { text: 'شركة خاصة', variant: 'warning' }
      case 'individual':
        return { text: 'عميل فردي', variant: 'secondary' }
      default:
        return { text: 'غير محدد', variant: 'secondary' }
    }
  }

  const getRelationshipDisplay = (relationship: Client['relationship'] | undefined): BadgeDisplay => {
    switch (relationship) {
      case 'strategic':
        return { text: 'استراتيجي', variant: 'primary' }
      case 'government':
        return { text: 'حكومي', variant: 'info' }
      case 'regular':
        return { text: 'عادي', variant: 'secondary' }
      default:
        return { text: 'غير محدد', variant: 'secondary' }
    }
  }

  const getPaymentRatingColor = (rating: Client['paymentRating'] | undefined) => {
    switch (rating) {
      case 'excellent':
        return 'text-success'
      case 'good':
        return 'text-primary'
      case 'average':
        return 'text-yellow-500'
      case 'poor':
        return 'text-destructive'
      default:
        return 'text-muted-foreground'
    }
  }

  const getPaymentRatingText = (rating: Client['paymentRating'] | undefined) => {
    switch (rating) {
      case 'excellent':
        return 'ممتاز'
      case 'good':
        return 'جيد'
      case 'average':
        return 'متوسط'
      case 'poor':
        return 'ضعيف'
      default:
        return 'غير محدد'
    }
  }

  interface ClientCardProps {
    client: Client
    index: number
  }

  const ClientCard = ({ client, index }: ClientCardProps) => {
    const typeInfo = getClientTypeDisplay(client.type)
    const relationshipInfo = getRelationshipDisplay(client.relationship)
    
    // استخدام البيانات الحقيقية من المشاريع
    const clientProjectsData = getClientProjects(client.name)
    const clientTotalValue = getClientTotalValue(client.name)

    const handleViewClient = () => {
      setSearchTerm(client.name)
    }

    const handleEditClient = () => {
      onSectionChange('new-client')
    }

    const handlePrimaryAction = () => {
      onSectionChange('reports')
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            
            {/* الصف العلوي - الاسم والنوع */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getClientTypeIcon(client.type)}
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {client.name || 'عميل غير محدد'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={typeInfo.variant}>
                    {typeInfo.text}
                  </Badge>
                  <Badge variant={relationshipInfo.variant}>
                    {relationshipInfo.text}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(clientTotalValue)}
                </div>
                <div className="text-sm text-muted-foreground">
                  القيمة الإجمالية
                </div>
              </div>
            </div>

            {/* معلومات الاتصال */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{client.contact || 'جهة اتصال غير محددة'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="ltr-numbers">{client.phone || 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="ltr-numbers">{client.email || 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{client.location || 'غير محدد'}</span>
              </div>
            </div>

            {/* إحصائيات العميل - بيانات حقيقية من المشاريع */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{clientProjectsData.active}</div>
                <div className="text-xs text-muted-foreground">مشاريع نشطة</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-500">{clientProjectsData.completed}</div>
                <div className="text-xs text-muted-foreground">مشاريع مكتملة</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${getPaymentRatingColor(client.paymentRating)}`}>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{getPaymentRatingText(client.paymentRating)}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">تقييم الدفع</div>
              </div>
            </div>

            {/* معلومات إضافية */}
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>إجمالي المشاريع: {clientProjectsData.total}</span>
              </div>
              {clientProjectsData.total > 0 && (
                <Badge variant="outline" className="text-xs">
                  عميل نشط
                </Badge>
              )}
            </div>

            {/* الإجراءات */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  منذ {new Date(client.establishedDate || '2020-01-01').getFullYear()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <EntityActions 
                  onView={handleViewClient}
                  onEdit={handleEditClient}
                  onDelete={() => setClientToDelete(client.id)}
                  onPrimary={handlePrimaryAction}
                  primaryText={`عرض المشاريع (${clientProjectsData.total})`}
                  primaryIcon="FileText"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <PageLayout
      title="إدارة العملاء"
      description="متابعة وإدارة العلاقات مع العملاء والشركاء"
      icon={Users}
      gradientFrom="from-green-600"
      gradientTo="to-green-700"
      quickStats={quickStats}
      quickActions={quickActions}
      searchPlaceholder="البحث في العملاء..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      {/* شبكة العملاء */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client, index) => (
          <ClientCard key={client.id} client={client} index={index} />
        ))}
      </div>

      {/* حالة فارغة */}
      {filteredClients.length === 0 && (
        <EmptyState
          icon={Users}
          title="لا توجد عملاء"
          description={searchTerm ? "لم يتم العثور على عملاء مطابقين لبحثك" : "لا توجد عملاء مسجلين حتى الآن"}
          actionLabel={!searchTerm ? "إضافة عميل جديد" : undefined}
          onAction={!searchTerm ? () => onSectionChange('new-client') : undefined}
        />
      )}

      {/* Dialog تأكيد الحذف */}
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              تأكيد حذف العميل
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const client = clients.find(c => c.id === clientToDelete)
                const clientProjectsData = client ? getClientProjects(client.name) : { total: 0, active: 0, completed: 0 }
                
                return (
                  <div className="space-y-2">
                    <p>هل أنت متأكد من أنك تريد حذف العميل &quot;{client?.name}&quot;؟</p>
                    
                    {clientProjectsData.total > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                        <div className="text-amber-800 dark:text-amber-200 text-sm font-medium mb-1">
                          ⚠️ تحذير: يوجد مشاريع مرتبطة بهذا العميل
                        </div>
                        <ul className="text-amber-700 dark:text-amber-300 text-sm space-y-1">
                          <li>• إجمالي المشاريع: {clientProjectsData.total}</li>
                          <li>• مشاريع نشطة: {clientProjectsData.active}</li>
                          <li>• مشاريع مكتملة: {clientProjectsData.completed}</li>
                        </ul>
                        <p className="text-amber-800 dark:text-amber-200 text-sm mt-2">
                          حذف العميل سيؤثر على ربط هذه المشاريع.
                        </p>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      هذا الإجراء لا يمكن التراجع عنه.
                    </p>
                  </div>
                )
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => clientToDelete && handleDeleteClient(clientToDelete)}
            >
              حذف العميل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}