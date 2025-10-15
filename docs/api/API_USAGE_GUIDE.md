# دليل استخدام API - Desktop Management System
# API Usage Guide - Desktop Management System

**الإصدار / Version:** 1.0.0  
**تاريخ التحديث / Last Updated:** 15 أكتوبر 2025

---

## 📋 جدول المحتويات / Table of Contents

1. [مقدمة / Introduction](#introduction)
2. [المصادقة / Authentication](#authentication)
3. [أمثلة الاستخدام / Usage Examples](#usage-examples)
4. [معالجة الأخطاء / Error Handling](#error-handling)
5. [حدود المعدل / Rate Limiting](#rate-limiting)
6. [أفضل الممارسات / Best Practices](#best-practices)

---

## 🌟 مقدمة / Introduction

واجهة برمجية شاملة لنظام إدارة المقاولات توفر الوصول الكامل لجميع وظائف النظام.

A comprehensive API for the Desktop Management System providing full access to all system functionalities.

### Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.dms.example.com/v1
```

### Supported Formats

- **Request**: JSON
- **Response**: JSON
- **Character Encoding**: UTF-8

---

## 🔐 المصادقة / Authentication

### 1. Bearer Token Authentication

#### تسجيل الدخول / Login

```bash
curl -X POST https://api.dms.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "admin",
      "email": "admin@example.com",
      "fullName": "مدير النظام",
      "role": "admin",
      "permissions": ["admin:all"]
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer",
      "scope": ["admin:all"]
    }
  }
}
```

#### استخدام الرمز / Using the Token

```bash
curl -X GET https://api.dms.example.com/v1/tenders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### تحديث الرمز / Refresh Token

```bash
curl -X POST https://api.dms.example.com/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### 2. API Key Authentication

#### إنشاء مفتاح API / Create API Key

```bash
curl -X POST https://api.dms.example.com/v1/auth/api-keys \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration Key",
    "nameEn": "Integration Key",
    "description": "Key for external system integration",
    "permissions": ["tenders:read", "projects:read"],
    "rateLimit": 200
  }'
```

#### استخدام مفتاح API / Using API Key

```bash
curl -X GET https://api.dms.example.com/v1/tenders \
  -H "X-API-Key: dms_abc123xyz456..."
```

---

## 💡 أمثلة الاستخدام / Usage Examples

### المنافسات / Tenders

#### 1. الحصول على جميع المنافسات / Get All Tenders

```javascript
// JavaScript/TypeScript
import { TendersAPI } from '@/api'

async function getTenders() {
  const response = await TendersAPI.getTenders({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  if (response.success) {
    console.log('Tenders:', response.data.tenders)
    console.log('Total:', response.data.total)
  }
}
```

```python
# Python
import requests

url = "https://api.dms.example.com/v1/tenders"
headers = {
    "Authorization": "Bearer <your-token>",
    "Accept": "application/json"
}
params = {
    "page": 1,
    "pageSize": 20,
    "sortBy": "createdAt",
    "sortOrder": "desc"
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

if data['success']:
    print(f"Found {data['data']['total']} tenders")
```

```php
// PHP
<?php
$url = 'https://api.dms.example.com/v1/tenders';
$headers = [
    'Authorization: Bearer <your-token>',
    'Accept: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url . '?page=1&pageSize=20');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$data = json_decode($response, true);

if ($data['success']) {
    echo "Found " . $data['data']['total'] . " tenders\n";
}
?>
```

#### 2. إنشاء منافسة جديدة / Create New Tender

```javascript
// JavaScript/TypeScript
import { TendersAPI } from '@/api'

async function createTender() {
  const response = await TendersAPI.createTender({
    referenceNumber: 'TND-2025-001',
    title: 'مشروع إنشاء مبنى إداري',
    titleEn: 'Administrative Building Construction',
    description: 'مشروع إنشاء مبنى إداري بمساحة 5000 متر مربع',
    client: 'وزارة الإسكان',
    submissionDate: '2025-11-15',
    openingDate: '2025-11-20',
    budget: 5000000,
    currency: 'SAR'
  })
  
  if (response.success) {
    console.log('Tender created:', response.data)
  } else {
    console.error('Error:', response.error)
  }
}
```

```bash
# cURL
curl -X POST https://api.dms.example.com/v1/tenders \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "referenceNumber": "TND-2025-001",
    "title": "مشروع إنشاء مبنى إداري",
    "titleEn": "Administrative Building Construction",
    "client": "وزارة الإسكان",
    "submissionDate": "2025-11-15",
    "budget": 5000000,
    "currency": "SAR"
  }'
```

#### 3. تحديث منافسة / Update Tender

```javascript
// JavaScript/TypeScript
import { TendersAPI } from '@/api'

async function updateTender(tenderId: string) {
  const response = await TendersAPI.updateTender(tenderId, {
    status: 'submitted',
    description: 'تم تحديث الوصف'
  })
  
  if (response.success) {
    console.log('Tender updated:', response.data)
  }
}
```

#### 4. الحصول على تسعير المنافسة / Get Tender Pricing

```javascript
// JavaScript/TypeScript
import { TendersAPI } from '@/api'

async function getTenderPricing(tenderId: string) {
  const response = await TendersAPI.getTenderPricing(tenderId)
  
  if (response.success) {
    const pricing = response.data
    console.log('Total Cost:', pricing.totalCost)
    console.log('Total Price:', pricing.totalPrice)
    console.log('Profit Margin:', pricing.profitMargin + '%')
  }
}
```

### المشاريع / Projects

#### 1. الحصول على جميع المشاريع / Get All Projects

```javascript
// JavaScript/TypeScript
import { ProjectsAPI } from '@/api'

async function getProjects() {
  const response = await ProjectsAPI.getProjects({
    page: 1,
    pageSize: 20,
    filters: { status: 'in_progress' }
  })
  
  if (response.success) {
    console.log('Active Projects:', response.data.projects)
  }
}
```

#### 2. إنشاء مشروع جديد / Create New Project

```javascript
// JavaScript/TypeScript
import { ProjectsAPI } from '@/api'

async function createProject() {
  const response = await ProjectsAPI.createProject({
    code: 'PRJ-2025-001',
    name: 'مشروع مبنى إداري',
    nameEn: 'Administrative Building Project',
    client: 'وزارة الإسكان',
    startDate: '2025-12-01',
    endDate: '2026-12-01',
    budget: 5000000,
    tenderId: 'tender_123'
  })
  
  if (response.success) {
    console.log('Project created:', response.data)
  }
}
```

#### 3. الحصول على تكاليف المشروع / Get Project Costs

```javascript
// JavaScript/TypeScript
import { ProjectsAPI } from '@/api'

async function getProjectCosts(projectId: string) {
  const response = await ProjectsAPI.getProjectCosts(projectId)
  
  if (response.success) {
    const costs = response.data
    console.log('Planned Cost:', costs.plannedCost)
    console.log('Actual Cost:', costs.actualCost)
    console.log('Cost Variance:', costs.costVariance)
    console.log('CPI:', costs.costPerformanceIndex)
  }
}
```

### المالية / Financial

#### 1. إنشاء فاتورة / Create Invoice

```javascript
// JavaScript/TypeScript
import { FinancialAPI } from '@/api'

async function createInvoice() {
  const response = await FinancialAPI.createInvoice({
    invoiceNumber: 'INV-2025-001',
    type: 'sales',
    status: 'draft',
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
        totalAmount: 115000
      }
    ]
  })
  
  if (response.success) {
    console.log('Invoice created:', response.data)
  }
}
```

#### 2. الحصول على ملخص مالي / Get Financial Summary

```javascript
// JavaScript/TypeScript
import { FinancialAPI } from '@/api'

async function getFinancialSummary() {
  const response = await FinancialAPI.getFinancialSummary()
  
  if (response.success) {
    const summary = response.data
    console.log('Total Revenue:', summary.totalRevenue)
    console.log('Total Expenses:', summary.totalExpenses)
    console.log('Net Income:', summary.netIncome)
  }
}
```

### المشتريات / Procurement

#### 1. إنشاء أمر شراء / Create Purchase Order

```javascript
// JavaScript/TypeScript
import { ProcurementAPI } from '@/api'

async function createPurchaseOrder() {
  const response = await ProcurementAPI.createPurchaseOrder({
    orderNumber: 'PO-2025-001',
    supplierId: 'supplier_123',
    projectId: 'project_123',
    status: 'draft',
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
        unit: 'طن'
      }
    ]
  })
  
  if (response.success) {
    console.log('Purchase order created:', response.data)
  }
}
```

---

## ⚠️ معالجة الأخطاء / Error Handling

### هيكل الخطأ / Error Structure

```json
{
  "success": false,
  "error": {
    "code": "3001",
    "message": "Resource not found",
    "messageAr": "المورد غير موجود",
    "details": {
      "resource": "tender",
      "id": "tender_123"
    },
    "timestamp": "2025-10-15T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### رموز الأخطاء الشائعة / Common Error Codes

| Code | Message | Description AR | Description EN |
|------|---------|----------------|----------------|
| 1001 | Unauthorized | غير مصرح | Authentication required |
| 1002 | Invalid Credentials | بيانات اعتماد غير صحيحة | Invalid username or password |
| 1003 | Token Expired | انتهت صلاحية الرمز | Access token has expired |
| 1005 | Insufficient Permissions | صلاحيات غير كافية | User lacks required permissions |
| 2001 | Validation Error | خطأ في التحقق | Request validation failed |
| 3001 | Resource Not Found | المورد غير موجود | Requested resource not found |
| 4001 | Rate Limit Exceeded | تجاوز حد الطلبات | Too many requests |
| 5001 | Internal Server Error | خطأ داخلي | Server error occurred |

### مثال معالجة الأخطاء / Error Handling Example

```javascript
// JavaScript/TypeScript
import { TendersAPI } from '@/api'

async function handleTenderOperation() {
  try {
    const response = await TendersAPI.getTenderById('tender_123')
    
    if (response.success) {
      console.log('Tender:', response.data)
    } else {
      // Handle API error
      const error = response.error
      
      switch (error.code) {
        case '1001':
          console.error('Please login first')
          break
        case '1005':
          console.error('You don\'t have permission')
          break
        case '3001':
          console.error('Tender not found')
          break
        case '4001':
          console.error('Too many requests, please wait')
          break
        default:
          console.error('Error:', error.message)
      }
    }
  } catch (error) {
    // Handle network error
    console.error('Network error:', error)
  }
}
```

---

## 🚦 حدود المعدل / Rate Limiting

### الحدود الافتراضية / Default Limits

| Operation Type | Limit | Window |
|----------------|-------|--------|
| Default | 100 requests | 1 minute |
| Read Operations | 200 requests | 1 minute |
| Write Operations | 50 requests | 1 minute |
| Reports | 10 requests | 1 minute |
| Authentication | 5 requests | 15 minutes |

### رؤوس حد المعدل / Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697356800
Retry-After: 60
```

### مثال التعامل مع حد المعدل / Rate Limit Handling Example

```javascript
// JavaScript/TypeScript
import { apiClient } from '@/api'

async function makeRequestWithRetry() {
  const response = await apiClient.get('/tenders')
  
  if (!response.success && response.error?.code === '4001') {
    const retryAfter = response.error.retryAfter || 60
    console.log(`Rate limit exceeded. Retrying after ${retryAfter} seconds`)
    
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
    return makeRequestWithRetry()
  }
  
  return response
}
```

---

## ✅ أفضل الممارسات / Best Practices

### 1. استخدام التخزين المؤقت / Use Caching

```javascript
// Cache responses to reduce API calls
const cache = new Map()

async function getCachedTenders() {
  const cacheKey = 'tenders_list'
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }
  
  const response = await TendersAPI.getTenders()
  
  if (response.success) {
    cache.set(cacheKey, response.data)
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000) // 5 minutes
  }
  
  return response.data
}
```

### 2. استخدام Pagination / Use Pagination

```javascript
// Always use pagination for large datasets
async function getAllTenders() {
  const allTenders = []
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const response = await TendersAPI.getTenders({ page, pageSize: 100 })
    
    if (response.success) {
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

### 3. معالجة الأخطاء بشكل صحيح / Proper Error Handling

```javascript
// Always handle errors gracefully
async function robustApiCall() {
  try {
    const response = await TendersAPI.getTenders()
    
    if (!response.success) {
      // Log error for debugging
      console.error('API Error:', response.error)
      
      // Show user-friendly message
      showNotification(response.error.messageAr || response.error.message)
      
      return null
    }
    
    return response.data
  } catch (error) {
    console.error('Network Error:', error)
    showNotification('حدث خطأ في الاتصال بالخادم')
    return null
  }
}
```

### 4. استخدام TypeScript / Use TypeScript

```typescript
// Leverage TypeScript for type safety
import type { Tender, TenderStatus } from '@/api'

async function updateTenderStatus(
  tenderId: string,
  newStatus: TenderStatus
): Promise<Tender | null> {
  const response = await TendersAPI.updateTenderStatus(tenderId, newStatus)
  
  if (response.success && response.data) {
    return response.data
  }
  
  return null
}
```

---

## 📚 موارد إضافية / Additional Resources

- [OpenAPI Specification](./openapi.yaml)
- [API Reference Documentation](./API_REFERENCE.md)
- [Authentication Guide](./AUTH_GUIDE.md)
- [Integration Examples](./examples/)

---

**للدعم / For Support:**  
Email: support@dms.example.com  
Documentation: https://docs.dms.example.com

