/**
 * Mock Data for Tender Pricing V2 Prototype
 * بيانات تجريبية لنموذج التسعير المحسّن
 */

export interface MockPricingItem {
  id: string
  itemNumber: string
  description: string
  unit: string
  quantity: number
  isPriced: boolean
  unitPrice?: number
  totalPrice?: number
}

export interface MockMaterialRow {
  id: string
  description: string
  unit: string
  quantity: number
  price: number
  total: number
  wastage: number
}

export interface MockLaborRow {
  id: string
  description: string
  unit: string
  quantity: number
  price: number
  total: number
}

export interface MockEquipmentRow {
  id: string
  description: string
  unit: string
  quantity: number
  price: number
  total: number
  hours: number
}

export interface MockSubcontractorRow {
  id: string
  description: string
  unit: string
  quantity: number
  price: number
  total: number
}

export interface MockPricingData {
  materials: MockMaterialRow[]
  labor: MockLaborRow[]
  equipment: MockEquipmentRow[]
  subcontractors: MockSubcontractorRow[]
  percentages: {
    administrative: number
    operational: number
    profit: number
  }
}

// بيانات تجريبية لمنافسة
export const mockTender = {
  id: 'tender-demo-001',
  name: 'مشروع إنشاء مبنى إداري - الرياض',
  client: 'وزارة الشؤون البلدية والقروية',
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 يوم من الآن
  status: 'under_action' as const,
}

// بنود المشروع التجريبية
export const mockItems: MockPricingItem[] = [
  {
    id: 'item-001',
    itemNumber: '01.01.01',
    description: 'أعمال الحفر والردم للأساسات',
    unit: 'م³',
    quantity: 2500,
    isPriced: true,
    unitPrice: 85,
    totalPrice: 212500,
  },
  {
    id: 'item-002',
    itemNumber: '01.02.01',
    description: 'صب خرسانة مسلحة للقواعد',
    unit: 'م³',
    quantity: 450,
    isPriced: true,
    unitPrice: 650,
    totalPrice: 292500,
  },
  {
    id: 'item-003',
    itemNumber: '01.02.02',
    description: 'صب خرسانة مسلحة للأعمدة',
    unit: 'م³',
    quantity: 320,
    isPriced: false,
  },
  {
    id: 'item-004',
    itemNumber: '01.02.03',
    description: 'صب خرسانة مسلحة للميد',
    unit: 'م³',
    quantity: 180,
    isPriced: false,
  },
  {
    id: 'item-005',
    itemNumber: '01.03.01',
    description: 'أعمال البلوك للجدران الخارجية',
    unit: 'م²',
    quantity: 3200,
    isPriced: false,
  },
  {
    id: 'item-006',
    itemNumber: '01.03.02',
    description: 'أعمال البلوك للجدران الداخلية',
    unit: 'م²',
    quantity: 2800,
    isPriced: false,
  },
  {
    id: 'item-007',
    itemNumber: '02.01.01',
    description: 'أعمال اللياسة الداخلية',
    unit: 'م²',
    quantity: 5600,
    isPriced: false,
  },
  {
    id: 'item-008',
    itemNumber: '02.01.02',
    description: 'أعمال اللياسة الخارجية',
    unit: 'م²',
    quantity: 3200,
    isPriced: false,
  },
  {
    id: 'item-009',
    itemNumber: '02.02.01',
    description: 'دهان داخلي (بلاستيك)',
    unit: 'م²',
    quantity: 5600,
    isPriced: false,
  },
  {
    id: 'item-010',
    itemNumber: '02.02.02',
    description: 'دهان خارجي (أكريليك)',
    unit: 'م²',
    quantity: 3200,
    isPriced: false,
  },
  {
    id: 'item-011',
    itemNumber: '03.01.01',
    description: 'بلاط سيراميك أرضيات (60×60)',
    unit: 'م²',
    quantity: 4200,
    isPriced: false,
  },
  {
    id: 'item-012',
    itemNumber: '03.01.02',
    description: 'بلاط سيراميك جدران (30×60)',
    unit: 'م²',
    quantity: 1800,
    isPriced: false,
  },
  {
    id: 'item-013',
    itemNumber: '04.01.01',
    description: 'توريد وتركيب أبواب خشبية',
    unit: 'قطعة',
    quantity: 85,
    isPriced: false,
  },
  {
    id: 'item-014',
    itemNumber: '04.01.02',
    description: 'توريد وتركيب شبابيك ألمنيوم',
    unit: 'م²',
    quantity: 420,
    isPriced: false,
  },
  {
    id: 'item-015',
    itemNumber: '05.01.01',
    description: 'أعمال السباكة والصرف الصحي',
    unit: 'نقطة',
    quantity: 240,
    isPriced: false,
  },
  {
    id: 'item-016',
    itemNumber: '05.02.01',
    description: 'أعمال الكهرباء والإنارة',
    unit: 'نقطة',
    quantity: 320,
    isPriced: false,
  },
  {
    id: 'item-017',
    itemNumber: '06.01.01',
    description: 'أعمال التكييف المركزي',
    unit: 'طن',
    quantity: 180,
    isPriced: false,
  },
  {
    id: 'item-018',
    itemNumber: '06.02.01',
    description: 'أعمال التهوية الميكانيكية',
    unit: 'فتحة',
    quantity: 45,
    isPriced: false,
  },
  {
    id: 'item-019',
    itemNumber: '07.01.01',
    description: 'أعمال العزل المائي للأسطح',
    unit: 'م²',
    quantity: 2400,
    isPriced: false,
  },
  {
    id: 'item-020',
    itemNumber: '07.02.01',
    description: 'أعمال العزل الحراري للجدران',
    unit: 'م²',
    quantity: 3200,
    isPriced: false,
  },
]

