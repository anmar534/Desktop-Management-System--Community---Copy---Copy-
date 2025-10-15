# cURL API Examples
# أمثلة cURL

## Table of Contents / جدول المحتويات

1. [Authentication / المصادقة](#authentication)
2. [Tenders / المنافسات](#tenders)
3. [Projects / المشاريع](#projects)
4. [Financial / المالية](#financial)
5. [Procurement / المشتريات](#procurement)

---

## Authentication / المصادقة

### Login / تسجيل الدخول

```bash
curl -X POST https://api.dms.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
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
      "role": "admin"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  }
}
```

### Refresh Token / تحديث الرمز

```bash
curl -X POST https://api.dms.example.com/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Logout / تسجيل الخروج

```bash
curl -X POST https://api.dms.example.com/v1/auth/logout \
  -H "Authorization: Bearer <your-access-token>"
```

---

## Tenders / المنافسات

### Get All Tenders / الحصول على جميع المنافسات

```bash
curl -X GET "https://api.dms.example.com/v1/tenders?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Get Tender by ID / الحصول على منافسة محددة

```bash
curl -X GET https://api.dms.example.com/v1/tenders/tender_123 \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Create Tender / إنشاء منافسة

```bash
curl -X POST https://api.dms.example.com/v1/tenders \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "referenceNumber": "TND-2025-001",
    "title": "مشروع إنشاء مبنى إداري",
    "titleEn": "Administrative Building Construction",
    "description": "مشروع إنشاء مبنى إداري بمساحة 5000 متر مربع",
    "client": "وزارة الإسكان",
    "submissionDate": "2025-11-15",
    "openingDate": "2025-11-20",
    "budget": 5000000,
    "currency": "SAR"
  }'
```

### Update Tender / تحديث منافسة

```bash
curl -X PUT https://api.dms.example.com/v1/tenders/tender_123 \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "وصف محدث",
    "budget": 6000000
  }'
```

### Update Tender Status / تحديث حالة المنافسة

```bash
curl -X PUT https://api.dms.example.com/v1/tenders/tender_123/status \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "submitted"
  }'
```

### Get Tender Pricing / الحصول على تسعير المنافسة

```bash
curl -X GET https://api.dms.example.com/v1/tenders/tender_123/pricing \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Get Tender BOQ / الحصول على جدول الكميات

```bash
curl -X GET https://api.dms.example.com/v1/tenders/tender_123/boq \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Upload Tender Document / رفع مستند منافسة

```bash
curl -X POST https://api.dms.example.com/v1/tenders/tender_123/documents \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "مستند المواصفات",
    "type": "specification",
    "url": "https://example.com/spec.pdf",
    "size": 2048000
  }'
```

### Delete Tender / حذف منافسة

```bash
curl -X DELETE https://api.dms.example.com/v1/tenders/tender_123 \
  -H "Authorization: Bearer <your-access-token>"
```

---

## Projects / المشاريع

### Get All Projects / الحصول على جميع المشاريع

```bash
curl -X GET "https://api.dms.example.com/v1/projects?page=1&pageSize=20" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Create Project / إنشاء مشروع

```bash
curl -X POST https://api.dms.example.com/v1/projects \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PRJ-2025-001",
    "name": "مشروع مبنى إداري",
    "nameEn": "Administrative Building Project",
    "description": "تنفيذ مشروع مبنى إداري",
    "client": "وزارة الإسكان",
    "startDate": "2025-12-01",
    "endDate": "2026-12-01",
    "budget": 5000000,
    "currency": "SAR",
    "tenderId": "tender_123"
  }'
```

### Get Project by ID / الحصول على مشروع محدد

```bash
curl -X GET https://api.dms.example.com/v1/projects/project_123 \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Update Project / تحديث مشروع

```bash
curl -X PUT https://api.dms.example.com/v1/projects/project_123 \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "وصف محدث",
    "budget": 6000000
  }'
```

### Get Project Costs / الحصول على تكاليف المشروع

```bash
curl -X GET https://api.dms.example.com/v1/projects/project_123/costs \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Get Project Schedule / الحصول على جدول المشروع

```bash
curl -X GET https://api.dms.example.com/v1/projects/project_123/schedule \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Get Project Tasks / الحصول على مهام المشروع

```bash
curl -X GET https://api.dms.example.com/v1/projects/project_123/tasks \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Create Project Task / إنشاء مهمة مشروع

```bash
curl -X POST https://api.dms.example.com/v1/projects/project_123/tasks \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "مهمة اختبار",
    "nameEn": "Test Task",
    "description": "وصف المهمة",
    "startDate": "2025-11-01",
    "endDate": "2025-11-15",
    "assignedTo": "user_123",
    "status": "pending"
  }'
```

