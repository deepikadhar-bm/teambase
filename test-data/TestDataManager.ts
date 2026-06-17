// ============================================================================
// BenefitNetTestDataManager.ts
// ----------------------------------------------------------------------------
// Manages all test data for the BenefitNet / Teambase Playwright project.
//
// STRUCTURE:
//   benefitnet_test_data.json
//     └── templateName       → "Add Members Bulk"
//     └── company            → "Syslatech_TestClient1"
//     └── policy             → "MedicalPolicy1_Syslatech_TestClient1"
//     └── columns[]          → Full Excel column schema
//     └── testProfiles[]     → Named member data sets used by specs
//     └── defaultFieldValues → Fallback values for Round-2 missing fields
//
// DYNAMIC PLACEHOLDERS (resolved by resolvePlaceholders()):
//   __DYNAMIC__lastName       → real last name picked from gendered name pool
//   __DYNAMIC__dob            → random DOB DD/MM/YYYY (1970–2000)
//   __DYNAMIC__gender         → "Male" or "Female" — auto-detected from lastName pool
//   __DYNAMIC__email          → sysla.{lastName}@yopmail.com (lowercase)
//   __DYNAMIC__additionDate   → today's date in IST (DD/MM/YYYY)
//   __DYNAMIC__employeeNumber → EMP + 6 random digits
//   __DYNAMIC__nationalIdNumber → NID + 9 random digits
//   __POLICY_CATEGORY__       → derived from captured policy name at runtime
// ============================================================================

import * as fs   from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputType = 'text' | 'dropdown' | 'checkbox' | 'formula';

export interface ColumnSchema {
    excelHeader:    string;
    fieldKey:       string;
    mandatory:      boolean;
    inputType:      InputType;
    referenceSheet: string | null;
    allowedValues?: string[];
    notes:          string | null;
}

export interface TestProfile {
    profileName: string;
    description: string;
    memberData:  Record<string, string>;
    notes:       string | null;
}

export interface BenefitNetTemplate {
    templateName:       string;
    company:            string;
    policy:             string;
    createdAt:          string;
    description:        string;
    columns:            ColumnSchema[];
    testProfiles:       TestProfile[];
    defaultFieldValues: Record<string, string>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NameEntry {
    lastName: string;
    gender:   'Male' | 'Female';
}

// ─── Dynamic data generators ──────────────────────────────────────────────────

/**
 * Generates a lastName in the format: TestNNNNN (5 random digits, no underscore)
 * e.g. Test_99574, Test_12308
 * Gender is randomly assigned (Male/Female) each run.
 */
function generateNameAndGender(): NameEntry {
    const digits = Math.floor(Math.random() * 90000) + 10000; // always 5 digits
    const gender = Math.random() < 0.5 ? 'Female' : 'Male';
    return { lastName: `Test${digits}`, gender };
}

/**
 * Generates a random DOB in DD/MM/YYYY format.
 * Year range 1970–2000, day capped at 28 — safe across all months.
 * Randomised every run to prevent BenefitNet duplicate detection
 * (Full Name + DOB + Nationality).
 */
function generateUniqueDOB(): string {
    const year  = Math.floor(Math.random() * (2000 - 1970 + 1)) + 1970;
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day   = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

/**
 * Generates a unique national ID.
 * Format: NID + 9 random digits → e.g. NID784521963
 */
function generateUniqueNationalId(): string {
    const digits = Math.floor(Math.random() * 900_000_000) + 100_000_000; // always 9 digits
    return `NID${digits}`;
}

/**
 * Generates a unique employee number.
 * Format: EMP + 6 random digits → e.g. EMP486240
 */
function generateUniqueEmployeeNumber(): string {
    return `EMP${Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')}`;
}

/**
 * Generates an email in the format: syslatech_hr1_XXX@yopmail.com
 * where XXX is 3 random digits (10–99) — unique enough to distinguish runs.
 * e.g. syslatech_hr1_423@yopmail.com
 */
function generateEmail(_firstName: string, _lastName: string): string {
    const threeDigits = Math.floor(Math.random() * 900) + 100; // always 3 digits
    return `syslatech_hr1_${threeDigits}@yopmail.com`;
}

/**
 * Returns today's date in IST as DD/MM/YYYY.
 * Used for Addition Date — no hardcoding needed.
 */
function getCurrentIndianDate(): string {
    return new Date().toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day:   '2-digit',
        month: '2-digit',
        year:  'numeric',
    });
}

