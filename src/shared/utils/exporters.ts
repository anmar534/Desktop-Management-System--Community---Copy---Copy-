/**
 * Unified export helpers used across advanced dashboard experiences.
 * Updated to use ExcelJS instead of xlsx for better security.
 */

import { exportToCSV, exportToJSON } from './helpers'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'

export async function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
): Promise<void> {
  await exportToCSV(rows, filename)
}

export async function exportToJson<T>(rows: T[], filename: string): Promise<void> {
  await exportToJSON(rows, filename)
}

/**
 * Export data to Excel file using ExcelJS
 * @param rows - Array of objects to export
 * @param filename - Name of the file to save
 */
export async function exportToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
): Promise<void> {
  if (rows.length === 0) return

  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Data')

  // Get column headers from first row
  const headers = Object.keys(rows[0])
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: 15,
  }))

  // Add rows
  rows.forEach((row) => {
    worksheet.addRow(row)
  })

  // Style the header row
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}
