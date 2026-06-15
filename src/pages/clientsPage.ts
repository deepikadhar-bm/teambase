import { Page, expect, Locator } from "@playwright/test";
import { BasePage } from "./basePage";
import { logger } from "@utils/logger";
import * as fs from 'fs';
import * as path from 'path';
import { ClientsLocator } from "../../src/locators/clientsLocator";
import { Runtime } from "@utils/runtimeStore";

const XlsxPopulate = require('xlsx-populate').default || require('xlsx-populate');

export class ClientsPage extends BasePage {
    private clientsLocator: ClientsLocator;
    clientNameText: string = '';
    medicalPolicyNameText: string = '';

    private readonly HEADER_ROW_INDEX = 7;
    private readonly DATA_ROW_INDEX = 8;

    private readonly fieldColumnMapping: Record<string, string> = {
        'Marital Status': 'Marital Status (*)',
        'Nationality': 'Nationality (*)',
        'Employee Number': 'Employee Number (*)',
        'Country of Residence': 'Country of Residence (*)',
        'National ID Number': 'National ID Number (*)',
        'Visa Issuance Location': 'Visa Issuance Location (*)',
        'Work City': 'Work City (*)',
        'Work Area': 'Work Area (*)',
        'Residential City': 'Residential City (*)',
        'Residential Area': 'Residential Area (*)',
        'UID Number': 'UID Number (*)',
        'File Number': 'File Number (*)',
        'Passport Number': 'Passport Number (*)',
        'Phone Number': 'Phone Number (*)',
        'Commission Based': 'Commission Based (*)',
        'Salary Bracket': 'Salary Bracket (*)',
        'Salary Type': 'Salary Type (*)',
        'Salary Currency': 'Salary Currency (*)',
        'Annual Salary': 'Annual Salary (*)',
        'Addition Date': 'Addition Date (*)',
        'Establishment Type': 'Establishment Type (*)',
        'Establishment ID': 'Establishment ID (*)',
        'Member Type': 'Member Type (*)',
        'Relation': 'Relation (*)',
        'Sub-Member Type': 'Sub-Member Type (*)  (HAAD required)',
        'Category': 'Category',
    };

    private readonly defaultFieldValues: Record<string, string> = {
        'Marital Status (*)': 'Single',
        'Nationality (*)': 'United Arab Emirates',
        'Country of Residence (*)': 'United Arab Emirates',
        'Visa Issuance Location (*)': 'Dubai',
        'Work City (*)': 'Dubai',
        'Work Area (*)': 'AL KARAMA',
        'Residential City (*)': 'Dubai',
        'Residential Area (*)': 'AL BARSHA FIRST',
        'Commission Based (*)': 'No',
        'Salary Bracket (*)': 'Between AED 4,001 and 12,000 per month',
        'Salary Type (*)': 'Basic',
        'Salary Currency (*)': 'UAE Dirham (AED)',
        'Addition Date (*)': '11/06/2026',
        'Establishment Type (*)': 'Establishment',
        'Member Type (*)': '4 = Expat who\'s residency is issued in Dubai',
        'Relation (*)': 'Principal',
        'Sub-Member Type (*)  (HAAD required)': 'New Comer',
        'Category': 'Cat A_ MedicalPolicy1_Syslatech_TestClient1'
    };

    constructor(page: Page) {
        super(page);
        this.clientsLocator = new ClientsLocator(page);
    }

    async clickOnClientsMenuInSideBar(): Promise<void> {
        await this.click(this.clientsLocator.Clients);
    }

    async navigateToClientsDetails(): Promise<void> {
        await this.assertElementVisible(this.clientsLocator.ClientsHeading);
        this.clientNameText = (await this.clientsLocator.ClientName.textContent()) ?? '';
        logger.info(`Client Name: ${this.clientNameText}`);
        await this.click(this.clientsLocator.ClientName);
        await this.isVisible(this.clientNameText);
    }

