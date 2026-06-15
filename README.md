# 🚀 Teambase — Enterprise Playwright Automation Framework

> **A production-grade test automation framework built with Playwright & TypeScript for the Teambase platform, implementing enterprise design patterns and AI-powered self-healing.**

[![Playwright](https://img.shields.io/badge/Playwright-1.60+-45ba4b?logo=playwright)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18+-339933?logo=node.js)](https://nodejs.org/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939?logo=jenkins)](https://www.jenkins.io/)
[![Allure](https://img.shields.io/badge/Reports-Allure-orange)](https://allurereport.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Running Tests](#-running-tests)
- [Test Suites](#-test-suites)
- [Reporting](#-reporting)
- [Framework Components](#-framework-components)
- [Auto-Healing Engine](#-auto-healing-engine)
- [API Testing](#-api-testing)
- [CI/CD Integration](#-cicd-integration)
- [Best Practices](#-best-practices)

---

## 🎯 Overview

This framework automates end-to-end testing of the **Teambase** platform — a benefits management and HR portal — covering login flows, client management, bulk member operations, policy renewals, and email verification workflows.

### What This Framework Automates

- **Authentication**: Login, logout, credential validation for the Teambase portal
- **Client Management**: Client listing, navigation, detail inspection
- **Bulk Member Operations**: Excel-driven census uploads, two-round validation resolution
- **Policy Workflows**: Policy renewal flows, member addition, HR notification handling
- **Email Verification**: Email log inspection and content validation post-member addition
- **API Layer**: Token management, auth services, user services via REST

### What Makes This Enterprise-Grade

✅ **Auto-Healing Engine v4**: Runtime DOM recovery with 10-strategy fallback cascade  
✅ **Design Patterns**: Page Object Model, Factory, Singleton  
✅ **Zod-Validated Config**: Type-safe, schema-enforced environment configuration  
✅ **Multi-Environment**: `dev` and `qa` environments with credential isolation  
✅ **Dual Reporting**: Allure (historical trends + analytics) + Playwright HTML  
✅ **CI/CD Ready**: Full Jenkins pipeline with parallel workers and email notifications  

---

## ✨ Key Features

### 🏗️ Framework Architecture

| Feature | Description | Business Value |
|---------|-------------|----------------|
| **BasePage Pattern** | Centralized UI interactions with built-in error handling | Eliminates code duplication across all page objects |
| **Auto-Heal Engine v4** | 10-strategy DOM recovery (role → label → placeholder → text → CSS → XPath → DOM similarity → relative XPath → position) | Handles dynamic UI changes without test failures |
| **Runtime Store** | In-memory state management across test steps | Enables complex multi-step Teambase workflows |
| **Excel Utilities** | Read/write `.xlsx` files for bulk member census operations | Powers data-driven member import testing |
| **Smart Retry Logic** | Exponential backoff retry for flaky elements | Stable execution against Teambase's dynamic UI |
| **Config Manager** | Zod-validated, environment-specific configuration | Safe, typed deployment across `dev` and `qa` |
| **API Client** | Typed REST client for Teambase API endpoints | Covers auth, user, and service-layer validation |
| **Token Manager** | Automated token acquisition and refresh | Handles Teambase session lifecycle in API tests |

### 🛠️ Advanced Utilities

```typescript
// Runtime Store — share data across test steps
Runtime.set("clientName", "Acme Corp");
const name = Runtime.get("clientName");

// Auto-Healing — recover from DOM changes automatically
const locator = await autoHeal(page, primarySelector, context);

// Excel Operations — bulk member census
await clientDetails.writeValuesToExcel(excelFilePath, memberData);
await clientDetails.clientCensusExcelFileSelect(excelFilePath);

// Smart Waits — handle Teambase's dynamic content
await WaitUtils.waitForElementToBeVisible(page, selector, 30_000);
await RetryUtils.retryAction(() => page.click(selector), 3);

// Validation — built-in assertion helpers
ValidationUtils.isValidEmail("test@teambase.com");
ValidationUtils.isNotEmpty(inputValue);
```

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Test Layer (Specs)                        │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  benefitLogin    │  │  clientDetailsPage               │ │
│  │  .spec.ts        │  │  .spec.ts                        │ │
│  │  (Auth flows)    │  │  (Bulk member / policy workflows)│ │
│  └──────────────────┘  └──────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                 Page Object Layer (POM)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    BasePage                          │   │
│  │  • Safe Actions  • Wait Strategies  • Screenshots   │   │
│  │  • Auto-Heal integration  • Structured Logging      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  LoginPage   │  │  ClientsPage │  │    BasePage      │  │
│  │  (Auth)      │  │  (Members,   │  │  (Shared actions)│  │
│  │              │  │   Policies)  │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                 Services & API Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ authService  │  │ userService  │  │   apiClient      │  │
│  │              │  │              │  │   tokenManager   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Utilities Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │autoHeal  │  │  File    │  │  Wait    │  │  Retry   │   │
│  │Engine v4 │  │  Utils   │  │  Utils   │  │  Utils   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Logger  │  │Validation│  │  Common  │  │  Element │   │
│  │          │  │  Utils   │  │  Utils   │  │  Utils   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│             Configuration & Fixtures                        │
│  • Zod-validated env configs (dev / qa)                     │
│  • Global Setup / Teardown  • Custom Playwright Fixtures    │
│  • API setup  • Browser context management                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
teambase/
│
├── src/
│   ├── pages/                          # Page Object Model
│   │   ├── basePage.ts                 # ⭐ Core framework actions + auto-heal
│   │   ├── loginPage.ts                # Teambase authentication
│   │   └── clientsPage.ts              # Client listing, member bulk ops, policies
│   │
│   ├── locators/                       # Locator definitions (separate from logic)
│   │   ├── loginLocators.ts            # Login page selectors
│   │   └── clientsLocator.ts           # Clients page selectors
│   │
│   ├── services/                       # API service layer
│   │   ├── authService.ts              # Authentication / token services
│   │   └── userService.ts              # User management API calls
│   │
│   ├── clients/
│   │   └── apiClient.ts                # Base HTTP client (typed REST)
│   │
│   ├── utils/                          # ⭐ Enterprise Utilities
│   │   ├── autoHealing.ts              # Auto-Heal Engine v4 (10-strategy)
│   │   ├── runtimeStore.ts             # Global state management
│   │   ├── fileUtils.ts                # File operations (Excel/CSV/JSON)
│   │   ├── elementUtils.ts             # Element interaction helpers
│   │   ├── waitUtils.ts                # Smart waiting strategies
│   │   ├── retryUtils.ts               # Retry mechanisms
│   │   ├── errorHandler.ts             # Centralized error handling
│   │   ├── commonUtils.ts              # Date, number, string utilities
│   │   ├── logger.ts                   # Structured logging
│   │   ├── validationUtils.ts          # Input validation helpers
│   │   ├── schemaValidator.ts          # API response schema validation
│   │   ├── tokenManager.ts             # JWT token lifecycle management
│   │   ├── apiHelpers.ts               # API request helpers
│   │   ├── testData.ts                 # Test data constants
│   │   ├── testDataGenerator.ts        # Dynamic test data generation
│   │   └── testDataManager.ts          # Test data lifecycle manager
│   │
│   ├── fixtures/                       # Test Fixtures
│   │   ├── fixtures.ts                 # Custom Playwright fixtures
│   │   ├── testFixtures.ts             # Extended test fixtures
│   │   ├── globalSetup.ts              # Pre-test configuration
│   │   ├── globalTeardown.ts           # Post-test cleanup
│   │   └── index.ts                    # Fixture barrel export
│   │
│   ├── config/                         # Environment Configuration
│   │   ├── env.dev.ts                  # Development environment settings
│   │   ├── env.qa.ts                   # QA environment settings
│   │   ├── env.schema.ts               # Zod validation schema
│   │   ├── env.index.ts                # ConfigManager singleton
│   │   ├── config.ts                   # API ConfigManager
│   │   ├── types.ts                    # Config type definitions
│   │   └── globalTimeout.ts            # Global timeout settings
│   │
│   ├── setup/
│   │   └── api.setup.ts                # API pre-test setup
│   │
│   └── constant/
│       └── app-constants.ts            # Application-wide constants
│
├── tests/                              # Test Specifications
│   ├── benefitLogin.spec.ts            # Login / authentication tests
│   ├── benefitLoginDataDriven.spec.ts  # Data-driven login scenarios
│   └── clientDetailsPage.spec.ts       # Client details + bulk member workflows
│
├── test-data/                          # Test Data
│   ├── test_data_profiles.json         # Member and user data profiles
│   └── TestDataManager.ts              # Test data manager (legacy)
│
├── downloads/                          # Downloaded files during test runs
├── logs/                               # API and runtime test logs
├── reports/                            # JUnit / custom report outputs
├── allure-results/                     # Allure raw result data
├── allure-report/                      # Generated Allure HTML report
├── playwright-report/                  # Playwright HTML report
├── test-results/                       # Playwright raw test artifacts
│
├── playwright.config.ts                # ⭐ Playwright configuration
├── package.json                        # Dependencies & npm scripts
├── tsconfig.json                       # TypeScript configuration
├── jsconfig.json                       # JS path aliases
├── Jenkinsfile                         # CI/CD pipeline definition
├── verify-framework.sh                 # Framework health-check script
├── GUIDE.md                            # Detailed usage guide
├── .env                                # Environment variables (API layer)
└── README.md                           # This file
```

### 📂 Key Files Explained

| File | Purpose | Why It Matters |
|------|---------|----------------|
| `basePage.ts` | Core framework engine | All reusable actions, auto-heal integration, logging |
| `autoHealing.ts` | Auto-Heal Engine v4 | Recovers from DOM changes using 10 fallback strategies |
| `clientsPage.ts` | Teambase clients POM | Bulk member upload, policy renewal, email verification |
| `loginPage.ts` | Teambase auth POM | Login, error handling, success message validation |
| `env.index.ts` | Config orchestrator | Zod-validated singleton config for `dev` and `qa` |
| `runtimeStore.ts` | Session state manager | Shares data (client name, policy, etc.) across steps |
| `tokenManager.ts` | Token lifecycle | Manages Teambase API auth tokens for API tests |
| `fixtures.ts` | Test lifecycle hooks | Consistent `BasePage` injection for all tests |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher
- **Git**: For version control
- **Allure CLI**: For Allure report generation (optional but recommended)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd teambase

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps

# Verify installation
npx playwright --version

# Run the framework health check
bash verify-framework.sh
```

---

## ⚙️ Environment Configuration

The framework uses a **Zod-validated** `ConfigManager` singleton. Two environments are supported: `dev` and `qa`.

### Environment Selection

Set the environment via the `ENVIRONMENT` variable (defaults to `qa`):

```bash
ENVIRONMENT=dev npx playwright test   # development
ENVIRONMENT=qa  npx playwright test   # QA (default)
```

### `.env` File (API Layer)

The `.env` file controls the API test layer (`src/config/config.ts`):

```env
# ======================================
# API SETTINGS
# ======================================
API_BASE_URL=https://reqres.in/api
API_TIMEOUT=30000
RETRY_ATTEMPTS=3
ENV=local

# OPTIONAL: manual token override
MANUAL_TOKEN=
```

### Environment Config Files

| File | Controls |
|------|----------|
| `src/config/env.dev.ts` | Dev base URL, credentials, timeouts, browser settings |
| `src/config/env.qa.ts` | QA base URL, credentials, timeouts, browser settings |
| `src/config/env.schema.ts` | Zod schema that validates all config at startup |
| `src/config/types.ts` | TypeScript types: `AppConfig`, `Environment`, `TimeoutKeys` |

### Overriding via Environment Variables

Any config value can be overridden at runtime:

```bash
BASE_URL=https://staging.teambase.com \
PLAYWRIGHT_USERNAME=admin@teambase.com \
PLAYWRIGHT_PASSWORD=secret \
TIMEOUT_ACTION=20000 \
npx playwright test
```

### Config Usage in Tests

```typescript
import { qaConfig } from 'src/config/env.qa';

await loginPage.navigateToLogin(qaConfig.baseURL);
await loginPage.login(qaConfig.credentials.username, qaConfig.credentials.password);
```

Or use the singleton manager:

```typescript
import { configManager } from 'src/config/env.index';

const baseURL    = configManager.getBaseURL();
const credentials = configManager.getCredentials();
const timeout    = configManager.getTimeout('action');
```

---

## 🧪 Running Tests

### NPM Scripts

```bash
# Run all tests (QA environment, headless)
npm test

# Run in dev environment, headed (browser visible)
npm run test:dev

# Run in QA environment
npm run test:qa

# Run in headed mode
npm run test:headed

# Run in debug mode
npm run test:debug

# Run on Chromium only
npm run test:chrome

# Run with 4 parallel workers
npm run test:parallel

# Open Playwright HTML report
npm run test:report

# Open Playwright UI mode
npm run test:ui-mode
```

### Direct Playwright Commands

```bash
# Run a specific spec file
npx playwright test tests/clientDetailsPage.spec.ts

# Run by test name
npx playwright test -g "Add Members Bulk"

# Run with retries
npx playwright test --retries=2

# Run only failed tests from last run
npx playwright test --last-failed

# Run in CI mode (headless, 3 workers)
CI=true npx playwright test
```

### Test Filtering

```bash
# Run smoke tests
npx playwright test --grep @smoke

# Exclude slow tests
npx playwright test --grep-invert @slow
```

---

## 📂 Test Suites

### `benefitLogin.spec.ts` — Authentication

Tests the Teambase login page:

| Test | Description |
|------|-------------|
| Should login successfully with valid credentials | Validates successful login and welcome message |
| Should show error for invalid credentials | Validates wrong-password error message |
| Should show validation for empty fields | Validates empty username and password error messages |

### `benefitLoginDataDriven.spec.ts` — Data-Driven Auth

Runs login scenarios against multiple credential profiles from test data files.

### `clientDetailsPage.spec.ts` — Client Details & Bulk Member Workflows

| Test | Description |
|------|-------------|
| Add Members Bulk — Validate pending columns then resolve | Two-round Excel census upload: discovers missing fields in round 1, fills them in round 2, verifies validation success, member processing, and email delivery |

**Bulk Member Upload Flow:**

```
Login → Navigate to Clients → Select Client → Click Policy Renewal
  → Add Members Bulk → Download Sample Excel
  → [Round 1] Fill partial data → Validate → Capture missing fields
  → [Round 2] Fill all fields → Validate → Verify success
  → Verify member processing → Navigate to Emails
  → Verify email sent → Inspect email log
```

---

## 📊 Reporting

### Allure Reports (Recommended)

```bash
# Step 1: Run tests
npx playwright test

# Step 2: Generate Allure report
allure generate allure-results --clean -o allure-report

# Step 3: Open in browser
allure open allure-report
```

Allure features used in this project:

- ✅ Test execution timeline
- ✅ Failure categorization (with category definitions in `allure-report/data/categories.json`)
- ✅ Screenshots and videos on failure
- ✅ Historical trends (stored in `allure-report/history/`)
- ✅ Severity and suite breakdowns
- ✅ Step-by-step execution logs

### Playwright HTML Report

```bash
npx playwright show-report
# or
npm run test:report
```

### Report Artifacts

| Artifact | Location | Contents |
|----------|----------|----------|
| Playwright HTML | `playwright-report/` | Interactive test report with traces, videos, screenshots |
| Allure HTML | `allure-report/` | Historical trends, categorized failures, analytics |
| Allure Raw | `allure-results/` | Raw JSON result data for Allure generation |
| Test artifacts | `test-results/` | Per-test screenshots, videos, trace `.zip` files |
| Logs | `logs/` | API test logs with timestamps (`api-test-YYYY-MM-DD.log`) |

---

## 🧩 Framework Components

### 1️⃣ BasePage — The Framework Engine

`src/pages/basePage.ts` is the foundation of all page objects in this project. It provides safe, logged, auto-healing wrappers around every Playwright interaction:

```typescript
export class BasePage {
  async safeClick(selector: string, timeout?: number): Promise<void>
  async smartType(selector: string, text: string): Promise<void>
  async waitForElement(selector: string, state?: 'visible' | 'hidden'): Promise<void>
  async selectDropdown(selector: string, value: string): Promise<void>
  async captureScreenshot(name: string): Promise<void>
  async navigateAndWait(url: string): Promise<void>
}
```

Every action automatically logs, retries on failure, captures a screenshot on error, and integrates with the Auto-Heal Engine.

### 2️⃣ Auto-Heal Engine v4

`src/utils/autoHealing.ts` — the most advanced component in this framework. When a primary selector fails to locate an element, it cascades through 10 recovery strategies:

```
Primary selector
  → getByRole (ARIA role + accessible name)
    → getByLabel (form labels)
      → getByPlaceholder (input placeholders)
        → getByText (visible text)
          → CSS selector
            → XPath
              → DOM similarity scoring
                → Relative XPath (sibling/parent traversal)
                  → Position-based fallback
                    → Fail with full diagnostics
```

Each strategy returns a `HealResult` with a `confidence` score. If multiple elements match, `.first()` is used. Healing events are logged with context:

```typescript
export interface HealContext {
  testName:  string;
  testFile:  string;
  pomMethod: string;
  pageUrl:   string;
  pomFile?:  string;
  pomLine?:  number;
}
```

### 3️⃣ ClientsPage — Teambase-Specific POM

`src/pages/clientsPage.ts` encapsulates all Teambase client operations:

```typescript
await clientDetails.clickOnClientsMenuInSideBar();
await clientDetails.navigateToClientsDetails();
await clientDetails.clickOnPolicyRenewal();
await clientDetails.clickAddMembersBulk();

// Excel-based member upload
const excelPath = await clientDetails.downloadSampleFile();
await clientDetails.writeValuesToExcel(excelPath, memberData);
await clientDetails.clientCensusExcelFileSelect(excelPath);
await clientDetails.clickValidateButton();

// Validation error handling
const missingFields = await clientDetails.getValidationErrorFields();
const filledData = clientDetails.getMissingFieldsData(missingFields, baseProfile);

// Email verification
await clientDetails.navigateToEmails();
await clientDetails.verifyEmailSentToTheClient(clientName, policyName, lastName);
await clientDetails.verifyEmailLogForSubject(lastName);
```

### 4️⃣ Runtime Store — State Management

Share data across steps without global variables:

```typescript
Runtime.set("clientName", "Acme Corp");
Runtime.set("policyName", "Medical 2026");

const client = Runtime.get("clientName");
Runtime.clear("clientName");
const all = Runtime.getAll();
```

### 5️⃣ ConfigManager — Zod-Validated Configuration

`src/config/env.index.ts` validates all config at startup using Zod schemas:

```typescript
const configManager = new ConfigManager(); // validates on construction
// Throws if any field is missing, wrong type, or invalid URL

configManager.getEnvironment();     // 'dev' | 'qa'
configManager.getBaseURL();         // validated URL string
configManager.getCredentials();     // { username, password }
configManager.getBrowserConfig();   // { headless, slowMo, timeout }
configManager.getTimeout('action'); // number (ms)
configManager.getAPIBaseURL();      // optional API URL
```

### 6️⃣ API Client & Services

`src/clients/apiClient.ts` provides a typed REST client used by the service layer:

```typescript
// Auth service
const token = await authService.getToken(username, password);

// User service
const users = await userService.getUsers();
const user  = await userService.getUserById(id);

// Token manager
const activeToken = await tokenManager.getValidToken();
```

### 7️⃣ Custom Fixtures

`src/fixtures/fixtures.ts` injects `BasePage` into every test:

```typescript
import { test, expect } from '../src/fixtures/fixtures';

// BasePage is available automatically
test('example', async ({ page, basePage }) => {
  await basePage.navigateAndWait('/clients');
  await basePage.safeClick('#add-member-btn');
});
```

---

## 🔩 Auto-Healing Engine

The Auto-Heal Engine is purpose-built for applications like Teambase where DOM attributes may change between releases. It prevents test failures caused by locator drift:

```
Scenario: A button's data-testid changes from "validate-btn" to "validate-button"

Without auto-heal: Test fails immediately.
With auto-heal:   Engine tries getByRole('button', { name: 'Validate' }) → finds it
                  Logs: "Healed via getByRole | confidence: 0.95"
                  Test continues.
```

Healing context is logged per attempt, giving you a clear trail for locator maintenance:

```
[AUTO-HEAL] clientDetailsPage.spec.ts > Add Members Bulk
  pomMethod: clickValidateButton
  pageUrl:   https://qa.teambase.com/clients/123/bulk-add
  strategy:  getByRole → SUCCESS (confidence: 0.92)
```

---

## 🔌 API Testing

API tests run against the Teambase API (and supporting services) using the config from `.env`:

```bash
# Run all API tests
npm run test:api

# Run API setup
npx playwright test src/setup/api.setup.ts
```

The API layer uses:

- `apiClient.ts` — base HTTP client with timeout and retry
- `authService.ts` — token acquisition and refresh
- `userService.ts` — user CRUD operations
- `tokenManager.ts` — caches and reuses valid tokens
- `schemaValidator.ts` — validates API response shapes
- `logger.ts` — writes timestamped logs to `logs/api-test-YYYY-MM-DD.log`

---

## 🔄 CI/CD Integration

### Jenkins Pipeline (`Jenkinsfile`)

Stages:

```
Checkout Code
  → Install Dependencies (npm ci)
    → Install Playwright Browsers
      → Run Tests (3 workers, CI=true)
        → Generate Reports (Allure + Playwright HTML)
          → Archive Artifacts
            → Send Email Notification
```

### CI Playwright Config Differences

In CI (`CI=true`):

| Setting | Local | CI |
|---------|-------|----|
| `headless` | from config | always `true` |
| `workers` | 4 | 3 |
| `launchOptions` | `--start-maximized` | `--no-sandbox` |
| Reporter | HTML + Allure | HTML + Allure |

### Email Notifications

**Success:**
```
Subject: Playwright CI — SUCCESS ✔ (48/50)

Test Summary:
- Total:  50
- Passed: 48
- Failed:  2
```

**Failure:**
```
Subject: Playwright CI — FAILED ❌ (5 failed)

Test Summary:
- Total:  50
- Passed: 45
- Failed:  5

Check Allure & Playwright reports for details.
```

---

## 📚 Best Practices

### Test Data Generation

Tests generate unique data at runtime to avoid conflicts:

```typescript
function generateUniqueEmail(): string {
  return `sysla.test.${Math.floor(Math.random() * 1_000_000)}@test.com`;
}

function generateUniqueEmployeeNumber(): string {
  return `EMP${Math.floor(Math.random() * 1_000_000)}`;
}
```

### Two-Round Validation Pattern

The bulk member upload uses a resilient two-round approach:

```typescript
// Round 1: submit partial data, capture which fields are missing
const missingFields = await clientDetails.getValidationErrorFields();

// Round 2: fill exactly what's missing, resubmit
const additionalData = clientDetails.getMissingFieldsData(missingFields, baseProfile);
await clientDetails.writeValuesToExcel(excelFilePathRound2, { ...round1Data, ...additionalData });
```

This mirrors real-world usage and makes tests resilient to policy-specific field requirements that vary by client.

### Error Handling

```typescript
async safeClick(selector: string): Promise<void> {
  try {
    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.click(selector);
    logger.info(`Clicked: ${selector}`);
  } catch (error) {
    logger.error(`Failed to click: ${selector}`, error);
    await this.captureScreenshot(`error-${Date.now()}`);
    throw error;
  }
}
```

### Structured Logging

```typescript
import { logger } from 'src/utils/logger';

logger.info('── ROUND 1: Partial fill → discover missing fields ──');
logger.info(`Round 1 - Missing fields (${count}): ${fields.join(', ')}`);
logger.warn('No HR users configured for this policy');
logger.error('Validation failed after round 2', error);
```

### Locator Separation

Locators live in `src/locators/`, separate from page action logic in `src/pages/`. This makes both easier to maintain:

```typescript
// src/locators/clientsLocator.ts
export const ClientsLocator = {
  DownloadSampleFile: '[data-testid="download-sample"]',
  ValidateButton:     '[data-testid="validate-btn"]',
  // ...
};

// src/pages/clientsPage.ts
import { ClientsLocator } from '../locators/clientsLocator';
await this.safeClick(ClientsLocator.ValidateButton);
```