### Update Project Progress / تحديث تقدم المشروع

```bash
curl -X PUT https://api.dms.example.com/v1/projects/project_123/progress \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "overallProgress": 25,
    "completedTasks": 15,
    "totalTasks": 50
  }'
```

---

## Financial / المالية

### Get All Invoices / الحصول على جميع الفواتير

```bash
curl -X GET "https://api.dms.example.com/v1/financial/invoices?page=1&pageSize=20" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Create Invoice / إنشاء فاتورة

```bash
curl -X POST https://api.dms.example.com/v1/financial/invoices \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-2025-001",
    "type": "sales",
    "status": "draft",
    "client": "شركة ABC",
    "projectId": "project_123",
    "issueDate": "2025-10-15",
    "dueDate": "2025-11-15",
    "amount": 100000,
    "vat": 15000,
    "totalAmount": 115000,
    "paidAmount": 0,
    "currency": "SAR",
    "items": [
      {
        "id": "item_1",
        "description": "أعمال الخرسانة",
        "quantity": 100,
        "unitPrice": 1000,
        "amount": 100000,
        "vat": 15000,
        "totalAmount": 115000
      }
    ]
  }'
```

### Record Invoice Payment / تسجيل دفعة فاتورة

```bash
curl -X POST https://api.dms.example.com/v1/financial/invoices/invoice_123/payments \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "paymentDate": "2025-10-20",
    "paymentMethod": "bank_transfer",
    "reference": "REF-123",
    "notes": "دفعة أولى"
  }'
```

### Get Financial Summary / الحصول على ملخص مالي

```bash
curl -X GET https://api.dms.example.com/v1/financial/reports/summary \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Get Income Statement / الحصول على قائمة الدخل

```bash
curl -X GET "https://api.dms.example.com/v1/financial/reports/income-statement?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Get Balance Sheet / الحصول على الميزانية العمومية

```bash
curl -X GET "https://api.dms.example.com/v1/financial/reports/balance-sheet?date=2025-12-31" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Create Bank Account / إنشاء حساب بنكي

```bash
curl -X POST https://api.dms.example.com/v1/financial/bank-accounts \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "ACC-2025-001",
    "accountName": "حساب جاري",
    "accountNameEn": "Current Account",
    "bankName": "البنك الأهلي",
    "bankNameEn": "Al Ahli Bank",
    "iban": "SA0380000000608010167519",
    "currency": "SAR",
    "balance": 1000000,
    "isActive": true
  }'
```

---

## Procurement / المشتريات

### Get All Purchase Orders / الحصول على جميع أوامر الشراء

```bash
curl -X GET "https://api.dms.example.com/v1/procurement/purchase-orders?page=1&pageSize=20" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Create Purchase Order / إنشاء أمر شراء

```bash
curl -X POST https://api.dms.example.com/v1/procurement/purchase-orders \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "PO-2025-001",
    "supplierId": "supplier_123",
    "projectId": "project_123",
    "status": "draft",
    "orderDate": "2025-10-15",
    "deliveryDate": "2025-10-30",
    "totalAmount": 50000,
    "vat": 7500,
    "finalAmount": 57500,
    "currency": "SAR",
    "items": [
      {
        "id": "item_1",
        "itemName": "حديد تسليح",
        "quantity": 10,
        "unitPrice": 5000,
        "amount": 50000,
        "receivedQuantity": 0,
        "unit": "طن"
      }
    ]
  }'
```

### Get Suppliers / الحصول على الموردين

```bash
curl -X GET https://api.dms.example.com/v1/procurement/suppliers \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

### Create Supplier / إنشاء مورد

```bash
curl -X POST https://api.dms.example.com/v1/procurement/suppliers \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "شركة المواد الإنشائية",
    "nameEn": "Construction Materials Co.",
    "taxNumber": "123456789",
    "email": "info@supplier.com",
    "phone": "+966501234567",
    "address": "الرياض، المملكة العربية السعودية",
    "category": "materials",
    "rating": 4.5,
    "isActive": true
  }'
```

### Get Inventory Items / الحصول على عناصر المخزون

```bash
curl -X GET https://api.dms.example.com/v1/procurement/inventory \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Accept: application/json"
```

---

## Using API Key Authentication / استخدام مفتاح API

Instead of Bearer token, you can use API Key:

```bash
curl -X GET https://api.dms.example.com/v1/tenders \
  -H "X-API-Key: dms_abc123xyz456..." \
  -H "Accept: application/json"
```

---

## Handling Rate Limits / التعامل مع حدود المعدل

Check rate limit headers in response:

```bash
curl -i -X GET https://api.dms.example.com/v1/tenders \
  -H "Authorization: Bearer <your-access-token>"
```

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697356800
```

---

## Error Response Example / مثال استجابة خطأ

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