// بيانات تسعير تجريبية للبند الأول
export const mockPricingDataForItem001: MockPricingData = {
  materials: [
    {
      id: 'mat-001',
      description: 'وقود لمعدات الحفر (ديزل)',
      unit: 'لتر',
      quantity: 850,
      price: 2.5,
      total: 2125,
      wastage: 5,
    },
    {
      id: 'mat-002',
      description: 'مواد ردم (رمل وزلط)',
      unit: 'م³',
      quantity: 120,
      price: 45,
      total: 5400,
      wastage: 10,
    },
  ],
  labor: [
    {
      id: 'lab-001',
      description: 'عامل حفر',
      unit: 'يوم عمل',
      quantity: 180,
      price: 120,
      total: 21600,
    },
    {
      id: 'lab-002',
      description: 'مهندس إشراف',
      unit: 'يوم عمل',
      quantity: 45,
      price: 450,
      total: 20250,
    },
    {
      id: 'lab-003',
      description: 'سائق معدات',
      unit: 'يوم عمل',
      quantity: 60,
      price: 250,
      total: 15000,
    },
  ],
  equipment: [
    {
      id: 'eq-001',
      description: 'حفارة (Excavator 320D)',
      unit: 'ساعة',
      quantity: 240,
      price: 280,
      total: 67200,
      hours: 240,
    },
    {
      id: 'eq-002',
      description: 'قلاب (Dump Truck)',
      unit: 'ساعة',
      quantity: 180,
      price: 150,
      total: 27000,
      hours: 180,
    },
  ],
  subcontractors: [],
  percentages: {
    administrative: 5,
    operational: 5,
    profit: 15,
  },
}

// بيانات تسعير تجريبية للبند الثاني
export const mockPricingDataForItem002: MockPricingData = {
  materials: [
    {
      id: 'mat-003',
      description: 'خرسانة جاهزة (درجة 350)',
      unit: 'م³',
      quantity: 450,
      price: 280,
      total: 126000,
      wastage: 3,
    },
    {
      id: 'mat-004',
      description: 'حديد تسليح (قطر 16-25 مم)',
      unit: 'طن',
      quantity: 45,
      price: 3200,
      total: 144000,
      wastage: 8,
    },
    {
      id: 'mat-005',
      description: 'خشب فرم (لوح 18 مم)',
      unit: 'لوح',
      quantity: 320,
      price: 85,
      total: 27200,
      wastage: 15,
    },
  ],
  labor: [
    {
      id: 'lab-004',
      description: 'نجار مسلح',
      unit: 'يوم عمل',
      quantity: 120,
      price: 180,
      total: 21600,
    },
    {
      id: 'lab-005',
      description: 'حداد',
      unit: 'يوم عمل',
      quantity: 90,
      price: 160,
      total: 14400,
    },
    {
      id: 'lab-006',
      description: 'عامل صب خرسانة',
      unit: 'يوم عمل',
      quantity: 45,
      price: 120,
      total: 5400,
    },
  ],
  equipment: [
    {
      id: 'eq-003',
      description: 'مضخة خرسانة',
      unit: 'ساعة',
      quantity: 24,
      price: 450,
      total: 10800,
      hours: 24,
    },
    {
      id: 'eq-004',
      description: 'هزاز خرسانة',
      unit: 'يوم',
      quantity: 8,
      price: 120,
      total: 960,
      hours: 64,
    },
  ],
  subcontractors: [
    {
      id: 'sub-001',
      description: 'مقاول اختبارات الخرسانة',
      unit: 'عينة',
      quantity: 45,
      price: 180,
      total: 8100,
    },
  ],
  percentages: {
    administrative: 5,
    operational: 5,
    profit: 15,
  },
}

// خريطة البيانات حسب البند
export const mockPricingDataMap: Record<string, MockPricingData> = {
  'item-001': mockPricingDataForItem001,
  'item-002': mockPricingDataForItem002,
}

// قوالب تسعير تجريبية
export const mockTemplates = [
  {
    id: 'template-001',
    name: 'أعمال خرسانية عادية',
    description: 'قالب للأعمال الخرسانية العادية مع النسب القياسية',
    category: 'خرسانة',
    usageCount: 24,
    defaultPercentages: {
      administrative: 5,
      operational: 5,
      profit: 15,
    },
    costBreakdown: {
      materials: 60,
      labor: 25,
      equipment: 10,
      subcontractors: 5,
    },
  },
  {
    id: 'template-002',
    name: 'أعمال التشطيبات',
    description: 'قالب لأعمال التشطيبات والدهانات',
    category: 'تشطيبات',
    usageCount: 18,
    defaultPercentages: {
      administrative: 6,
      operational: 6,
      profit: 18,
    },
    costBreakdown: {
      materials: 45,
      labor: 40,
      equipment: 5,
      subcontractors: 10,
    },
  },
  {
    id: 'template-003',
    name: 'أعمال الحفر والردم',
    description: 'قالب لأعمال الحفر والردم والتسوية',
    category: 'حفريات',
    usageCount: 15,
    defaultPercentages: {
      administrative: 4,
      operational: 4,
      profit: 12,
    },
    costBreakdown: {
      materials: 20,
      labor: 30,
      equipment: 45,
      subcontractors: 5,
    },
  },
  {
    id: 'template-004',
    name: 'أعمال الكهروميكانيك',
    description: 'قالب لأعمال الكهرباء والتكييف',
    category: 'كهروميكانيك',
    usageCount: 12,
    defaultPercentages: {
      administrative: 7,
      operational: 7,
      profit: 20,
    },
    costBreakdown: {
      materials: 50,
      labor: 20,
      equipment: 5,
      subcontractors: 25,
    },
  },
]
