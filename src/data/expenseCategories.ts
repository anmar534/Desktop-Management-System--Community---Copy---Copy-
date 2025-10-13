/**
 * 🏗️ نظام إدارة المصروفات المتكامل لشركات المقاولات
 * Integrated Expense Management System for Construction Companies
 */

import { getDesignTokenExpression, type DesignTokenKey } from '@/utils/designTokens';

const tokenColor = (token: DesignTokenKey): string => getDesignTokenExpression(token);

const EXPENSE_FREQUENCY_COLOR_CLASSES = {
  MONTHLY: 'bg-info/10 text-info border-info/30',
  QUARTERLY: 'bg-success/10 text-success border-success/30',
  ANNUALLY: 'bg-primary/10 text-primary border-primary/30',
  SEMI_ANNUALLY: 'bg-warning/10 text-warning border-warning/30',
  WEEKLY: 'bg-accent/10 text-accent border-accent/30',
  ONE_TIME: 'bg-muted/40 text-muted-foreground border-muted/40',
} as const;

const PAYMENT_STATUS_COLOR_CLASSES = {
  PENDING: 'bg-warning/10 text-warning border-warning/30',
  COMPLETED: 'bg-success/10 text-success border-success/30',
  OVERDUE: 'bg-error/10 text-error border-error/30',
  CANCELLED: 'bg-muted/40 text-muted-foreground border-muted/40',
} as const;

// واجهة تصنيف المصروفات
export interface ExpenseCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  subcategories?: ExpenseSubcategory[];
  isAdministrative: boolean; // إدارية أم مشاريع
  icon?: string;
  color?: string;
}

// واجهة التصنيف الفرعي
export interface ExpenseSubcategory {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string;
}

// واجهة المصروف
export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  categoryId: string;
  subcategoryId?: string;
  frequency: string;
  paymentMethod: string;
  paymentStatus: string;
  dueDate?: string;
  paidDate?: string;
  projectId?: string; // ربط بالمشروع في حالة مصروفات المشاريع
  isAdministrative: boolean;
  createdAt: string;
  updatedAt: string;
}

// تردد المصروفات
export const EXPENSE_FREQUENCIES = {
  MONTHLY: { id: 'monthly', nameAr: 'شهرية', nameEn: 'Monthly', multiplier: 12, color: EXPENSE_FREQUENCY_COLOR_CLASSES.MONTHLY },
  QUARTERLY: { id: 'quarterly', nameAr: 'ربع سنوية', nameEn: 'Quarterly', multiplier: 4, color: EXPENSE_FREQUENCY_COLOR_CLASSES.QUARTERLY },
  ANNUALLY: { id: 'annually', nameAr: 'سنوية', nameEn: 'Annually', multiplier: 1, color: EXPENSE_FREQUENCY_COLOR_CLASSES.ANNUALLY },
  SEMI_ANNUALLY: { id: 'semi_annually', nameAr: 'نصف سنوية', nameEn: 'Semi-Annually', multiplier: 2, color: EXPENSE_FREQUENCY_COLOR_CLASSES.SEMI_ANNUALLY },
  WEEKLY: { id: 'weekly', nameAr: 'أسبوعية', nameEn: 'Weekly', multiplier: 52, color: EXPENSE_FREQUENCY_COLOR_CLASSES.WEEKLY },
  ONE_TIME: { id: 'one_time', nameAr: 'مرة واحدة', nameEn: 'One Time', multiplier: 0, color: EXPENSE_FREQUENCY_COLOR_CLASSES.ONE_TIME }
} as const;

// طرق الدفع
export const PAYMENT_METHODS = {
  CASH: { id: 'cash', nameAr: 'نقداً', nameEn: 'Cash' },
  BANK_TRANSFER: { id: 'bank_transfer', nameAr: 'تحويل بنكي', nameEn: 'Bank Transfer' },
  CREDIT_CARD: { id: 'credit_card', nameAr: 'بطاقة ائتمان', nameEn: 'Credit Card' },
  CHECK: { id: 'check', nameAr: 'شيك', nameEn: 'Check' },
  ONLINE_PAYMENT: { id: 'online_payment', nameAr: 'دفع إلكتروني', nameEn: 'Online Payment' }
} as const;

