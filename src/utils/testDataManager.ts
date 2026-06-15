/**
 * Test Data Manager - Handles test data loading and management
 */
import * as fs from 'fs';
import * as path from 'path';

export class TestDataManager {
  private dataPath: string;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.dataPath = path.join(process.cwd(), 'test-data');
  }

  /**
   * Load JSON test data file
   */
  loadJSON(filePath: string): any {
    const cacheKey = filePath;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const fullPath = path.join(this.dataPath, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Test data file not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);
    
    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * Load CSV test data
   */
  loadCSV(filePath: string): string[][] {
    const cacheKey = filePath;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const fullPath = path.join(this.dataPath, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Test data file not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const rows = content.split('\n').map(line => line.split(','));
    
    this.cache.set(cacheKey, rows);
    return rows;
  }

  /**
   * Get specific test data by key
   */
  getTestData(dataFile: string, key: string): any {
    const data = this.loadJSON(dataFile);
    return data[key] || null;
  }

  /**
   * Get all test data from file
   */
  getAllTestData(dataFile: string): any {
    return this.loadJSON(dataFile);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const testDataManager = new TestDataManager();
