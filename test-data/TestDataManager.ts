// testdata/TestDataManager.ts
import * as fs from 'fs';
import * as path from 'path';

export interface TestDataProfile {
  id: number;
  testDataName: string;
  data: Record<string, string>[] | null;
  columns: string[];
}

class TestDataManager {
  private profiles: TestDataProfile[] = [];

  constructor() {
    try {
      // Adjust path if your JSON is in a different folder
      const filePath = path.resolve(process.cwd(), 'testdata/test_data_profiles.json');
      const rawData = fs.readFileSync(filePath, 'utf-8');
      this.profiles = JSON.parse(rawData);
    } catch (e) {
      console.error("TestDataManager: Could not load JSON file", e);
    }
  }

  public getProfileByName(name: string) {
    return this.profiles.find(p => p.testDataName === name);
  }

  public createRecord(profileName: string, row: string[]): Record<string, string> {
    const profile = this.getProfileByName(profileName);
    if (!profile) return {};

    const record: Record<string, string> = {};
    profile.columns.forEach((col, index) => {
      record[col] = row[index];
    });
    return record;
  }

  // ADD THIS — Search all profiles for a row matching key=value
  public findRowByKey(key: string, value: string): Record<string, string> | undefined {
    for (const profile of this.profiles) {
      const match = profile.data?.find(
        row => row[key]?.toLowerCase() === value?.toLowerCase()
      );
      if (match) return match;
    }
    return undefined;
  }

}

export const testDataManager = new TestDataManager();