// حالات الدفع
export const PAYMENT_STATUS = {
  PENDING: { id: 'pending', nameAr: 'في الانتظار', nameEn: 'Pending', color: PAYMENT_STATUS_COLOR_CLASSES.PENDING },
  COMPLETED: { id: 'completed', nameAr: 'مكتمل', nameEn: 'Completed', color: PAYMENT_STATUS_COLOR_CLASSES.COMPLETED },
  OVERDUE: { id: 'overdue', nameAr: 'متأخر', nameEn: 'Overdue', color: PAYMENT_STATUS_COLOR_CLASSES.OVERDUE },
  CANCELLED: { id: 'cancelled', nameAr: 'ملغي', nameEn: 'Cancelled', color: PAYMENT_STATUS_COLOR_CLASSES.CANCELLED }
} as const;

// التصنيفات الرئيسية للمصروفات
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  // ======== المصروفات الإدارية ========
  {
    id: 'admin_salaries',
    nameAr: 'الرواتب والأجور الإدارية',
    nameEn: 'Administrative Salaries & Wages',
    description: 'رواتب الموظفين الإداريين والإدارة العليا',
    isAdministrative: true,
    icon: '👥',
  color: tokenColor('chart1'),
    subcategories: [
      { id: 'management_salaries', nameAr: 'رواتب الإدارة العليا', nameEn: 'Management Salaries' },
      { id: 'admin_staff_salaries', nameAr: 'رواتب الموظفين الإداريين', nameEn: 'Administrative Staff Salaries' },
      { id: 'hr_salaries', nameAr: 'رواتب الموارد البشرية', nameEn: 'HR Salaries' },
      { id: 'accounting_salaries', nameAr: 'رواتب المحاسبة', nameEn: 'Accounting Salaries' },
      { id: 'overtime_admin', nameAr: 'ساعات إضافية إدارية', nameEn: 'Administrative Overtime' }
    ]
  },
  {
    id: 'admin_benefits',
    nameAr: 'المزايا والتأمينات الإدارية',
    nameEn: 'Administrative Benefits & Insurance',
    description: 'التأمينات الطبية والاجتماعية للموظفين الإداريين',
    isAdministrative: true,
    icon: '🛡️',
  color: tokenColor('chart2'),
    subcategories: [
      { id: 'health_insurance_admin', nameAr: 'التأمين الطبي الإداري', nameEn: 'Administrative Health Insurance' },
      { id: 'social_insurance_admin', nameAr: 'التأمينات الاجتماعية الإدارية', nameEn: 'Administrative Social Insurance' },
      { id: 'end_service_admin', nameAr: 'مكافآت نهاية الخدمة الإدارية', nameEn: 'Administrative End of Service Benefits' },
      { id: 'training_admin', nameAr: 'التدريب والتطوير الإداري', nameEn: 'Administrative Training & Development' }
    ]
  },
  {
    id: 'office_rent',
    nameAr: 'إيجار المكاتب والمرافق',
    nameEn: 'Office & Facilities Rent',
    description: 'إيجارات المكاتب الإدارية والمستودعات',
    isAdministrative: true,
    icon: '🏢',
  color: tokenColor('chart3'),
    subcategories: [
      { id: 'main_office_rent', nameAr: 'إيجار المكتب الرئيسي', nameEn: 'Main Office Rent' },
      { id: 'branch_office_rent', nameAr: 'إيجار المكاتب الفرعية', nameEn: 'Branch Office Rent' },
      { id: 'warehouse_rent', nameAr: 'إيجار المستودعات الإدارية', nameEn: 'Administrative Warehouse Rent' },
      { id: 'parking_rent', nameAr: 'إيجار المواقف', nameEn: 'Parking Rent' }
    ]
  },
  {
    id: 'utilities',
    nameAr: 'المرافق والخدمات',
    nameEn: 'Utilities & Services',
    description: 'فواتير الكهرباء والماء والاتصالات',
    isAdministrative: true,
    icon: '⚡',
  color: tokenColor('chart4'),
    subcategories: [
      { id: 'electricity', nameAr: 'الكهرباء', nameEn: 'Electricity' },
      { id: 'water', nameAr: 'المياه', nameEn: 'Water' },
      { id: 'internet_phone', nameAr: 'الإنترنت والهاتف', nameEn: 'Internet & Phone' },
      { id: 'security_services', nameAr: 'خدمات الأمن والحراسة', nameEn: 'Security Services' },
      { id: 'cleaning_services', nameAr: 'خدمات النظافة', nameEn: 'Cleaning Services' }
    ]
  },
  {
    id: 'office_supplies',
    nameAr: 'المستلزمات المكتبية',
    nameEn: 'Office Supplies',
    description: 'القرطاسية والمستلزمات المكتبية والتقنية',
    isAdministrative: true,
    icon: '📝',
  color: tokenColor('chart5'),
    subcategories: [
      { id: 'stationery', nameAr: 'القرطاسية', nameEn: 'Stationery' },
      { id: 'printing_materials', nameAr: 'مواد الطباعة', nameEn: 'Printing Materials' },
      { id: 'computer_supplies', nameAr: 'مستلزمات الكمبيوتر', nameEn: 'Computer Supplies' },
      { id: 'software_licenses', nameAr: 'تراخيص البرامج', nameEn: 'Software Licenses' },
      { id: 'office_furniture', nameAr: 'الأثاث المكتبي', nameEn: 'Office Furniture' }
    ]
  },
  {
    id: 'professional_services',
    nameAr: 'الخدمات المهنية والاستشارية',
    nameEn: 'Professional & Consulting Services',
    description: 'الاستشارات القانونية والمحاسبية والمهنية',
    isAdministrative: true,
    icon: '⚖️',
  color: tokenColor('chart6'),
    subcategories: [
      { id: 'legal_services', nameAr: 'الخدمات القانونية', nameEn: 'Legal Services' },
      { id: 'audit_services', nameAr: 'خدمات المراجعة والتدقيق', nameEn: 'Audit Services' },
      { id: 'management_consulting', nameAr: 'الاستشارات الإدارية', nameEn: 'Management Consulting' },
      { id: 'tax_services', nameAr: 'الخدمات الضريبية', nameEn: 'Tax Services' },
      { id: 'technical_consulting', nameAr: 'الاستشارات الفنية', nameEn: 'Technical Consulting' }
    ]
  },
  {
    id: 'marketing_advertising',
    nameAr: 'التسويق والإعلان',
    nameEn: 'Marketing & Advertising',
    description: 'حملات التسويق والإعلان والعلاقات العامة',
    isAdministrative: true,
    icon: '📢',
  color: tokenColor('chart7'),
    subcategories: [
      { id: 'digital_marketing', nameAr: 'التسويق الرقمي', nameEn: 'Digital Marketing' },
      { id: 'print_advertising', nameAr: 'الإعلانات المطبوعة', nameEn: 'Print Advertising' },
      { id: 'exhibitions_events', nameAr: 'المعارض والفعاليات', nameEn: 'Exhibitions & Events' },
      { id: 'promotional_materials', nameAr: 'المواد الترويجية', nameEn: 'Promotional Materials' },
      { id: 'website_maintenance', nameAr: 'صيانة الموقع الإلكتروني', nameEn: 'Website Maintenance' }
    ]
  },
  {
    id: 'admin_transportation',
    nameAr: 'النقل والمواصلات الإدارية',
    nameEn: 'Administrative Transportation',
    description: 'تكاليف النقل والمواصلات للإدارة',
    isAdministrative: true,
    icon: '🚗',
  color: tokenColor('chart8'),
    subcategories: [
      { id: 'vehicle_maintenance_admin', nameAr: 'صيانة المركبات الإدارية', nameEn: 'Administrative Vehicle Maintenance' },
      { id: 'fuel_admin', nameAr: 'وقود المركبات الإدارية', nameEn: 'Administrative Vehicle Fuel' },
      { id: 'vehicle_insurance_admin', nameAr: 'تأمين المركبات الإدارية', nameEn: 'Administrative Vehicle Insurance' },
      { id: 'travel_expenses', nameAr: 'مصاريف السفر والانتداب', nameEn: 'Travel & Business Trip Expenses' }
    ]
  },
  {
    id: 'licenses_permits',
    nameAr: 'التراخيص والرسوم الحكومية',
    nameEn: 'Licenses & Government Fees',
    description: 'التراخيص والرسوم الحكومية والعضويات',
    isAdministrative: true,
    icon: '📋',
  color: tokenColor('primary'),
    subcategories: [
      { id: 'business_license', nameAr: 'رخصة تجارية', nameEn: 'Business License' },
      { id: 'chamber_membership', nameAr: 'عضوية غرفة التجارة', nameEn: 'Chamber of Commerce Membership' },
      { id: 'professional_licenses', nameAr: 'التراخيص المهنية', nameEn: 'Professional Licenses' },
      { id: 'government_fees', nameAr: 'الرسوم الحكومية', nameEn: 'Government Fees' }
    ]
  },

  // ======== مصروفات المشاريع ========
  {
    id: 'project_labor',
    nameAr: 'العمالة والأجور',
    nameEn: 'Labor & Wages',
    description: 'أجور العمال والفنيين في المشاريع',
    isAdministrative: false,
    icon: '👷',
  color: tokenColor('success'),
    subcategories: [
      { id: 'skilled_workers', nameAr: 'العمال المهرة', nameEn: 'Skilled Workers' },
      { id: 'unskilled_workers', nameAr: 'العمال غير المهرة', nameEn: 'Unskilled Workers' },
      { id: 'technicians', nameAr: 'الفنيين والمتخصصين', nameEn: 'Technicians & Specialists' },
      { id: 'supervisors', nameAr: 'المشرفين ورؤساء العمال', nameEn: 'Supervisors & Foremen' },
      { id: 'overtime_project', nameAr: 'ساعات إضافية للمشاريع', nameEn: 'Project Overtime' }
    ]
  },
  {
    id: 'construction_materials',
    nameAr: 'مواد البناء والإنشاء',
    nameEn: 'Construction Materials',
    description: 'المواد الخام ومواد البناء الأساسية',
    isAdministrative: false,
    icon: '🧱',
  color: tokenColor('accent'),
    subcategories: [
      { id: 'cement_concrete', nameAr: 'الأسمنت والخرسانة', nameEn: 'Cement & Concrete' },
      { id: 'steel_reinforcement', nameAr: 'الحديد والتسليح', nameEn: 'Steel & Reinforcement' },
      { id: 'bricks_blocks', nameAr: 'الطوب والبلوك', nameEn: 'Bricks & Blocks' },
      { id: 'sand_gravel', nameAr: 'الرمل والحصى والركام', nameEn: 'Sand, Gravel & Aggregate' },
      { id: 'wood_timber', nameAr: 'الخشب والأخشاب', nameEn: 'Wood & Timber' }
    ]
  },
  {
    id: 'electrical_plumbing',
    nameAr: 'المواد الكهربائية والصحية',
    nameEn: 'Electrical & Plumbing Materials',
    description: 'المواد الكهربائية وأعمال السباكة والصحي',
    isAdministrative: false,
    icon: '🔌',
  color: tokenColor('info'),
    subcategories: [
      { id: 'electrical_materials', nameAr: 'المواد الكهربائية', nameEn: 'Electrical Materials' },
      { id: 'plumbing_materials', nameAr: 'مواد السباكة والصحي', nameEn: 'Plumbing & Sanitary Materials' },
      { id: 'hvac_materials', nameAr: 'مواد التكييف والتهوية', nameEn: 'HVAC Materials' },
      { id: 'pipes_fittings', nameAr: 'المواسير والتوصيلات', nameEn: 'Pipes & Fittings' }
    ]
  },
  {
    id: 'finishing_materials',
    nameAr: 'مواد التشطيب والديكور',
    nameEn: 'Finishing & Decoration Materials',
    description: 'مواد التشطيبات الداخلية والخارجية',
    isAdministrative: false,
    icon: '🎨',
  color: tokenColor('warning'),
    subcategories: [
      { id: 'paint_coating', nameAr: 'الدهانات والطلاء', nameEn: 'Paint & Coating' },
      { id: 'tiles_ceramics', nameAr: 'البلاط والسيراميك', nameEn: 'Tiles & Ceramics' },
      { id: 'flooring_materials', nameAr: 'مواد الأرضيات', nameEn: 'Flooring Materials' },
      { id: 'doors_windows', nameAr: 'الأبواب والنوافذ', nameEn: 'Doors & Windows' },
      { id: 'insulation_materials', nameAr: 'مواد العزل', nameEn: 'Insulation Materials' }
    ]
  },
  {
    id: 'equipment_machinery',
    nameAr: 'المعدات والآلات',
    nameEn: 'Equipment & Machinery',
    description: 'المعدات الثقيلة وآلات البناء',
    isAdministrative: false,
    icon: '🚜',
  color: tokenColor('chart1'),
    subcategories: [
      { id: 'heavy_equipment', nameAr: 'المعدات الثقيلة', nameEn: 'Heavy Equipment' },
      { id: 'construction_tools', nameAr: 'أدوات البناء والعدد', nameEn: 'Construction Tools' },
      { id: 'equipment_rental', nameAr: 'تأجير المعدات', nameEn: 'Equipment Rental' },
      { id: 'equipment_maintenance', nameAr: 'صيانة المعدات', nameEn: 'Equipment Maintenance' },
      { id: 'equipment_fuel', nameAr: 'وقود المعدات', nameEn: 'Equipment Fuel' }
    ]
  },
  {
    id: 'subcontractors',
    nameAr: 'المقاولون الفرعيون',
    nameEn: 'Subcontractors',
    description: 'تكاليف المقاولين الفرعيين والمتخصصين',
    isAdministrative: false,
    icon: '🤝',
  color: tokenColor('chart2'),
    subcategories: [
      { id: 'electrical_contractors', nameAr: 'مقاولو الكهرباء', nameEn: 'Electrical Contractors' },
      { id: 'plumbing_contractors', nameAr: 'مقاولو السباكة', nameEn: 'Plumbing Contractors' },
      { id: 'hvac_contractors', nameAr: 'مقاولو التكييف', nameEn: 'HVAC Contractors' },
      { id: 'finishing_contractors', nameAr: 'مقاولو التشطيبات', nameEn: 'Finishing Contractors' },
      { id: 'specialized_contractors', nameAr: 'المقاولون المتخصصون', nameEn: 'Specialized Contractors' }
    ]
  },
  {
    id: 'project_permits',
    nameAr: 'تراخيص ورسوم المشاريع',
    nameEn: 'Project Permits & Fees',
    description: 'تراخيص البناء والرسوم الحكومية للمشاريع',
    isAdministrative: false,
    icon: '📜',
  color: tokenColor('chart3'),
    subcategories: [
      { id: 'building_permits', nameAr: 'تراخيص البناء', nameEn: 'Building Permits' },
      { id: 'utility_connections', nameAr: 'توصيل المرافق', nameEn: 'Utility Connections' },
      { id: 'inspection_fees', nameAr: 'رسوم التفتيش والاعتماد', nameEn: 'Inspection & Approval Fees' },
      { id: 'municipal_fees', nameAr: 'الرسوم البلدية', nameEn: 'Municipal Fees' }
    ]
  },
  {
    id: 'project_transportation',
    nameAr: 'النقل واللوجستيات',
    nameEn: 'Transportation & Logistics',
    description: 'نقل المواد والمعدات والعمالة للمشاريع',
    isAdministrative: false,
    icon: '🚛',
  color: tokenColor('chart4'),
    subcategories: [
      { id: 'material_transportation', nameAr: 'نقل المواد', nameEn: 'Material Transportation' },
      { id: 'equipment_transportation', nameAr: 'نقل المعدات', nameEn: 'Equipment Transportation' },
      { id: 'worker_transportation', nameAr: 'نقل العمال', nameEn: 'Worker Transportation' },
      { id: 'logistics_coordination', nameAr: 'تنسيق اللوجستيات', nameEn: 'Logistics Coordination' }
    ]
  },
  {
    id: 'project_safety',
    nameAr: 'السلامة والأمان',
    nameEn: 'Safety & Security',
    description: 'معدات ومتطلبات السلامة في المشاريع',
    isAdministrative: false,
    icon: '⛑️',
  color: tokenColor('destructive'),
    subcategories: [
      { id: 'safety_equipment', nameAr: 'معدات السلامة المهنية', nameEn: 'Occupational Safety Equipment' },
      { id: 'safety_training', nameAr: 'تدريب السلامة', nameEn: 'Safety Training' },
      { id: 'site_security', nameAr: 'أمن الموقع والحراسة', nameEn: 'Site Security & Guards' },
      { id: 'project_insurance', nameAr: 'تأمين المشروع', nameEn: 'Project Insurance' },
      { id: 'first_aid', nameAr: 'الإسعافات الأولية', nameEn: 'First Aid Supplies' }
    ]
  },
  {
    id: 'project_utilities',
    nameAr: 'مرافق وخدمات المشاريع',
    nameEn: 'Project Utilities & Services',
    description: 'الخدمات والمرافق المؤقتة للمشاريع',
    isAdministrative: false,
    icon: '🔧',
  color: tokenColor('chart5'),
    subcategories: [
      { id: 'temporary_electricity', nameAr: 'الكهرباء المؤقتة', nameEn: 'Temporary Electricity' },
      { id: 'temporary_water', nameAr: 'المياه المؤقتة', nameEn: 'Temporary Water' },
      { id: 'site_facilities', nameAr: 'مرافق الموقع المؤقتة', nameEn: 'Temporary Site Facilities' },
      { id: 'waste_management', nameAr: 'إدارة النفايات', nameEn: 'Waste Management' },
      { id: 'site_accommodation', nameAr: 'سكن العمال', nameEn: 'Worker Accommodation' }
    ]
  }
];

