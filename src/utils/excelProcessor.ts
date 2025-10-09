import * as XLSX from 'xlsx'
import type { QuantityItem } from '../types/contracts'

const HEADER_KEYWORDS = [
  'رقم',
  'وحدة',
  'كمية',
  'مواصفات',
  'serial',
  'unit',
  'quantity',
  'spec',
  'item',
  'description',
  'م',
  'بيان'
]

export class ExcelProcessor {
  /**
   * معالجة ملف Excel وإرجاع البيانات
   */
  public static async processExcelFile(file: File): Promise<QuantityItem[]> {
    try {
      console.log('🚀 بدء معالجة ملف Excel:', file.name)
      console.log('📊 حجم الملف:', file.size, 'بايت')

      // قراءة الملف
      const arrayBuffer = await file.arrayBuffer()
      console.log('✅ تم قراءة الملف بنجاح')

      // تحليل ملف Excel
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        cellText: true,
        cellDates: false,
      })

      console.log('📋 الأوراق المتاحة:', workbook.SheetNames)

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('لا توجد أوراق عمل في الملف')
      }

      // أخذ أول ورقة عمل
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      if (!worksheet) {
        throw new Error('فشل في قراءة ورقة العمل')
      }

      console.log('✅ تم تحديد ورقة العمل:', firstSheetName)

      // تحويل إلى مصفوفة من المصفوفات
      const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
        header: 1,
        blankrows: false,
        defval: '',
        raw: false, // لضمان تحويل كل شيء لنص
      })

      console.log('🎯 البيانات الخام:', rawData)

      if (!rawData || rawData.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على بيانات')
      }

      // تحليل البيانات وتحويلها لكميات
      const quantities = this.parseDataToQuantities(rawData, firstSheetName)

      console.log('🎉 تم استخراج البيانات بنجاح:', quantities.length, 'عنصر')
      return quantities
    } catch (error) {
      console.error('❌ خطأ في معالجة ملف Excel:', error)
      throw error
    }
  }

  /**
   * تحليل البيانات الخام وتحويلها لكميات
   */
  private static parseDataToQuantities(rawData: string[][], sheetName: string): QuantityItem[] {
    const quantities: QuantityItem[] = []
  let startRow = 0

    // التحقق من وجود صف عناوين
    if (rawData.length > 0) {
      const firstRow = rawData[0]
      const hasHeaders = firstRow?.some(cell => {
        const cellStr = cell?.trim().toLowerCase()
        return cellStr ? HEADER_KEYWORDS.some(keyword => cellStr.includes(keyword)) : false
      }) ?? false

      if (hasHeaders) {
        startRow = 1
        console.log('✅ تم اكتشاف صف عناوين:', firstRow)
      }
    }

    // تحويل كل صف إلى عنصر كمية
    for (let i = startRow; i < rawData.length; i++) {
      const row = rawData[i]
      
      if (!row || row.length === 0) continue

      // تنظيف البيانات
      const cleanRow = row.map(cell => (cell ?? '').trim())

      // تخطي الصفوف الفارغة تماماً
      if (cleanRow.every(cell => !cell)) continue

      console.log(`📋 معالجة الصف ${i + 1}:`, cleanRow)

      // إنشاء عنصر كمية جديد
      // محاولة اكتشاف عمود الوصف إن وُجد في أماكن أخرى (بعض الملفات تضع الوصف في العمود 2 أو 4)
      const probableDescription = cleanRow[3] || cleanRow[2] || cleanRow[1] || ''
      const rawSpec = probableDescription || ''
      const descriptionValue = rawSpec.trim()

      const quantity: QuantityItem = {
        id: Date.now() + i + Math.random(),
        serialNumber: cleanRow[0] || `${i}`,
        unit: cleanRow[1] || 'قطعة',
        quantity: cleanRow[2] || '1',
        specifications: probableDescription || cleanRow[1] || 'غير محدد',
        originalDescription: descriptionValue || undefined,
        description: descriptionValue || undefined,
        canonicalDescription: descriptionValue || undefined
      }

      // إضافة فقط إذا كان هناك رقم مسلسل أو مواصفات
      if (quantity.serialNumber && quantity.serialNumber !== `${i}`) {
        quantities.push(quantity)
        console.log(`✅ تم إضافة العنصر ${quantities.length}:`, quantity)
      } else if (quantity.specifications && quantity.specifications !== 'غير محدد') {
        // إضافة حتى لو لم يكن هناك رقم مسلسل ولكن يوجد مواصفات
        quantity.serialNumber = `${quantities.length + 1}`
        quantities.push(quantity)
        console.log(`✅ تم إضافة العنصر ${quantities.length} (بدون رقم مسلسل):`, quantity)
      }
    }

    if (quantities.length === 0) {
      throw new Error(`لم يتم العثور على بيانات صالحة في ورقة العمل: ${sheetName}`)
    }

    return quantities
  }

  /**
   * فحص إذا كان الملف من نوع Excel
   */
  public static isExcelFile(fileName: string): boolean {
    const lowerName = fileName.toLowerCase()
    return lowerName.endsWith('.xlsx') || 
           lowerName.endsWith('.xls') || 
           lowerName.endsWith('.xlsm') ||
           lowerName.endsWith('.xlsb')
  }

  /**
   * فحص إذا كان الملف نصي (CSV, TSV, TXT)
   */
  public static isTextFile(fileName: string): boolean {
    const lowerName = fileName.toLowerCase()
    return lowerName.endsWith('.csv') || 
           lowerName.endsWith('.tsv') || 
           lowerName.endsWith('.txt')
  }
}
