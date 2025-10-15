# Python API Examples
# أمثلة Python

## Table of Contents / جدول المحتويات

1. [Setup / الإعداد](#setup)
2. [Authentication / المصادقة](#authentication)
3. [Tenders / المنافسات](#tenders)
4. [Projects / المشاريع](#projects)
5. [Financial / المالية](#financial)
6. [Error Handling / معالجة الأخطاء](#error-handling)

---

## Setup / الإعداد

### Install Dependencies / تثبيت المتطلبات

```bash
pip install requests python-dotenv
```

### API Client Class / فئة عميل API

```python
import requests
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class DMSApiClient:
    """Desktop Management System API Client"""
    
    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = base_url or os.getenv('DMS_API_URL', 'https://api.dms.example.com/v1')
        self.api_key = api_key
        self.access_token: Optional[str] = None
        self.session = requests.Session()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers"""
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        elif self.api_key:
            headers['X-API-Key'] = self.api_key
        
        return headers
    
    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make API request"""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params
            )
            
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': {
                    'code': '5001',
                    'message': str(e),
                    'messageAr': 'خطأ في الاتصال'
                }
            }
    
    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """GET request"""
        return self._request('GET', endpoint, params=params)
    
    def post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST request"""
        return self._request('POST', endpoint, data=data)
    
    def put(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT request"""
        return self._request('PUT', endpoint, data=data)
    
    def delete(self, endpoint: str) -> Dict[str, Any]:
        """DELETE request"""
        return self._request('DELETE', endpoint)
```

---

## Authentication / المصادقة

### Login / تسجيل الدخول

```python
def login(client: DMSApiClient, username: str, password: str) -> bool:
    """Login to DMS API"""
    response = client.post('/auth/login', {
        'username': username,
        'password': password
    })
    
    if response.get('success') and response.get('data'):
        data = response['data']
        client.access_token = data['token']['accessToken']
        
        print(f"Logged in as: {data['user']['fullName']}")
        print(f"Role: {data['user']['role']}")
        
        return True
    else:
        error = response.get('error', {})
        print(f"Login failed: {error.get('message')}")
        return False

# Usage
client = DMSApiClient()
if login(client, 'admin', 'password123'):
    print("Authentication successful!")
```

### Refresh Token / تحديث الرمز

```python
def refresh_token(client: DMSApiClient, refresh_token: str) -> bool:
    """Refresh access token"""
    response = client.post('/auth/refresh', {
        'refreshToken': refresh_token
    })
    
    if response.get('success') and response.get('data'):
        client.access_token = response['data']['accessToken']
        print("Token refreshed successfully")
        return True
    else:
        print("Token refresh failed")
        return False
```

---

## Tenders / المنافسات

### Get All Tenders / الحصول على جميع المنافسات

```python
def get_tenders(client: DMSApiClient, page: int = 1, page_size: int = 20):
    """Get all tenders with pagination"""
    response = client.get('/tenders', params={
        'page': page,
        'pageSize': page_size,
        'sortBy': 'createdAt',
        'sortOrder': 'desc'
    })
    
    if response.get('success') and response.get('data'):
        data = response['data']
        tenders = data['tenders']
        total = data['total']
        
        print(f"Found {total} tenders")
        
        for tender in tenders:
            print(f"{tender['referenceNumber']}: {tender['title']}")
            print(f"  Status: {tender['status']}")
            print(f"  Budget: {tender['budget']:,} {tender['currency']}")
        
        return tenders
    else:
        print(f"Error: {response.get('error', {}).get('message')}")
        return []

# Usage
tenders = get_tenders(client)
```

### Create Tender / إنشاء منافسة

```python
def create_tender(client: DMSApiClient):
    """Create a new tender"""
    new_tender = {
        'referenceNumber': 'TND-2025-001',
        'title': 'مشروع إنشاء مبنى إداري',
        'titleEn': 'Administrative Building Construction',
        'description': 'مشروع إنشاء مبنى إداري بمساحة 5000 متر مربع',
        'client': 'وزارة الإسكان',
        'submissionDate': '2025-11-15',
        'openingDate': '2025-11-20',
        'budget': 5000000,
        'currency': 'SAR'
    }
    
    response = client.post('/tenders', new_tender)
    
    if response.get('success') and response.get('data'):
        tender = response['data']
        print(f"Tender created successfully!")
        print(f"Tender ID: {tender['id']}")
        print(f"Reference: {tender['referenceNumber']}")
        return tender
    else:
        error = response.get('error', {})
        print(f"Failed to create tender: {error.get('message')}")
        return None

# Usage
tender = create_tender(client)
```

### Update Tender Status / تحديث حالة المنافسة

```python
def update_tender_status(client: DMSApiClient, tender_id: str, status: str):
    """Update tender status"""
    response = client.put(f'/tenders/{tender_id}/status', {
        'status': status
    })
    
    if response.get('success') and response.get('data'):
        tender = response['data']
        print(f"Tender status updated to: {tender['status']}")
        return tender
    else:
        print(f"Failed to update status: {response.get('error', {}).get('message')}")
        return None

# Usage
update_tender_status(client, 'tender_123', 'submitted')
```

### Get Tender Pricing / الحصول على تسعير المنافسة

```python
def get_tender_pricing(client: DMSApiClient, tender_id: str):
    """Get tender pricing details"""
    response = client.get(f'/tenders/{tender_id}/pricing')
    
    if response.get('success') and response.get('data'):
        pricing = response['data']
        
        print("Tender Pricing:")
        print(f"  Total Cost: {pricing['totalCost']:,}")
        print(f"  Total Price: {pricing['totalPrice']:,}")
        print(f"  Profit: {pricing['profit']:,}")
        print(f"  Profit Margin: {pricing['profitMargin']}%")
        
        return pricing
    else:
        print(f"Error: {response.get('error', {}).get('message')}")
        return None

# Usage
pricing = get_tender_pricing(client, 'tender_123')
```

---

## Projects / المشاريع

### Create Project / إنشاء مشروع

```python
def create_project(client: DMSApiClient):
    """Create a new project"""
    new_project = {
        'code': 'PRJ-2025-001',
        'name': 'مشروع مبنى إداري',
        'nameEn': 'Administrative Building Project',
        'description': 'تنفيذ مشروع مبنى إداري',
        'client': 'وزارة الإسكان',
        'startDate': '2025-12-01',
        'endDate': '2026-12-01',
        'budget': 5000000,
        'currency': 'SAR',
        'tenderId': 'tender_123'
    }
    
    response = client.post('/projects', new_project)
    
    if response.get('success') and response.get('data'):
        project = response['data']
        print(f"Project created successfully!")
        print(f"Project ID: {project['id']}")
        print(f"Project Code: {project['code']}")
        return project
    else:
        print(f"Failed to create project: {response.get('error', {}).get('message')}")
        return None

# Usage
project = create_project(client)
```

### Get Project Costs / الحصول على تكاليف المشروع

```python
def get_project_costs(client: DMSApiClient, project_id: str):
    """Get project cost details"""
    response = client.get(f'/projects/{project_id}/costs')
    
    if response.get('success') and response.get('data'):
        costs = response['data']
        
        print("Project Costs:")
        print(f"  Planned Cost: {costs['plannedCost']:,}")
        print(f"  Actual Cost: {costs['actualCost']:,}")
        print(f"  Cost Variance: {costs['costVariance']:,}")
        print(f"  CPI: {costs['costPerformanceIndex']:.2f}")
        
        if costs['costPerformanceIndex'] < 1:
            print("  ⚠️ Project is over budget!")
        else:
            print("  ✅ Project is within budget")
        
        return costs
    else:
        print(f"Error: {response.get('error', {}).get('message')}")
        return None

# Usage
costs = get_project_costs(client, 'project_123')
```

### Update Project Progress / تحديث تقدم المشروع

```python
from datetime import datetime

def update_project_progress(client: DMSApiClient, project_id: str, progress: int):
    """Update project progress"""
    response = client.put(f'/projects/{project_id}/progress', {
        'overallProgress': progress,
        'completedTasks': 15,
        'totalTasks': 50,
        'lastUpdated': datetime.now().isoformat()
    })
    
    if response.get('success') and response.get('data'):
        print(f"Project progress updated to {progress}%")
        return response['data']
    else:
        print(f"Failed to update progress: {response.get('error', {}).get('message')}")
        return None

# Usage
update_project_progress(client, 'project_123', 25)
```

---

## Financial / المالية

### Create Invoice / إنشاء فاتورة

```python
def create_invoice(client: DMSApiClient):
    """Create a new invoice"""
    new_invoice = {
        'invoiceNumber': 'INV-2025-001',
        'type': 'sales',
        'status': 'draft',
        'client': 'شركة ABC',
        'projectId': 'project_123',
        'issueDate': '2025-10-15',
        'dueDate': '2025-11-15',
        'amount': 100000,
        'vat': 15000,
        'totalAmount': 115000,
        'paidAmount': 0,
        'currency': 'SAR',
        'items': [
            {
                'id': 'item_1',
                'description': 'أعمال الخرسانة',
                'quantity': 100,
                'unitPrice': 1000,
                'amount': 100000,
                'vat': 15000,
                'totalAmount': 115000
            }
        ]
    }
    
    response = client.post('/financial/invoices', new_invoice)
    
    if response.get('success') and response.get('data'):
        invoice = response['data']
        print(f"Invoice created successfully!")
        print(f"Invoice Number: {invoice['invoiceNumber']}")
        print(f"Total Amount: {invoice['totalAmount']:,}")
        return invoice
    else:
        print(f"Failed to create invoice: {response.get('error', {}).get('message')}")
        return None

# Usage
invoice = create_invoice(client)
```

### Record Payment / تسجيل دفعة

```python
def record_payment(client: DMSApiClient, invoice_id: str):
    """Record invoice payment"""
    payment = {
        'amount': 50000,
        'paymentDate': '2025-10-20',
        'paymentMethod': 'bank_transfer',
        'reference': 'REF-123',
        'notes': 'دفعة أولى'
    }
    
    response = client.post(f'/financial/invoices/{invoice_id}/payments', payment)
    
    if response.get('success') and response.get('data'):
        invoice = response['data']
        print(f"Payment recorded successfully!")
        print(f"Paid Amount: {invoice['paidAmount']:,}")
        print(f"Remaining: {invoice['remainingAmount']:,}")
        return invoice
    else:
        print(f"Failed to record payment: {response.get('error', {}).get('message')}")
        return None

# Usage
record_payment(client, 'invoice_123')
```

### Get Financial Summary / الحصول على ملخص مالي

```python
def get_financial_summary(client: DMSApiClient):
    """Get financial summary"""
    response = client.get('/financial/reports/summary')
    
    if response.get('success') and response.get('data'):
        summary = response['data']
        
        print("Financial Summary:")
        print(f"  Total Revenue: {summary['totalRevenue']:,}")
        print(f"  Total Expenses: {summary['totalExpenses']:,}")
        print(f"  Net Income: {summary['netIncome']:,}")
        print(f"  Profit Margin: {summary['profitMargin']:.2f}%")
        
        return summary
    else:
        print(f"Error: {response.get('error', {}).get('message')}")
        return None

# Usage
summary = get_financial_summary(client)
```

---

## Error Handling / معالجة الأخطاء

### Comprehensive Error Handling / معالجة شاملة للأخطاء

```python
import time

def handle_api_call(client: DMSApiClient, tender_id: str):
    """Handle API call with comprehensive error handling"""
    response = client.get(f'/tenders/{tender_id}')
    
    if response.get('success') and response.get('data'):
        # Success case
        tender = response['data']
        print(f"Tender: {tender['title']}")
        return tender
    else:
        # Error case
        error = response.get('error', {})
        error_code = error.get('code')
        
        if error_code == '1001':
            print("Authentication required")
            # Re-login
            login(client, 'admin', 'password123')
            # Retry
            return handle_api_call(client, tender_id)
        
        elif error_code == '1005':
            print("Insufficient permissions")
            print(error.get('messageAr', error.get('message')))
            return None
        
        elif error_code == '3001':
            print("Tender not found")
            return None
        
        elif error_code == '4001':
            print("Rate limit exceeded")
            retry_after = error.get('retryAfter', 60)
            print(f"Retrying after {retry_after} seconds...")
            time.sleep(retry_after)
            return handle_api_call(client, tender_id)
        
        else:
            print(f"API Error: {error.get('message')}")
            return None

# Usage
tender = handle_api_call(client, 'tender_123')
```

### Retry with Exponential Backoff / إعادة المحاولة مع التراجع الأسي

```python
import time
from typing import Callable, Optional, Any

def retry_with_backoff(
    func: Callable[[], Dict[str, Any]],
    max_retries: int = 3,
    base_delay: float = 1.0
) -> Optional[Any]:
    """Retry function with exponential backoff"""
    for attempt in range(max_retries):
        try:
            response = func()
            
            if response.get('success') and response.get('data'):
                return response['data']
            
            # If rate limited, use the retry-after value
            if response.get('error', {}).get('code') == '4001':
                delay = response['error'].get('retryAfter', base_delay)
                time.sleep(delay)
                continue
            
            # For other errors, don't retry
            return None
        
        except Exception as e:
            # Network error - retry with exponential backoff
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                print(f"Retry attempt {attempt + 1} after {delay}s")
                time.sleep(delay)
            else:
                print("Max retries exceeded")
                return None
    
    return None

# Usage
tender = retry_with_backoff(lambda: client.get('/tenders/tender_123'))
```

### Batch Operations / عمليات دفعية

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def batch_update_tenders(client: DMSApiClient, tender_ids: list, status: str):
    """Update multiple tenders in batch"""
    def update_single(tender_id: str):
        return client.put(f'/tenders/{tender_id}/status', {'status': status})
    
    successful = 0
    failed = 0
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(update_single, tid): tid for tid in tender_ids}
        
        for future in as_completed(futures):
            tender_id = futures[future]
            try:
                response = future.result()
                if response.get('success'):
                    successful += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"Error updating {tender_id}: {e}")
                failed += 1
    
    print(f"Updated {successful} tenders, {failed} failed")
    return {'successful': successful, 'failed': failed}

# Usage
result = batch_update_tenders(client, ['tender_1', 'tender_2', 'tender_3'], 'submitted')
```

### Pagination Helper / مساعد الترقيم

```python
def get_all_tenders_with_pagination(client: DMSApiClient):
    """Get all tenders using pagination"""
    all_tenders = []
    page = 1
    has_more = True
    
    while has_more:
        response = client.get('/tenders', params={
            'page': page,
            'pageSize': 100
        })
        
        if response.get('success') and response.get('data'):
            data = response['data']
            all_tenders.extend(data['tenders'])
            
            # Check if there are more pages
            metadata = response.get('metadata', {})
            pagination = metadata.get('pagination', {})
            has_more = pagination.get('hasNext', False)
            
            page += 1
        else:
            break
    
    print(f"Retrieved {len(all_tenders)} tenders in total")
    return all_tenders

# Usage
all_tenders = get_all_tenders_with_pagination(client)
```