    async clickOnPolicyRenewal(): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.PolicyRenewal);
        await this.click(this.clientsLocator.PolicyRenewal);
        await this.waitForElementIsVisible(this.clientsLocator.MedicalPolicy);
        await this.isVisible(this.clientNameText);
        this.medicalPolicyNameText = (await this.clientsLocator.MedicalPolicy.textContent()) ?? '';
        logger.info(`Client Name: ${this.medicalPolicyNameText}`);
        await this.click(this.clientsLocator.MedicalPolicy);
    }
    async clickAddMembersBulk(): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.ClientName);
        await this.assertElementVisible(this.clientsLocator.ClientName);
        await this.click(this.clientsLocator.AddMembersBulk);
        await this.waitForElementIsVisible(this.clientsLocator.DownloadSampleFile);
    }

    async isNoHRUsersConfiguredVisible(): Promise<boolean> {
        return await this.clientsLocator.NoHRUsersConfiguredPolicy.isVisible();
    }

    async downloadSampleFile(): Promise<string> {
        const downloadDir = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        await this.waitForElementIsVisible(this.clientsLocator.DownloadSampleFile);
        const downloadPromise = this.page.waitForEvent('download');
        await this.click(this.clientsLocator.DownloadSampleFile);
        const download = await downloadPromise;

        const originalName = download.suggestedFilename().replace('.xlsx', '');
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }).replace(/[\/,:\s]/g, '-');
        const fileName = `${originalName}_${timestamp}.xlsx`;
        const filePath = path.join(downloadDir, fileName);

        await download.saveAs(filePath);
        await this.waitForFileExists(filePath);

        logger.info(`Downloaded : ${fileName}`);
        logger.info(`Saved to   : ${filePath}`);
        return filePath;
    }

    private async waitForFileExists(filePath: string, timeoutMs = 10000): Promise<void> {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                logger.info(`File ready : ${filePath} (${fs.statSync(filePath).size} bytes)`);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        throw new Error(`File not ready after ${timeoutMs}ms: ${filePath}`);
    }

    async writeValuesToExcel(filePath: string, rowData: Record<string, string>): Promise<void> {
        try {
            const workbook = await XlsxPopulate.fromFileAsync(filePath);
            const worksheet = workbook.sheet(0);

            const usedRange = worksheet.usedRange();
            if (!usedRange) {
                throw new Error("Could not read data range from sample file");
            }

            const startRow = usedRange.startCell().rowNumber();
            const endRow = usedRange.endCell().rowNumber();
            const startCol = usedRange.startCell().columnNumber();
            const endCol = usedRange.endCell().columnNumber();

            let headerRowNumber = -1;

            for (let r = startRow; r <= endRow; r++) {
                let rowValues: string[] = [];
                for (let c = startCol; c <= endCol; c++) {
                    const val = worksheet.cell(r, c).value();
                    if (val !== undefined && val !== null) {
                        rowValues.push(String(val));
                    }
                }
                const rowStr = rowValues.join(' ');
                if (
                    rowStr.includes('First Name') ||
                    rowStr.includes('BenefitNet ID') ||
                    rowStr.includes('Date Of Birth') ||
                    rowStr.includes('(*)')
                ) {
                    headerRowNumber = r;
                    break;
                }
            }

            if (headerRowNumber === -1) {
                headerRowNumber = this.HEADER_ROW_INDEX;
            }

            const headerMap: Record<string, number> = {};
            for (let c = startCol; c <= endCol; c++) {
                const headerCellVal = worksheet.cell(headerRowNumber, c).value();
                const headerText = headerCellVal ? String(headerCellVal).trim() : '';
                if (headerText) {
                    headerMap[headerText] = c;
                }
            }

            const dataRowNumber = headerRowNumber + 1;

            for (const [columnName, value] of Object.entries(rowData)) {
                let colIndex: number | undefined = headerMap[columnName];

                if (colIndex === undefined) {
                    const normalizedSearch = columnName.trim().replace(/\s+/g, ' ');
                    const match = Object.entries(headerMap).find(
                        ([h]) => h.trim().replace(/\s+/g, ' ') === normalizedSearch
                    );
                    colIndex = match?.[1];
                }

                if (colIndex !== undefined) {
                    worksheet.cell(dataRowNumber, colIndex).value(value);
                    logger.info(`Written: Row ${dataRowNumber}, Col [${colIndex}] | "${columnName}" = "${value}"`);
                }
            }

            await workbook.toFileAsync(filePath);
            const stats = fs.statSync(filePath);
            logger.info(`Excel saved: ${filePath} (${stats.size} bytes)`);

        } catch (error) {
            logger.error(`Error writing Excel: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    async clientCensusExcelFileSelect(filePath: string): Promise<void> {
        await this.clientsLocator.ClientCensusExcelFileUpload.setInputFiles(filePath);
        logger.info(`Uploaded file: ${filePath}`);
    }

    private async selectDropdownOption(trigger: Locator, option: Locator): Promise<string> {
        await this.click(trigger);
        await option.waitFor({ state: 'visible', timeout: 10000 });
        const optionText = (await option.textContent())?.trim() ?? '';
        await this.click(option);
        await option.waitFor({ state: 'hidden', timeout: 10000 });
        logger.info(`Selected: "${optionText}"`);
        return optionText;
    }

    async selectImportType(): Promise<void> {
        await this.selectDropdownOption(this.clientsLocator.ImportTypeDropdown, this.clientsLocator.ImportTypeOption);
    }

    async selectNotifyHR(): Promise<void> {
        await this.selectDropdownOption(this.clientsLocator.NotifyHRDropdown, this.clientsLocator.NotifyHROption);
    }

    async selectDoNotNotifyHRWithOption(): Promise<void> {
        await this.selectDropdownOption(this.clientsLocator.NotifyHRDropdown, this.clientsLocator.DoNotNotifyHROption);
    }

    async selectNotifyMember(): Promise<void> {
        await this.selectDropdownOption(this.clientsLocator.NotifyMemberDropdown, this.clientsLocator.NotifyMemberOption);
    }

    async clickValidateButton(): Promise<void> {
        await this.click(this.clientsLocator.ValidateButton);
        if (await this.assertElementVisible(this.clientsLocator.ProgressBarWindow)) {
            await this.waitForElementToDisappear(this.clientsLocator.ProgressBarWindow);
        }
    }

    async getValidationErrorFields(): Promise<string[]> {
        await this.clientsLocator.ValidationResultsGrid
            .waitFor({ state: 'visible', timeout: 30000 })
            .catch(() => { });
        await this.page.waitForTimeout(2000);

        const errorCells = this.page.locator(
            'tr.k-group-row-validation-type-error td[role="gridcell"]:last-child, ' +
            '#validationResult tr td:last-child, ' +
            '[id="validationResult"] td.k-last'
        );

        const count = await errorCells.count();
        const fieldsNotFilled = new Set<string>();

        for (let i = 0; i < count; i++) {
            const rawText = (await errorCells.nth(i).textContent())?.trim() ?? '';
            logger.info(`Validation error [${i}]: ${rawText}`);

            const segments = rawText.split(';');
            for (const segment of segments) {
                const trimmed = segment.trim();

                const requiredMatch = trimmed.match(/^(.+?)\s+field is required/i);
                if (requiredMatch) {
                    const fieldName = requiredMatch[1].trim();
                    fieldsNotFilled.add(fieldName);
                }

                const invalidMatch = trimmed.match(/^(.+?)\s+(specified is invalid|is invalid)/i);
                if (invalidMatch) {
                    const fieldName = invalidMatch[1].trim();
                    fieldsNotFilled.add(fieldName);
                }
            }
        }

        return Array.from(fieldsNotFilled);
    }

    async clickBackButton(): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.BackButton);
        await this.click(this.clientsLocator.BackButton);
        logger.info('Clicked Back to Import');
    }

    getMissingFieldsData(
        missingFields: string[],
        memberData: Record<string, string>
    ): Record<string, string> {
        const additionalData: Record<string, string> = {};

        for (const displayName of missingFields) {
            const excelColumn = this.fieldColumnMapping[displayName];

            if (excelColumn && memberData[displayName.toLowerCase().replace(/\s+/g, '')]) {
                additionalData[excelColumn] = memberData[displayName.toLowerCase().replace(/\s+/g, '')];
            } else if (excelColumn && this.defaultFieldValues[excelColumn]) {
                additionalData[excelColumn] = this.defaultFieldValues[excelColumn];
            }
        }

        return additionalData;
    }

    async verifyMissingFieldsResolved(previousMissingFields: string[]): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.ValidationResultsGrid);

        const currentErrors = await this.getValidationErrorFields();

        for (const field of previousMissingFields) {
            const stillMissing = currentErrors.some(
                err => err.toLowerCase().includes(field.toLowerCase()) &&
                    err.toLowerCase().includes('field is required')
            );

            expect(stillMissing, `"${field}" still has required error`).toBeFalsy();
        }

        logger.info('All required fields are now resolved');
    }

    async isValidationSuccessful(): Promise<boolean> {
        return await this.clientsLocator.ValidationSuccessful.isVisible().catch(() => false);
    }

    async isValidationFailed(): Promise<boolean> {
        return await this.clientsLocator.ValidationFailed.isVisible().catch(() => false);
    }

    async verifyTheValidationSuccessfulOrFailed(): Promise<void> {
        if (await this.clientsLocator.ValidationSuccessful.isVisible()) {
            await this.clientsLocator.ImportButton.click();
        } else if (await this.clientsLocator.ValidationFailed.isVisible()) {
            await expect(this.clientsLocator.ValidationFailed).toBeVisible();
        }
    }

    async clickImportButton(): Promise<void> {
        await this.assertElementVisible(this.clientsLocator.ValidationSuccessful);
        await this.click(this.clientsLocator.ImportButton);
    }

    async verifyAddMembersProcessing(): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.AddMembersInProgress);
        await this.assertElementVisible(this.clientsLocator.AddMembersInProgress);
        await this.waitForElementIsVisible(this.clientsLocator.AddMembersSuccessful);
        await this.assertElementVisible(this.clientsLocator.AddMembersSuccessful);
    }

    async navigateToEmails(): Promise<void> {
        await this.scrollToElement(this.clientsLocator.EmailsMenu);
        await this.click(this.clientsLocator.EmailsMenu);
        await this.waitForElementIsVisible(this.clientsLocator.EmailLogsMenu);
        await this.assertElementVisible(this.clientsLocator.EmailLogsMenu);
        await this.click(this.clientsLocator.EmailLogsMenu);
        await this.click(this.clientsLocator.EmailSearchButton);
    }

    async verifyEmailSentToTheClient(clientNameText: string, lastName: string, medicalPolicyNameText: string): Promise<void> {
        await this.isVisible(this.clientsLocator.NotificationType);
        await this.isVisible(this.clientsLocator.ClientName);
        await this.isVisible(this.clientsLocator.verifyEmailLogForClientName(clientNameText, lastName));
        await this.isVisible(this.clientsLocator.verifyEmailLogForClientPolicy(medicalPolicyNameText, lastName));
    }

    async clickTheClientEmail(lastName: string): Promise<void> {
        await this.click(this.clientsLocator.clickClientEmailOnNotification(lastName));
    }
    async verifyAddMembersBulkEmailHeading(): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.AddMembersBulkEmailHeading);
        await this.assertElementVisible(this.clientsLocator.AddMembersBulkEmailHeading);
    }

    async verifyEmailLogForSubject(lastName: string,): Promise<void> {
        await this.assertElementVisible(this.clientsLocator.verifyEmailLogForSubject(lastName));
    }

    async verifyEmailLogForCompanyName(clientNameText: string): Promise<void> {
        const clientName = await this.clientsLocator.verifyEmailLogCompanyName(clientNameText).textContent();
        logger.info(`Client Name : ${clientName}`)
        await this.assertElementVisible(this.clientsLocator.verifyEmailLogCompanyName(clientNameText));
    }

    async verifyEmailLogForPolicyName(medicalPolicyNameText: string): Promise<void> {
        const medicalPolicy = await this.clientsLocator.verifyEmailLogPolicyName(medicalPolicyNameText).textContent();
        logger.info(`Medical Policy : ${medicalPolicy}`)
        await this.assertElementVisible(this.clientsLocator.verifyEmailLogPolicyName(medicalPolicyNameText));
    }
}