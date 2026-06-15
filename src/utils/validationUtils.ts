import { Locator, Page, expect } from "@playwright/test";
import { logger } from "./logger";
import { Global_Timeout } from "../config/globalTimeout";

// ============================================================================
// VALIDATION UTILS - WITH SMART LABEL EXTRACTION
// ============================================================================

export class ValidationUtils {

 
  private static label(locator: Locator): string {
    const raw = locator.toString();
    
    const patterns = [
      /normalize-space\(\)="([^"]+)"/,
      /normalize-space\(\)='([^']+)'/,
      /text\(\)="([^"]+)"/,
      /text\(\)='([^']+)'/,
      /contains\([^,]+,\s*["']([^"']+)["']\)/,
      /@aria-label="([^"]+)"/,
      /getByRole\('([^']+)'/,
      /getByText\('([^']+)'/,
      /getByLabel\('([^']+)'/,
    ];

    for (const pattern of patterns) {
      const match = raw.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    const fallbackPatterns = [
      /#(\w+)/,
      /\.([a-zA-Z][\w-]*)/,
      /data-testid="([^"]+)"/,
    ];

    for (const pattern of fallbackPatterns) {
      const match = raw.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    const parts = raw.split("@");
    return parts[1]?.substring(0, 50) || "<element>";
  }

  // ============================================================================
  // IS VISIBLE
  // ============================================================================
  static async isElementVisible(
    locator: Locator, 
    timeout: number = 5000
  ): Promise<boolean> {
    const label = this.label(locator);
    try {
      logger.debug(`Check visible → ${label}`);
      await locator.waitFor({ state: "visible", timeout });
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  // ============================================================================
  // IS ENABLED
  // ============================================================================
  static async isElementEnabled(locator: Locator): Promise<boolean> {
    const label = this.label(locator);
    try {
      logger.debug(`Check enabled → ${label}`);
      return await locator.isEnabled();
    } catch {
      return false;
    }
  }

  // ============================================================================
  // IS CHECKED
  // ============================================================================
  static async isElementChecked(locator: Locator): Promise<boolean> {
    const label = this.label(locator);
    try {
      logger.debug(`Check checked → ${label}`);
      return await locator.isChecked();
    } catch {
      return false;
    }
  }

  // ============================================================================
  // GET TEXT
  // ============================================================================
  static async getElementText(locator: Locator): Promise<string> {
    const label = this.label(locator);
    logger.debug(`GetText → ${label}`);
    return (await locator.textContent())?.trim() || "";
  }

  // ============================================================================
  // GET INPUT VALUE
  // ============================================================================
  static async getInputValue(locator: Locator): Promise<string> {
    const label = this.label(locator);
    logger.debug(`GetInputValue → ${label}`);
    return await locator.inputValue();
  }

  // ============================================================================
  // GET ATTRIBUTE
  // ============================================================================
  static async getElementAttribute(
    locator: Locator, 
    attribute: string
  ): Promise<string | null> {
    const label = this.label(locator);
    logger.debug(`Attribute "${attribute}" → ${label}`);
    return await locator.getAttribute(attribute);
  }

  // ============================================================================
  // COUNT ELEMENTS
  // ============================================================================
  static async countElements(locator: Locator): Promise<number> {
    const label = this.label(locator);
    logger.debug(`Count elements → ${label}`);
    return await locator.count();
  }

  // ============================================================================
  // TEXT CONTAINS
  // ============================================================================
  static async isElementContainsText(
    locator: Locator, 
    text: string | RegExp,
    timeout: number = 5000
  ): Promise<boolean> {
    const label = this.label(locator);
    try {
      logger.debug(`Check text contains "${text}" → ${label}`);
      const content = await locator.textContent();
      if (!content) return false;
      
      if (typeof text === 'string') {
        return content.includes(text);
      }
      return text.test(content);
    } catch {
      return false;
    }
  }

  // ============================================================================
  // HAS TEXT
  // ============================================================================
  static async hasText(
    locator: Locator, 
    text: string | RegExp,
    timeout: number = 5000
  ): Promise<boolean> {
    const label = this.label(locator);
    try {
      logger.debug(`Check has text "${text}" → ${label}`);
      const content = await locator.textContent();
      if (!content) return false;
      
      if (typeof text === 'string') {
        return content.trim() === text;
      }
      return text.test(content);
    } catch {
      return false;
    }
  }
}