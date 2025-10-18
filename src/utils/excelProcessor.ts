import ExcelJS from 'exceljs'
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
  'بيان',
]

/**
 * Excel file processor using ExcelJS for better security
 * Replaces the old xlsx library to fix security vulnerabilities
 */
export class ExcelProcessor {
  /**
   * معالجة ملف Excel وإرجاع البيانات
   * Updated to use ExcelJS instead of xlsx
   */
  public static async processExcelFile(file: File): Promise<QuantityItem[]> {
    try {
      console.log('🚀 بدء معالجة ملف Excel:', file.name)
      console.log('📊 حجم الملف:', file.size, 'بايت')

      // Validate file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت')
      }

      // قراءة الملف
      const arrayBuffer = await file.arrayBuffer()
      console.log('✅ تم قراءة الملف بنجاح')

      // تحليل ملف Excel باستخدام ExcelJS
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(arrayBuffer)

      console.log(
        '📋 الأوراق المتاحة:',
        workbook.worksheets.map((ws) => ws.name),
      )

      if (!workbook.worksheets || workbook.worksheets.length === 0) {
        throw new Error('لا توجد أوراق عمل في الملف')
      }

      // أخذ أول ورقة عمل
      const worksheet = workbook.worksheets[0]

      if (!worksheet) {
        throw new Error('فشل في قراءة ورقة العمل')
      }

      console.log('✅ تم تحديد ورقة العمل:', worksheet.name)

      // تحويل إلى مصفوفة من المصفوفات
      const rawData: string[][] = []

      worksheet.eachRow((row, rowNumber) => {
        const rowData: string[] = []
        row.eachCell({ includeEmpty: true }, (cell) => {
          // Convert cell value to string
          let cellValue = ''
          if (cell.value !== null && cell.value !== undefined) {
            if (typeof cell.value === 'object' && 'text' in cell.value) {
              cellValue = String(cell.value.text)
            } else if (typeof cell.value === 'object' && 'result' in cell.value) {
              cellValue = String(cell.value.result)
            } else {
              cellValue = String(cell.value)
            }
          }
          rowData.push(cellValue)
        })
        rawData.push(rowData)
      })

      console.log('🎯 البيانات الخام:', rawData)

      if (!rawData || rawData.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على بيانات')
      }

      // تحليل البيانات وتحويلها لكميات
      const quantities = this.parseDataToQuantities(rawData, worksheet.name)

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
      const hasHeaders =
        firstRow?.some((cell) => {
          const cellStr = cell?.trim().toLowerCase()
          return cellStr ? HEADER_KEYWORDS.some((keyword) => cellStr.includes(keyword)) : false
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
      const cleanRow = row.map((cell) => (cell ?? '').trim())

      // تخطي الصفوف الفارغة تماماً
      if (cleanRow.every((cell) => !cell)) continue

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
        canonicalDescription: descriptionValue || undefined,
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
    return (
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.xlsm') ||
      lowerName.endsWith('.xlsb')
    )
  }

  /**
   * فحص إذا كان الملف نصي (CSV, TSV, TXT)
   */
  public static isTextFile(fileName: string): boolean {
    const lowerName = fileName.toLowerCase()
    return lowerName.endsWith('.csv') || lowerName.endsWith('.tsv') || lowerName.endsWith('.txt')
  }
}