function currentTimestamp(): string {
    return new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12:   false,
        year:     'numeric',
        month:    '2-digit',
        day:      '2-digit',
        hour:     '2-digit',
        minute:   '2-digit',
        second:   '2-digit',
    }) + ' IST';
}

// ─── Runtime data type ────────────────────────────────────────────────────────

export interface RuntimeData {
    firstName:        string;   // always "Sysla" — fixed per client requirement
    lastName:         string;   // real surname + 4-digit suffix, e.g. "Sharma4821"
    gender:           'Male' | 'Female'; // auto-detected from name pool
    email:            string;   // sysla.{lastName}@yopmail.com
    dob:              string;   // DD/MM/YYYY — random, prevents duplicate detection
    additionDate:     string;   // DD/MM/YYYY — today in IST
    employeeNumber:   string;   // EMP + 6 digits
    nationalIdNumber: string;   // NID + 9 digits
    timestamp:        string;   // IST datetime string for logging
}

// ─── Manager class ────────────────────────────────────────────────────────────

class TestDataManagerClass {

    private template: BenefitNetTemplate;

    // Maps validation error display names → JSON fieldKey
    private readonly validationErrorToFieldKey: Record<string, string> = {
        'Marital Status':       'maritalStatus',
        'Nationality':          'nationality',
        'Relation':             'relation',
        'Category':             'category',
        'Sub-Member Type':      'subMemberType',
        'Employee Number':      'employeeNumber',
        'Country of Residence': 'countryOfResidence',
        'National ID Number':   'nationalIdNumber',
        'Visa Issuance Location': 'visaIssuanceLocation',
        'Work City':            'workCity',
        'Work Area':            'workArea',
        'Residential City':     'residentialCity',
        'Residential Area':     'residentialArea',
        'UID Number':           'uidNumber',
        'File Number':          'fileNumber',
        'Passport Number':      'passportNumber',
        'Phone Number':         'phoneNumber',
        'Commission Based':     'commissionBased',
        'Salary Bracket':       'salaryBracket',
        'Salary Type':          'salaryType',
        'Salary Currency':      'salaryCurrency',
        'Annual Salary':        'annualSalary',
        'Addition Date':        'additionDate',
        'Establishment Type':   'establishmentType',
        'Establishment ID':     'establishmentId',
        'Member Type':          'memberType',
    };

    constructor() {
        const candidatePaths = [
            path.resolve(process.cwd(), 'test-data', 'json-files', 'benefitnet_test_data.json'),
        ];

        const filePath = candidatePaths.find(p => fs.existsSync(p));
        if (!filePath) {
            throw new Error(
                `TestDataManager: Cannot locate JSON file.\nTried:\n${candidatePaths.join('\n')}`
            );
        }

        try {
            const raw              = fs.readFileSync(filePath, 'utf-8');
            const parsed: BenefitNetTemplate[] = JSON.parse(raw);
            this.template          = parsed[0];
        } catch (e) {
            throw new Error(`TestDataManager: Cannot load JSON → ${filePath}\n${e}`);
        }
    }

    // ── Template metadata ─────────────────────────────────────────────────────

    getCompany():   string { return this.template.company; }
    getPolicy():    string { return this.template.policy; }
    getCreatedAt(): string { return this.template.createdAt; }

    static buildCreatedAtIST(): string {
        return new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata', hour12: false,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        }) + ' IST';
    }

    // ── Column schema ─────────────────────────────────────────────────────────

