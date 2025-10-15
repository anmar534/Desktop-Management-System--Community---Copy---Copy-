# JavaScript/TypeScript API Examples
# أمثلة JavaScript/TypeScript

## Table of Contents / جدول المحتويات

1. [Authentication / المصادقة](#authentication)
2. [Tenders / المنافسات](#tenders)
3. [Projects / المشاريع](#projects)
4. [Financial / المالية](#financial)
5. [Procurement / المشتريات](#procurement)
6. [Error Handling / معالجة الأخطاء](#error-handling)

---

## Authentication / المصادقة

### Login / تسجيل الدخول

```typescript
import { authService } from '@/api/auth'

async function login() {
  const response = await authService.login('admin', 'password123')
  
  if (response.success && response.data) {
    const { user, token } = response.data
    
    console.log('Logged in as:', user.fullName)
    console.log('Access Token:', token.accessToken)
    console.log('Expires in:', token.expiresIn, 'seconds')
    
    // Store token for future requests
    localStorage.setItem('accessToken', token.accessToken)
    localStorage.setItem('refreshToken', token.refreshToken)
  } else {
    console.error('Login failed:', response.error?.message)
  }
}
```

### Refresh Token / تحديث الرمز

```typescript
import { authService } from '@/api/auth'

async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  
  if (!refreshToken) {
    console.error('No refresh token available')
    return
  }
  
  const response = await authService.refreshToken(refreshToken)
  
  if (response.success && response.data) {
    localStorage.setItem('accessToken', response.data.accessToken)
    console.log('Token refreshed successfully')
  } else {
    console.error('Token refresh failed')
    // Redirect to login
    window.location.href = '/login'
  }
}
```

### Logout / تسجيل الخروج

```typescript
import { authService } from '@/api/auth'

async function logout() {
  await authService.logout()
  
  // Clear stored tokens
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  
  // Redirect to login
  window.location.href = '/login'
}
```

---

## Tenders / المنافسات

### Get All Tenders / الحصول على جميع المنافسات

```typescript
import { TendersAPI } from '@/api'

async function getAllTenders() {
  const response = await TendersAPI.getTenders({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  
  if (response.success && response.data) {
    const { tenders, total } = response.data
    
    console.log(`Found ${total} tenders`)
    
    tenders.forEach(tender => {
      console.log(`${tender.referenceNumber}: ${tender.title}`)
      console.log(`  Status: ${tender.status}`)
      console.log(`  Budget: ${tender.budget} ${tender.currency}`)
    })
  }
}
```

### Create Tender / إنشاء منافسة

```typescript
import { TendersAPI } from '@/api'

async function createTender() {
  const newTender = {
    referenceNumber: 'TND-2025-001',
    title: 'مشروع إنشاء مبنى إداري',
    titleEn: 'Administrative Building Construction',
    description: 'مشروع إنشاء مبنى إداري بمساحة 5000 متر مربع',
    client: 'وزارة الإسكان',
    submissionDate: '2025-11-15',
    openingDate: '2025-11-20',
    budget: 5000000,
    currency: 'SAR',
  }
  
  const response = await TendersAPI.createTender(newTender)
  
  if (response.success && response.data) {
    console.log('Tender created successfully!')
    console.log('Tender ID:', response.data.id)
    console.log('Reference:', response.data.referenceNumber)
  } else {
    console.error('Failed to create tender:', response.error?.message)
  }
}
```

### Update Tender Status / تحديث حالة المنافسة

```typescript
import { TendersAPI } from '@/api'

async function submitTender(tenderId: string) {
  const response = await TendersAPI.updateTenderStatus(tenderId, 'submitted')
  
  if (response.success && response.data) {
    console.log('Tender submitted successfully!')
    console.log('New status:', response.data.status)
  }
}
```

### Get Tender Pricing / الحصول على تسعير المنافسة

```typescript
import { TendersAPI } from '@/api'

async function getTenderPricing(tenderId: string) {
  const response = await TendersAPI.getTenderPricing(tenderId)
  
  if (response.success && response.data) {
    const pricing = response.data
    
    console.log('Tender Pricing:')
    console.log('  Total Cost:', pricing.totalCost.toLocaleString())
    console.log('  Total Price:', pricing.totalPrice.toLocaleString())
    console.log('  Profit:', pricing.profit.toLocaleString())
    console.log('  Profit Margin:', pricing.profitMargin + '%')
  }
}
```

---

## Projects / المشاريع

### Create Project / إنشاء مشروع

```typescript
import { ProjectsAPI } from '@/api'

async function createProject() {
  const newProject = {
    code: 'PRJ-2025-001',
    name: 'مشروع مبنى إداري',
    nameEn: 'Administrative Building Project',
    description: 'تنفيذ مشروع مبنى إداري',
    client: 'وزارة الإسكان',
    startDate: '2025-12-01',
    endDate: '2026-12-01',
    budget: 5000000,
    currency: 'SAR',
    tenderId: 'tender_123',
  }
  
  const response = await ProjectsAPI.createProject(newProject)
  
  if (response.success && response.data) {
    console.log('Project created successfully!')
    console.log('Project ID:', response.data.id)
    console.log('Project Code:', response.data.code)
  }
}
```

### Get Project Costs / الحصول على تكاليف المشروع

```typescript
import { ProjectsAPI } from '@/api'

async function getProjectCosts(projectId: string) {
  const response = await ProjectsAPI.getProjectCosts(projectId)
  
  if (response.success && response.data) {
    const costs = response.data
    
    console.log('Project Costs:')
    console.log('  Planned Cost:', costs.plannedCost.toLocaleString())
    console.log('  Actual Cost:', costs.actualCost.toLocaleString())
    console.log('  Cost Variance:', costs.costVariance.toLocaleString())
    console.log('  CPI:', costs.costPerformanceIndex.toFixed(2))
    
    if (costs.costPerformanceIndex < 1) {
      console.warn('⚠️ Project is over budget!')
    } else {
      console.log('✅ Project is within budget')
    }
  }
}
```

### Update Project Progress / تحديث تقدم المشروع

```typescript
import { ProjectsAPI } from '@/api'

async function updateProjectProgress(projectId: string, progress: number) {
  const response = await ProjectsAPI.updateProjectProgress(projectId, {
    overallProgress: progress,
    completedTasks: 15,
    totalTasks: 50,
    lastUpdated: new Date().toISOString(),
  })
  
  if (response.success && response.data) {
    console.log(`Project progress updated to ${progress}%`)
  }
}
```

---

## Financial / المالية

### Create Invoice / إنشاء فاتورة

```typescript
import { FinancialAPI } from '@/api'

async function createInvoice() {
  const newInvoice = {
    invoiceNumber: 'INV-2025-001',
    type: 'sales' as const,
    status: 'draft' as const,
    client: 'شركة ABC',
    projectId: 'project_123',
    issueDate: '2025-10-15',
    dueDate: '2025-11-15',
    amount: 100000,
    vat: 15000,
    totalAmount: 115000,
    paidAmount: 0,
    currency: 'SAR',
    items: [
      {
        id: 'item_1',
        description: 'أعمال الخرسانة',
        quantity: 100,
        unitPrice: 1000,
        amount: 100000,
        vat: 15000,
        totalAmount: 115000,
      },
    ],
  }
  
  const response = await FinancialAPI.createInvoice(newInvoice)
  
  if (response.success && response.data) {
    console.log('Invoice created successfully!')
    console.log('Invoice Number:', response.data.invoiceNumber)
    console.log('Total Amount:', response.data.totalAmount.toLocaleString())
  }
}
```

### Record Payment / تسجيل دفعة

```typescript
import { FinancialAPI } from '@/api'

async function recordPayment(invoiceId: string) {
  const payment = {
    amount: 50000,
    paymentDate: '2025-10-20',
    paymentMethod: 'bank_transfer',
    reference: 'REF-123',
    notes: 'دفعة أولى',
  }
  
  const response = await FinancialAPI.recordInvoicePayment(invoiceId, payment)
  
  if (response.success && response.data) {
    console.log('Payment recorded successfully!')
    console.log('Paid Amount:', response.data.paidAmount.toLocaleString())
    console.log('Remaining:', response.data.remainingAmount.toLocaleString())
  }
}
```

### Get Financial Summary / الحصول على ملخص مالي

```typescript
import { FinancialAPI } from '@/api'

async function getFinancialSummary() {
  const response = await FinancialAPI.getFinancialSummary()
  
  if (response.success && response.data) {
    const summary = response.data
    
    console.log('Financial Summary:')
    console.log('  Total Revenue:', summary.totalRevenue.toLocaleString())
    console.log('  Total Expenses:', summary.totalExpenses.toLocaleString())
    console.log('  Net Income:', summary.netIncome.toLocaleString())
    console.log('  Profit Margin:', summary.profitMargin.toFixed(2) + '%')
  }
}
```

---

## Procurement / المشتريات

### Create Purchase Order / إنشاء أمر شراء

```typescript
import { ProcurementAPI } from '@/api'

async function createPurchaseOrder() {
  const newPO = {
    orderNumber: 'PO-2025-001',
    supplierId: 'supplier_123',
    projectId: 'project_123',
    status: 'draft' as const,
    orderDate: '2025-10-15',
    deliveryDate: '2025-10-30',
    totalAmount: 50000,
    vat: 7500,
    finalAmount: 57500,
    currency: 'SAR',
    items: [
      {
        id: 'item_1',
        itemName: 'حديد تسليح',
        quantity: 10,
        unitPrice: 5000,
        amount: 50000,
        receivedQuantity: 0,
        unit: 'طن',
      },
    ],
  }
  
  const response = await ProcurementAPI.createPurchaseOrder(newPO)
  
  if (response.success && response.data) {
    console.log('Purchase order created successfully!')
    console.log('PO Number:', response.data.orderNumber)
  }
}
```

---

## Error Handling / معالجة الأخطاء

### Comprehensive Error Handling / معالجة شاملة للأخطاء

```typescript
import { TendersAPI } from '@/api'
import type { ApiResponse } from '@/api/types'

async function handleApiCall() {
  try {
    const response = await TendersAPI.getTenderById('tender_123')
    
    if (response.success && response.data) {
      // Success case
      console.log('Tender:', response.data)
      return response.data
    } else {
      // API error
      const error = response.error
      
      switch (error?.code) {
        case '1001':
          console.error('Authentication required')
          // Redirect to login
          window.location.href = '/login'
          break
          
        case '1005':
          console.error('Insufficient permissions')
          // Show permission error
          alert('ليس لديك صلاحية للوصول إلى هذا المورد')
          break
          
        case '3001':
          console.error('Tender not found')
          // Show not found error
          alert('المنافسة غير موجودة')
          break
          
        case '4001':
          console.error('Rate limit exceeded')
          // Wait and retry
          const retryAfter = error.retryAfter || 60
          console.log(`Retrying after ${retryAfter} seconds...`)
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          return handleApiCall() // Retry
          
        default:
          console.error('API Error:', error?.message)
          alert(error?.messageAr || error?.message || 'حدث خطأ')
      }
      
      return null
    }
  } catch (error) {
    // Network error
    console.error('Network Error:', error)
    alert('حدث خطأ في الاتصال بالخادم')
    return null
  }
}
```

### Retry with Exponential Backoff / إعادة المحاولة مع التراجع الأسي

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<ApiResponse<T>>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fn()
      
      if (response.success && response.data) {
        return response.data
      }
      
      // If rate limited, use the retry-after value
      if (response.error?.code === '4001') {
        const delay = (response.error.retryAfter || baseDelay) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // For other errors, don't retry
      return null
    } catch (error) {
      // Network error - retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        console.error('Max retries exceeded')
        return null
      }
    }
  }
  
  return null
}

// Usage
const tender = await retryWithBackoff(() => TendersAPI.getTenderById('tender_123'))
```

---

## Advanced Examples / أمثلة متقدمة

### Batch Operations / عمليات دفعية

```typescript
import { TendersAPI } from '@/api'

async function batchUpdateTenders(tenderIds: string[], status: TenderStatus) {
  const results = await Promise.allSettled(
    tenderIds.map(id => TendersAPI.updateTenderStatus(id, status))
  )
  
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  console.log(`Updated ${successful} tenders, ${failed} failed`)
  
  return { successful, failed }
}
```

### Pagination Helper / مساعد الترقيم

```typescript
import { TendersAPI } from '@/api'
import type { Tender } from '@/api/types'

async function getAllTendersWithPagination(): Promise<Tender[]> {
  const allTenders: Tender[] = []
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const response = await TendersAPI.getTenders({ page, pageSize: 100 })
    
    if (response.success && response.data) {
      allTenders.push(...response.data.tenders)
      hasMore = response.metadata?.pagination?.hasNext || false
      page++
    } else {
      break
    }
  }
  
  return allTenders
}
```

### Real-time Updates with Webhooks / تحديثات فورية مع Webhooks

```typescript
import { webhookService, WEBHOOK_EVENTS } from '@/api/integrations'

async function setupWebhooks() {
  // Register webhook for tender updates
  await webhookService.registerWebhook({
    name: 'Tender Updates',
    nameAr: 'تحديثات المنافسات',
    url: 'https://myapp.com/webhooks/tenders',
    events: [
      WEBHOOK_EVENTS.TENDER_CREATED,
      WEBHOOK_EVENTS.TENDER_UPDATED,
      WEBHOOK_EVENTS.TENDER_AWARDED,
    ],
    secret: 'my-webhook-secret',
    isActive: true,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    },
  })
  
  console.log('Webhook registered successfully!')
}
```

