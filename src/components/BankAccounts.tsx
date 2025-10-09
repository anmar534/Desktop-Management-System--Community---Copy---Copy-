'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { PageLayout, DetailCard, EmptyState } from './PageLayout'
import { DeleteConfirmation } from './ui/confirmation-dialog'
import { 
  Landmark,
  Plus,
  Eye,
  Edit,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ArrowRight,
  Trash2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useBankAccounts } from '@/application/hooks/useBankAccounts'
import { formatCurrency } from '@/data/centralData'
import type { BankAccount } from '@/data/centralData'
import { formatDateValue } from '@/utils/formatters'

interface BankAccountsProps {
  onSectionChange: (section: string) => void
}

export function BankAccounts({ onSectionChange }: BankAccountsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const { accounts, isLoading, deleteAccount } = useBankAccounts()
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null)

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      return accounts
    }

    return accounts.filter((account) => {
      const name = account.accountName?.toLowerCase() ?? ''
      const bank = account.bankName?.toLowerCase() ?? ''
      const number = account.accountNumber?.toLowerCase() ?? ''
      const iban = account.iban?.toLowerCase() ?? ''
      return name.includes(term) || bank.includes(term) || number.includes(term) || iban.includes(term)
    })
  }, [accounts, searchTerm])

  // حساب البيانات الإحصائية من الحسابات الفعلية
  const bankAccountsData = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
    const monthlyInflow = accounts.reduce((sum, acc) => sum + acc.monthlyInflow, 0)
    const monthlyOutflow = accounts.reduce((sum, acc) => sum + acc.monthlyOutflow, 0)

    return {
      overview: {
        totalAccounts: accounts.length,
        totalBalance,
        activeAccounts: accounts.filter(acc => acc.isActive).length,
        monthlyInflow,
        monthlyOutflow,
        netCashFlow: monthlyInflow - monthlyOutflow,
      },
    }
  }, [accounts])

  // الإحصائيات السريعة
  const quickStats = [
    {
      label: 'إجمالي الأرصدة',
      value: formatCurrency(bankAccountsData.overview.totalBalance),
      trend: 'up' as const,
      trendValue: '+5.2%',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'التدفق الشهري الداخل',
      value: formatCurrency(bankAccountsData.overview.monthlyInflow),
      trend: 'up' as const,
      trendValue: '+12.8%',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'التدفق الشهري الخارج',
      value: formatCurrency(bankAccountsData.overview.monthlyOutflow),
      trend: 'down' as const,
      trendValue: '-3.1%',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'صافي التدفق النقدي',
      value: formatCurrency(bankAccountsData.overview.netCashFlow),
      trend: 'up' as const,
      trendValue: '+18.5%',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ]

  // وظائف التفاعل
  const handleViewAccount = (accountId: string) => {
    console.log('عرض الحساب:', accountId)
    onSectionChange(`account-details?id=${accountId}`)
  }

  const handleEditAccount = (accountId: string) => {
    console.log('تحرير الحساب:', accountId)
    onSectionChange(`edit-account?id=${accountId}`)
  }

  const handleDeleteAccount = (account: BankAccount) => {
    setDeleteTarget(account)
  }

  const confirmDeleteAccount = async () => {
    if (!deleteTarget) {
      return
    }

    try {
      await deleteAccount(deleteTarget.id)
      setSelectedAccount((current) => (current === deleteTarget.id ? null : current))
    } finally {
      setDeleteTarget(null)
    }
  }

  // الإجراءات السريعة
  const quickActions = [
    {
      label: 'العودة للإدارة المالية',
      icon: ArrowRight,
      onClick: () => onSectionChange('financial'),
      variant: 'outline' as const
    },
    {
      label: 'حساب جديد',
      icon: Plus,
      onClick: () => onSectionChange('new-bank-account'),
      primary: true
    },
    {
      label: 'استيراد كشف حساب',
      icon: TrendingUp,
      onClick: () => onSectionChange('import-statement'),
      variant: 'outline' as const
    }
  ]

  const getAccountTypeText = (type: string) => {
    switch (type) {
      case 'current':
        return 'جاري'
      case 'savings':
        return 'توفير'
      case 'investment':
        return 'استثماري'
      default:
        return 'غير محدد'
    }
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'current':
        return Wallet
      case 'savings':
        return DollarSign
      case 'investment':
        return TrendingUp
      default:
        return CreditCard
    }
  }

  const AccountAnalysisCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DetailCard
        title="عدد الحسابات النشطة"
        value={bankAccountsData.overview.activeAccounts.toString()}
        subtitle="من إجمالي الحسابات"
        icon={Landmark}
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <DetailCard
        title="متوسط الرصيد"
        value={accounts.length > 0 ? formatCurrency(bankAccountsData.overview.totalBalance / accounts.length) : formatCurrency(0)}
        subtitle="لكل حساب"
        icon={Wallet}
        color="text-green-600"
        bgColor="bg-green-50"
      />
      <DetailCard
        title="أكبر حساب"
        value={accounts.length > 0 ? formatCurrency(Math.max(...accounts.map(acc => acc.currentBalance))) : formatCurrency(0)}
        subtitle="أعلى رصيد"
        icon={TrendingUp}
        color="text-emerald-600"
        bgColor="bg-emerald-50"
      />
      <DetailCard
        title="آخر معاملة"
        value="اليوم"
        subtitle="أحدث نشاط"
        icon={Clock}
        color="text-purple-600"
        bgColor="bg-purple-50"
      />
    </div>
  )

  return (
    <PageLayout
      title="إدارة الحسابات البنكية"
      description="إدارة ومتابعة الحسابات البنكية والتدفقات النقدية"
      icon={Landmark}
      gradientFrom="from-emerald-600"
      gradientTo="to-emerald-700"
      quickStats={quickStats}
      quickActions={quickActions}
      searchPlaceholder="البحث في الحسابات..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      headerExtra={AccountAnalysisCards}
    >
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* العمود الأيسر - قائمة الحسابات */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading && accounts.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 text-center text-muted-foreground">
                جاري تحميل الحسابات البنكية...
              </CardContent>
            </Card>
          ) : filteredAccounts.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title={accounts.length === 0 ? 'لا توجد حسابات بنكية' : 'لا توجد نتائج مطابقة'}
              description={
                accounts.length === 0
                  ? 'ابدأ بإضافة حساب بنكي لتتبع الأرصدة والتدفقات النقدية.'
                  : 'لا توجد حسابات تطابق معايير البحث الحالية. جرّب تعديل المرشحات أو إعادة التعيين.'
              }
              actionLabel={accounts.length === 0 ? 'إضافة حساب جديد' : undefined}
              onAction={accounts.length === 0 ? () => onSectionChange('new-bank-account') : undefined}
            />
          ) : filteredAccounts.map((account, index) => {
            const AccountIcon = getAccountTypeIcon(account.accountType)
            const netFlow = account.monthlyInflow - account.monthlyOutflow
            
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${
                    selectedAccount === account.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedAccount(account.id)}
                >
                  <CardContent className="p-6">
                    
                    {/* رأس البطاقة */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <AccountIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {account.accountName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {account.bankName}
                            </p>
                            <Badge variant="secondary">
                              {getAccountTypeText(account.accountType)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(account.currentBalance)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.currency}
                        </div>
                      </div>
                    </div>

                    {/* تفاصيل الحساب */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground block">رقم الحساب</span>
                        <span className="text-sm font-medium">
                          {account.accountNumber.replace(/(.{4})/g, '$1 ').trim()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">الآيبان</span>
                        <span className="text-sm font-medium">
                          {account.iban}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">آخر معاملة</span>
                        <span className="text-sm font-medium">
                          {formatDateValue(account.lastTransactionDate, {
                            locale: 'ar-SA',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* التدفق النقدي الشهري */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-green-600">
                          <ArrowDownLeft className="h-4 w-4" />
                          <span className="text-sm">داخل: {formatCurrency(account.monthlyInflow)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="text-sm">خارج: {formatCurrency(account.monthlyOutflow)}</span>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-1 ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {netFlow >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span className="text-sm font-medium">
                          صافي: {formatCurrency(Math.abs(netFlow))}
                        </span>
                      </div>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewAccount(account.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        تفاصيل
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditAccount(account.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        تحرير
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onSectionChange('import-statement')}
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        كشف الحساب
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteAccount(account)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* العمود الأيمن - المعاملات الحديثة */}
        <div className="space-y-6">
          
          {/* ملخص سريع */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">ملخص إجمالي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatCurrency(bankAccountsData.overview.totalBalance)}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي الأرصدة</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">التدفق الداخل</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(bankAccountsData.overview.monthlyInflow)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">التدفق الخارج</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(bankAccountsData.overview.monthlyOutflow)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">الصافي</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatCurrency(bankAccountsData.overview.netCashFlow)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* المعاملات الحديثة */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                المعاملات الحديثة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.length === 0 ? (
                <EmptyState
                  icon={Landmark}
                  title="لا توجد حسابات بنكية"
                  description="ابدأ بإضافة حساب بنكي لتظهر المعاملات الحديثة هنا."
                  actionLabel="إضافة حساب جديد"
                  onAction={() => onSectionChange('new-bank-account')}
                />
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">المعاملات الحديثة</p>
                  <p className="text-sm">سيتم عرض المعاملات هنا</p>
                </div>
              )}
              
              <Button variant="outline" size="sm" className="w-full">
                عرض جميع المعاملات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <DeleteConfirmation
        itemName={deleteTarget?.accountName ?? 'هذا الحساب'}
        onConfirm={confirmDeleteAccount}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      />
    </PageLayout>
  )
}