    getAllColumns():      ColumnSchema[]            { return this.template.columns; }
    getMandatoryColumns(): ColumnSchema[]           { return this.template.columns.filter(c => c.mandatory); }
    getDropdownColumns(): ColumnSchema[]            { return this.template.columns.filter(c => c.inputType === 'dropdown' && c.allowedValues?.length); }
    getColumn(fieldKey: string): ColumnSchema | undefined { return this.template.columns.find(c => c.fieldKey === fieldKey); }
    getExcelHeader(fieldKey: string): string | undefined  { return this.getColumn(fieldKey)?.excelHeader; }

    // ── Test profiles ─────────────────────────────────────────────────────────

    getProfile(profileName: string): TestProfile {
        const profile = this.template.testProfiles.find(p => p.profileName === profileName);
        if (!profile) {
            throw new Error(
                `BenefitNetTestDataManager: Profile not found → "${profileName}"\n` +
                `Available:\n  ${this.template.testProfiles.map(p => p.profileName).join('\n  ')}`
            );
        }
        return profile;
    }

    listProfileNames(): string[] {
        return this.template.testProfiles.map(p => p.profileName);
    }

    // ── Default field values ──────────────────────────────────────────────────

    getDefaultFieldValues(): Record<string, string> { return this.template.defaultFieldValues; }
    getDefaultValue(fieldKey: string): string | undefined { return this.template.defaultFieldValues[fieldKey]; }

    // ── Dynamic data generation ───────────────────────────────────────────────

    /**
     * Generates a complete set of runtime-unique member values.
     *
     * Every call returns:
     *   - A real Indian last name (randomly male or female)
     *   - Gender auto-detected from the name pool
     *   - Email built from firstName + lastName → sysla.{lastName}@yopmail.com
     *   - Random DOB (1970–2000) — prevents BenefitNet duplicate detection
     *   - Today's IST date as Addition Date
     *   - Unique employee number (EMP + 6 digits)
     *   - Unique national ID (NID + 9 digits)
     *
     * @example
     *   const runtime = tdm.generateRuntimeData();
     *   // runtime.lastName    → "Sharma4821"
     *   // runtime.gender      → "Male"
     *   // runtime.email       → "sysla.sharma4821@yopmail.com"
     *   // runtime.dob         → "14/03/1987"
     *   // runtime.additionDate→ "16/06/2026"
     */
    generateRuntimeData(): RuntimeData {
        const { lastName, gender } = generateNameAndGender();
        const firstName            = 'Sysla'; // fixed per client requirement

        return {
            firstName,
            lastName,
            gender,
            email:            generateEmail(firstName, lastName),
            dob:              generateUniqueDOB(),
            additionDate:     getCurrentIndianDate(),
            employeeNumber:   generateUniqueEmployeeNumber(),
            nationalIdNumber: generateUniqueNationalId(),
            timestamp:        currentTimestamp(),
        };
    }

    /**
     * Generates runtime data locked to a specific gender.
     * Useful for profile-specific tests (User Profile 1 = Female, User Profile 2 = Male).
     *
     * @example
     *   const runtime = tdm.generateRuntimeDataForGender('Female');
     *   // runtime.gender   → "Female"
     *   // runtime.lastName → e.g. "Test42831"
     */
    generateRuntimeDataForGender(gender: 'Male' | 'Female'): RuntimeData {
        const digits   = Math.floor(Math.random() * 90000) + 10000;
        const lastName = `Test${digits}`;
        const firstName = 'Sysla';

        return {
            firstName,
            lastName,
            gender,
            email:            generateEmail(firstName, lastName),
            dob:              generateUniqueDOB(),
            additionDate:     getCurrentIndianDate(),
            employeeNumber:   generateUniqueEmployeeNumber(),
            nationalIdNumber: generateUniqueNationalId(),
            timestamp:        currentTimestamp(),
        };
    }

    // ── Placeholder resolution ────────────────────────────────────────────────

