// ============================================================================
// API COMMON HELPER
// PURPOSE:
// - Reusable custom utilities for API tests
// - Pretty printing
// - Extracting values
// - Filtering
// - Sorting
// - Validating payload shapes
// ============================================================================

export class APIHelpers {

  // ---------------------------------------------------------
  // Pretty print product list (clean formatted console output)
  // ---------------------------------------------------------
  static prettyPrintProducts(products: any[]) {
    products.forEach((item) => {
      console.log(`ID: ${item.id}`);
      console.log(`Name: ${item.name}`);

      if (!item.data) {
        console.log("Data: null");
      } else {
        console.log("Data:");
        Object.entries(item.data).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }

      console.log("----------------------------------------");
    });
  }

  // ---------------------------------------------------------
  // Extract all names from list
  // ---------------------------------------------------------
  static extractNames(products: any[]): string[] {
    return products.map((p) => p.name);
  }

  // ---------------------------------------------------------
  // Get product by ID
  // ---------------------------------------------------------
  static getById(products: any[], id: string) {
    return products.find((p) => p.id === id);
  }

  // ---------------------------------------------------------
  // Filter by keyword
  // ---------------------------------------------------------
  static filterByKeyword(products: any[], keyword: string) {
    return products.filter((p) =>
      p.name.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}
