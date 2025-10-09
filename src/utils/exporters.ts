/**
 * Unified export helpers used across advanced dashboard experiences.
 */

import { exportToCSV, exportToJSON } from './helpers';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export async function exportToCsv<T extends Record<string, unknown>>(rows: T[], filename: string): Promise<void> {
  await exportToCSV(rows, filename);
}

export async function exportToJson<T>(rows: T[], filename: string): Promise<void> {
  await exportToJSON(rows, filename);
}

export async function exportToXlsx<T extends Record<string, unknown>>(rows: T[], filename: string): Promise<void> {
  if (rows.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