    /**
     * Resolves all __DYNAMIC__* and __POLICY_CATEGORY__ placeholders in a
     * memberData profile using the provided runtime values.
     *
     * Placeholder map:
     *   __DYNAMIC__lastName         → runtime.lastName
     *   __DYNAMIC__dob              → runtime.dob
     *   __DYNAMIC__gender           → runtime.gender
     *   __DYNAMIC__email            → runtime.email
     *   __DYNAMIC__additionDate     → runtime.additionDate
     *   __DYNAMIC__employeeNumber   → runtime.employeeNumber
     *   __DYNAMIC__nationalIdNumber → runtime.nationalIdNumber
     *   __POLICY_CATEGORY__         → policyCategory
     */
    resolvePlaceholders(
        profileData:    Record<string, string>,
        runtimeData:    RuntimeData,
        policyCategory: string = ''
    ): Record<string, string> {
        const resolved: Record<string, string> = {};

        const replacements: Record<string, string> = {
            '__DYNAMIC__firstName':         runtimeData.firstName,
            '__DYNAMIC__lastName':          runtimeData.lastName,
            '__DYNAMIC__gender':            runtimeData.gender,
            '__DYNAMIC__email':             runtimeData.email,
            '__DYNAMIC__dob':               runtimeData.dob,
            '__DYNAMIC__additionDate':      runtimeData.additionDate,
            '__DYNAMIC__employeeNumber':    runtimeData.employeeNumber,
            '__DYNAMIC__nationalIdNumber':  runtimeData.nationalIdNumber,
            '__POLICY_CATEGORY__':          policyCategory,
        };

        for (const [key, value] of Object.entries(profileData)) {
            if (replacements[value] !== undefined) {
                // exact placeholder match (e.g. "__POLICY_CATEGORY__")
                resolved[key] = replacements[value];
            } else if (value.startsWith('__DYNAMIC__')) {
                // field-keyed placeholder e.g. "__DYNAMIC__lastName" stored as value
                resolved[key] = replacements[value] ?? value;
            } else {
                // static value — pass through unchanged
                resolved[key] = value;
            }
        }

        return resolved;
    }

    // ── Excel row building ────────────────────────────────────────────────────

    /**
     * Converts a resolved memberData (fieldKey → value) into an Excel-ready
     * record (excelHeader → value) for writeRowDataToExcelFile().
     * Formula-type columns (e.g. Age) are automatically skipped.
     */
    buildExcelRow(memberData: Record<string, string>): Record<string, string> {
        const excelRow: Record<string, string> = {};

        for (const [fieldKey, value] of Object.entries(memberData)) {
            const col = this.getColumn(fieldKey);
            if (!col)                          continue; // unknown field
            if (col.inputType === 'formula')   continue; // never write formula cells
            if (!value)                        continue; // skip empty
            excelRow[col.excelHeader] = value;
        }

        return excelRow;
    }

    // ── Round-2 missing field resolution ─────────────────────────────────────

    /**
     * Given field display names from getValidationErrorFieldNames()
     * (e.g. ["Marital Status", "Nationality", "Relation", "Category"]),
     * returns an Excel-ready record filled with overrides or JSON defaults.
     */
    resolveMissingFields(
        missingDisplayNames: string[],
        overrides:           Record<string, string> = {},
        policyCategory:      string = ''
    ): Record<string, string> {
        const result: Record<string, string> = {};

        for (const displayName of missingDisplayNames) {
            const fieldKey = this.validationErrorToFieldKey[displayName];
            if (!fieldKey) continue;

            const col = this.getColumn(fieldKey);
            if (!col) continue;

            const value =
                overrides[fieldKey] ??
                (fieldKey === 'category' ? policyCategory : undefined) ??
                this.template.defaultFieldValues[fieldKey] ??
                '';

            if (value) result[col.excelHeader] = value;
        }

        return result;
    }

    // ── Validation helpers ────────────────────────────────────────────────────

    isValidDropdownValue(fieldKey: string, value: string): boolean {
        const col = this.getColumn(fieldKey);
        if (!col || !col.allowedValues) return true;
        return col.allowedValues.includes(value);
    }

    getAllowedValues(fieldKey: string): string[] | undefined {
        return this.getColumn(fieldKey)?.allowedValues;
    }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const testDataManager = new TestDataManagerClass();