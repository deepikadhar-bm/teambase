// ============================================================================
// FILE UTILS - ENTERPRISE VERSION (ExcelJS Edition)
// ----------------------------------------------------------------------------
// SAFE → No XLSX vulnerabilities
// Supports:
//   ✔ CSV
//   ✔ Excel (.xlsx) with ExcelJS
//   ✔ JSON
//   ✔ Text files
//   ✔ Latest downloaded file
//   ✔ Auto Excel generator per test
// ============================================================================

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import * as fse from "fs-extra";
import ExcelJS from "exceljs";

export class FileUtils {

  // ========================================================================
  // FILE EXISTS
  // ========================================================================
  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  // ========================================================================
  // READ CSV
  // ========================================================================
  static readCSV(filePath: string): any[] {
    if (!this.fileExists(filePath))
      throw new Error(`CSV file not found → ${filePath}`);

    const content = fs.readFileSync(filePath, "utf-8");

    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  // ========================================================================
  // READ EXCEL using ExcelJS
  // ========================================================================
  static async readExcel(filePath: string, sheetName?: string): Promise<any[]> {
    if (!this.fileExists(filePath))
      throw new Error(`Excel file not found → ${filePath}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet =
      sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];

    if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

    const rows: any[] = [];

    sheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // skip header

      const rowData: any = {};
      row.eachCell((cell, colIndex) => {
        const header = sheet.getRow(1).getCell(colIndex).value;
        rowData[header as string] = cell.value;
      });

      rows.push(rowData);
    });

    return rows;
  }

  // ========================================================================
  // READ JSON
  // ========================================================================
  static readJSON(filePath: string) {
    if (!this.fileExists(filePath))
      throw new Error(`JSON file not found → ${filePath}`);

    return fse.readJSONSync(filePath);
  }

  // ========================================================================
  // READ TEXT
  // ========================================================================
  static readText(filePath: string): string {
    if (!this.fileExists(filePath))
      throw new Error(`Text file not found → ${filePath}`);

    return fs.readFileSync(filePath, "utf-8");
  }

  // ========================================================================
  // WRITE CSV
  // ========================================================================
  static writeCSV(filePath: string, data: any[]): void {
    const header = Object.keys(data[0]).join(",") + "\n";
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");

    fs.writeFileSync(filePath, header + rows);
  }

  // ========================================================================
  // WRITE EXCEL using ExcelJS
  // ========================================================================
  static async writeExcel(
    filePath: string,
    data: any[],
    sheetName = "Sheet1"
  ) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    // Header
    sheet.columns = Object.keys(data[0]).map((key) => ({ header: key, key }));

    // Rows
    data.forEach((row) => sheet.addRow(row));

    await workbook.xlsx.writeFile(filePath);
  }

  // ========================================================================
  // WRITE TEXT
  // ========================================================================
  static writeText(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, "utf-8");
  }

  // ========================================================================
  // GET LATEST FILE
  // ========================================================================
  static getLatestFile(directoryPath: string): string {
    const files = fs.readdirSync(directoryPath);

    if (files.length === 0)
      throw new Error("No files found in directory.");

    const sorted = files
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(directoryPath, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    return path.join(directoryPath, sorted[0].name);
  }

  // ========================================================================
  // AUTO-GENERATE EXCEL (test name + timestamp)
  // ========================================================================
  static async writeExcelAuto(
    testInfo: any,
    data: any[],
    folder = "test-results/excel"
  ) {
    const testName = testInfo.title.replace(/\s+/g, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const fileName = `Excel_${testName}_${timestamp}.xlsx`;

    const dir = path.join(process.cwd(), folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fullPath = path.join(dir, fileName);

    await this.writeExcel(fullPath, data);

    console.log(`📁 Excel saved → ${fullPath}`);

    return fullPath;
  }
}