// وظائف مساعدة
export function getCategoryById(id: string): ExpenseCategory | undefined {
  return EXPENSE_CATEGORIES.find(cat => cat.id === id);
}

export function getAdministrativeCategories(): ExpenseCategory[] {
  return EXPENSE_CATEGORIES.filter(cat => cat.isAdministrative);
}

export function getProjectCategories(): ExpenseCategory[] {
  return EXPENSE_CATEGORIES.filter(cat => !cat.isAdministrative);
}

export function getSubcategoryById(categoryId: string, subcategoryId: string): ExpenseSubcategory | undefined {
  const category = getCategoryById(categoryId);
  return category?.subcategories?.find(sub => sub.id === subcategoryId);
}

// حساب المبالغ التلقائي حسب التكرار
export function calculateAmounts(amount: number, frequency: string) {
  const freq = EXPENSE_FREQUENCIES[frequency.toUpperCase() as keyof typeof EXPENSE_FREQUENCIES];
  
  if (!freq || frequency === 'one_time') {
    return { monthly: amount, annual: amount };
  }
  
  const annual = freq.multiplier === 1 ? amount : amount * freq.multiplier;
  const monthly = annual / 12;
  
  return { 
    monthly: Math.round(monthly * 100) / 100, 
    annual: Math.round(annual * 100) / 100 
  };
}

// الحصول على الفئات مجمعة
export function getCategoriesByType(isAdministrative: boolean): ExpenseCategory[] {
  return EXPENSE_CATEGORIES.filter(cat => cat.isAdministrative === isAdministrative);
}
