import { test, expect, Locator } from '@playwright/test';
import { BasePage } from 'src/pages/basePage';
import { LoginPage } from 'src/modules-methods/loginPage';
import { ClientsLocator } from 'src/pages/elements/clientsLocator';
import { EmailLogLocators } from 'src/pages/elements/emailLogLocators';
import { ReportsLocators } from 'src/pages/elements/reportsLocator';
import { qaConfig } from 'src/config/env.qa';
import { logger as log } from 'src/helpers/logger';
import { testDataManager as tdm } from 'test-data/testDataManager';
import * as fs from 'fs';
import * as path from 'path';
import { APP_CONSTANTS } from 'src/constant/app-constants';

const XlsxPopulate = require('xlsx-populate').default || require('xlsx-populate');

// Clients Module
class ClientsPage extends BasePage {

    private readonly clientsLocator: ClientsLocator;

    capturedClientName: string = '';
    capturedMedicalPolicyName: string = '';

    private readonly FALLBACK_HEADER_ROW_INDEX = APP_CONSTANTS.FALLBACK_HEADER_ROW_INDEX;
    private readonly HEADER_DETECTION_KEYWORDS = APP_CONSTANTS.HEADER_DETECTION_KEYWORDS;

    constructor(page: any) {
        super(page);
        this.clientsLocator = new ClientsLocator(page);
    }

    async navigateToClientsViasidebar(): Promise<void> {
        await this.click(this.clientsLocator.sidebarClientsMenu);
    }

    async openTargetClientDetails(): Promise<void> {
        await this.assertElementVisible(this.clientsLocator.clientsHeadingText);
        this.capturedClientName = (await this.clientsLocator.targetClientNameLink.textContent()) ?? '';
        log.info(`Client Name captured: ${this.capturedClientName}`);
        await this.click(this.clientsLocator.targetClientNameLink);
        await this.isVisible(this.capturedClientName);
    }

    async openPolicyTab(clientName: string): Promise<void> {
        await this.assertElementVisible(this.clientsLocator.clientNameLabel(clientName));
        await this.waitForElementIsVisible(this.clientsLocator.policiesLabel);
        await this.click(this.clientsLocator.policiesLabel);
        await this.waitForElementIsVisible(this.clientsLocator.targetMedicalPolicyLink);
        this.capturedMedicalPolicyName = (await this.clientsLocator.targetMedicalPolicyLink.textContent()) ?? '';
        log.info(`Medical Policy captured: ${this.capturedMedicalPolicyName}`);
        await this.click(this.clientsLocator.targetMedicalPolicyLink);
    }

    async openAddMembersBulkForm(): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.targetClientNameLink);
        await this.assertElementVisible(this.clientsLocator.targetClientNameLink);
        await this.click(this.clientsLocator.addMembersBulkButton);
        await this.waitForElementIsVisible(this.clientsLocator.downloadSampleFileLink);
    }

    async downloadCensusSampleFile(): Promise<string> {
        const downloadDirectory = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(downloadDirectory)) fs.mkdirSync(downloadDirectory, { recursive: true });

        await this.waitForElementIsVisible(this.clientsLocator.downloadSampleFileLink);
        const downloadEventPromise = this.page.waitForEvent('download');
        await this.click(this.clientsLocator.downloadSampleFileLink);
        const downloadedFile = await downloadEventPromise;

        const baseFileName = downloadedFile.suggestedFilename().replace('.xlsx', '');
        const timestampSuffix = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }).replace(/[\/,:\s]/g, '-');
        const uniqueFileName = `${baseFileName}_${timestampSuffix}.xlsx`;
        const savedFilePath = path.join(downloadDirectory, uniqueFileName);

        await downloadedFile.saveAs(savedFilePath);
        await this.waitUntilFileIsReady(savedFilePath);

        log.info(`Downloaded : ${uniqueFileName}`);
        log.info(`Saved to   : ${savedFilePath}`);
        return savedFilePath;
    }

    async uploadCensusExcelFile(filePath: string): Promise<void> {
        await this.clientsLocator.censusExcelFileInput.setInputFiles(filePath);
        log.info(`Census file uploaded: ${filePath}`);
    }

    async selectImportTypeOption(): Promise<void> {
        await this.selectDropdownOption(this.clientsLocator.importTypeDropdown, this.clientsLocator.importTypeShowPendingAndEmailInsurerOption);
    }

    async selectNotifyHrOption(): Promise<void> {
        await this.selectDropdownOption(this.clientsLocator.notifyHrDropdown, this.clientsLocator.notifyHrOption);
    }

    async selectDoNotNotifyHrOption(): Promise<void> {
        await this.selectDropdownOption(this.clientsLocator.notifyHrDropdown, this.clientsLocator.doNotNotifyHrOption);
    }

    async selectNotifyMemberOption(): Promise<void> {
        await this.selectDropdownOption(this.clientsLocator.notifyMemberDropdown, this.clientsLocator.notifyMemberOption);
    }

    async clickValidateImportButton(): Promise<void> {
        await this.click(this.clientsLocator.validateImportButton);
        if (await this.assertElementVisible(this.clientsLocator.importProgressBarModal)) {
            await this.waitForElementToDisappear(this.clientsLocator.importProgressBarModal);
        }
    }

    async clickBackToImportLink(): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.backToImportLink);
        await this.click(this.clientsLocator.backToImportLink);
    }

    async clickImportMembersButton(): Promise<void> {
        await this.assertElementVisible(this.clientsLocator.validationSuccessBanner);
        await this.click(this.clientsLocator.importMembersButton);
    }

    async isNoHrUsersConfiguredWarningDisplayed(): Promise<boolean> {
        return await this.clientsLocator.noHrUsersConfiguredWarning.isVisible();
    }

    async isValidationSuccessful(): Promise<boolean> {
        return await this.clientsLocator.validationSuccessBanner.isVisible().catch(() => false);
    }

    async isValidationFailed(): Promise<boolean> {
        return await this.clientsLocator.validationFailedBanner.isVisible().catch(() => false);
    }

    async getValidationErrorFieldNames(): Promise<string[]> {
        await this.clientsLocator.validationResultsGrid.waitFor({ state: 'visible', timeout: 30000 }).catch(() => { });
        await this.page.waitForTimeout(2000);

        const errorCells = this.clientsLocator.errorAndWarningCells;
        const totalCells = await errorCells.count();
        const uniqueErrorFields = new Set<string>();

        for (let i = 0; i < totalCells; i++) {
            const rawText = (await errorCells.nth(i).textContent())?.trim() ?? '';
            log.info(`Validation error cell [${i}]: ${rawText}`);
            for (const segment of rawText.split(';')) {
                const trimmed = segment.trim();
                const requiredMatch = trimmed.match(/^(.+?)\s+field is required/i);
                if (requiredMatch) uniqueErrorFields.add(requiredMatch[1].trim());
                const invalidMatch = trimmed.match(/^(.+?)\s+(specified is invalid|is invalid)/i);
                if (invalidMatch) uniqueErrorFields.add(invalidMatch[1].trim());
            }
        }

        return Array.from(uniqueErrorFields);
    }

    async assertPreviousValidationErrorsAreResolved(previouslyFailedFields: string[]): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.validationResultsGrid);
        const remainingErrors = await this.getValidationErrorFieldNames();
        for (const fieldName of previouslyFailedFields) {
            const isStillFailing = remainingErrors.some(
                err => err.toLowerCase().includes(fieldName.toLowerCase()) && err.toLowerCase().includes('field is required')
            );
            expect(isStillFailing, `Field "${fieldName}" still has a required validation error`).toBeFalsy();
        }
        log.info('All previously failing required fields are now resolved');
    }

    async handleValidationOutcomeAndProceedToImport(): Promise<void> {
        if (await this.clientsLocator.validationSuccessBanner.isVisible()) {
            await this.clientsLocator.importMembersButton.click();
        } else if (await this.clientsLocator.validationFailedBanner.isVisible()) {
            await expect(this.clientsLocator.validationFailedBanner).toBeVisible();
        }
    }

    async writeRowDataToExcelFile(filePath: string, columnValueMap: Record<string, string>): Promise<void> {
        try {
            const workbook = await XlsxPopulate.fromFileAsync(filePath);
            const worksheet = workbook.sheet(0);
            const usedRange = worksheet.usedRange();
            if (!usedRange) throw new Error('Could not determine used range in census Excel file');

            const rangeStartRow = usedRange.startCell().rowNumber();
            const rangeEndRow = usedRange.endCell().rowNumber();
            const rangeStartCol = usedRange.startCell().columnNumber();
            const rangeEndCol = usedRange.endCell().columnNumber();

            let headerRowNumber = -1;
            for (let r = rangeStartRow; r <= rangeEndRow; r++) {
                const rowText = Array.from({ length: rangeEndCol - rangeStartCol + 1 }, (_, i) => {
                    const v = worksheet.cell(r, rangeStartCol + i).value();
                    return v != null ? String(v) : '';
                }).join(' ');
                const isHeader = this.HEADER_DETECTION_KEYWORDS.some(kw => rowText.includes(kw));
                if (isHeader) { headerRowNumber = r; break; }
            }

            if (headerRowNumber === -1) headerRowNumber = this.FALLBACK_HEADER_ROW_INDEX;

            const headerToColIndex: Record<string, number> = {};
            for (let c = rangeStartCol; c <= rangeEndCol; c++) {
                const raw = worksheet.cell(headerRowNumber, c).value();
                const txt = raw ? String(raw).trim() : '';
                if (txt) headerToColIndex[txt] = c;
            }

            const dataRowNumber = headerRowNumber + 1;
            for (const [colName, value] of Object.entries(columnValueMap)) {
                let colIndex: number | undefined = headerToColIndex[colName];
                if (colIndex === undefined) {
                    const normalised = colName.trim().replace(/\s+/g, ' ');
                    const match = Object.entries(headerToColIndex).find(([h]) => h.trim().replace(/\s+/g, ' ') === normalised);
                    colIndex = match?.[1];
                }
                if (colIndex !== undefined) {
                    worksheet.cell(dataRowNumber, colIndex).value(value);
                    log.info(`Written → Row ${dataRowNumber}, Col [${colIndex}] | "${colName}" = "${value}"`);
                }
            }

            await workbook.toFileAsync(filePath);
            log.info(`Excel saved: ${filePath} (${fs.statSync(filePath).size} bytes)`);

        } catch (error) {
            log.error(`Excel write failed: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    async assertAddMembersBulkProcessingAndSuccess(): Promise<void> {
        await this.waitForElementIsVisible(this.clientsLocator.addMembersBulkInProgressHeading);
        await this.assertElementVisible(this.clientsLocator.addMembersBulkInProgressHeading);
        await this.waitForElementIsVisible(this.clientsLocator.addMembersBulkSuccessHeading);
        await this.assertElementVisible(this.clientsLocator.addMembersBulkSuccessHeading);
    }

    private async selectDropdownOption(dropdownTrigger: Locator, optionItem: Locator): Promise<string> {
        await this.click(dropdownTrigger);
        await optionItem.waitFor({ state: 'visible', timeout: 10000 });
        const selectedText = (await optionItem.textContent())?.trim() ?? '';
        await this.click(optionItem);
        await optionItem.waitFor({ state: 'hidden', timeout: 10000 });
        log.info(`Dropdown selected: "${selectedText}"`);
        return selectedText;
    }

    private async waitUntilFileIsReady(filePath: string, timeoutMs = 10000): Promise<void> {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                log.info(`File ready: ${filePath} (${fs.statSync(filePath).size} bytes)`);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        throw new Error(`File not ready after ${timeoutMs}ms: ${filePath}`);
    }
}

// Email Log Module
class EmailLogActions extends BasePage {

    private readonly locator: EmailLogLocators;

    constructor(page: any) {
        super(page);
        this.locator = new EmailLogLocators(page);
    }

    async navigateToEmailLogs(): Promise<void> {
        await this.scrollToElement(this.locator.sidebarEmailsMenu);
        await this.click(this.locator.sidebarEmailsMenu);
        await this.waitForElementIsVisible(this.locator.sidebarEmailLogsMenu);
        await this.assertElementVisible(this.locator.sidebarEmailLogsMenu);
        await this.click(this.locator.sidebarEmailLogsMenu);
    }

    async filterEmailLogsByClientAndPolicy(): Promise<void> {
        await this.click(this.locator.emailLogClientDropdown);
        await this.waitForElementIsVisible(this.locator.emailLogTargetClientOption);
        await this.click(this.locator.emailLogTargetClientOption);
        await this.click(this.locator.emailLogPolicyDropdown);
        await this.waitForElementIsVisible(this.locator.emailLogTargetPolicyOption);
        await this.click(this.locator.emailLogTargetPolicyOption);
        await this.click(this.locator.emailLogSearchButton);
    }

    async openMemberEmailLogDetail(memberLastName: string): Promise<void> {
        await this.click(this.locator.emailLogRowViewLinkByMemberLastName(memberLastName));
    }

    async openInsurerBulkRequestEmailDetail(): Promise<void> {
        await this.waitForElementIsVisible(this.locator.insurerBulkRequestEmailViewLink);
        await this.click(this.locator.insurerBulkRequestEmailViewLink);
    }

    async clickBackToList(): Promise<void> {
        await this.waitForElementIsVisible(this.locator.backToListButton);
        await this.click(this.locator.backToListButton);
    }

    async assertEmailLogRowExistsForMember(clientName: string, policyName: string, memberLastName: string): Promise<void> {
        await this.isVisible(this.locator.emailLogNotificationTypeLabel);
        await this.isVisible(this.locator.emailLogClientNameCellByMemberLastName(memberLastName, clientName));
        await this.isVisible(this.locator.emailLogPolicyCellByMemberLastName(memberLastName, policyName));
    }

    async assertEmailDetailHeadingIsVisible(): Promise<void> {
        await this.waitForElementIsVisible(this.locator.addMembersBulkEmailDetailHeading);
        await this.assertElementVisible(this.locator.addMembersBulkEmailDetailHeading);
    }

    async assertEmailDetailSubjectContainsMemberName(memberLastName: string): Promise<void> {
        await this.assertElementVisible(this.locator.emailDetailSubjectByMemberLastName(memberLastName));
    }

    async assertInsurerEmailSubject(): Promise<void> {
        await this.waitForElementIsVisible(this.locator.insurerBulkRequestSubject);
        await this.assertElementVisible(this.locator.insurerBulkRequestSubject);
    }

    async assertToEmail(expectedEmail: string): Promise<void> {
        await this.waitForElementIsVisible(this.locator.emailDetailToAddressField);
        const actual = (await this.locator.emailDetailToAddressField.textContent())?.trim() ?? '';
        log.info(`To email — Expected: "${expectedEmail}" | Actual: "${actual}"`);
        expect(actual).toContain(expectedEmail);
    }

    async logToEmailAddress(): Promise<void> {
        await this.waitForElementIsVisible(this.locator.emailDetailToAddressField);
        const actual = (await this.locator.emailDetailToAddressField.textContent())?.trim() ?? '';
        log.info(`Row 2 insurer email — To: ${actual}`);
    }

    async assertEmailDetailRequestSubmittedToInsurer(): Promise<void> {
        await this.page.waitForTimeout(2000);
        await this.locator.captionRequestSubmittedToInsurer.waitFor({ state: 'visible', timeout: 30000 });
        await this.assertElementVisible(this.locator.captionRequestSubmittedToInsurer);
        log.info('Email detail — Request submitted to insurer paragraph verified');
    }

    async assertEmailDetailCompanyName(expectedCompanyName: string): Promise<void> {
        await this.locator.emailDetailCompanyNameCell.waitFor({ state: 'visible', timeout: 30000 });
        const actual = (await this.locator.emailDetailCompanyNameCell.textContent())?.trim() ?? '';
        log.info(`Email detail — Company Name: ${actual}`);
        expect(actual).toContain(expectedCompanyName);
    }

    async assertEmailDetailInsurer(expectedInsurer: string): Promise<void> {
        await this.locator.emailDetailInsurerCell.waitFor({ state: 'visible', timeout: 30000 });
        const actual = (await this.locator.emailDetailInsurerCell.textContent())?.trim() ?? '';
        log.info(`Email detail — Insurer: ${actual}`);
        expect(actual).toContain(expectedInsurer);
    }

    async assertEmailDetailPolicyName(expectedPolicyName: string): Promise<void> {
        await this.locator.emailDetailPolicyNameCell.waitFor({ state: 'visible', timeout: 30000 });
        const actual = (await this.locator.emailDetailPolicyNameCell.textContent())?.trim() ?? '';
        log.info(`Email detail — Policy Name: ${actual}`);
        expect(actual).toContain(expectedPolicyName);
    }

    async assertEmailDetailMembersAdditionBulkRequestCompanyName(expectedCompanyName: string): Promise<void> {
        await this.locator.MemberAdditionBulkRequestCompanyName.waitFor({ state: 'visible', timeout: 30000 });
        const actualCompanyName = (await this.locator.MemberAdditionBulkRequestCompanyName.textContent())?.trim() ?? '';
        log.info(`Insurer Email detail — Company Name: ${actualCompanyName}`);
        expect(actualCompanyName).toContain(expectedCompanyName);
    }

    async assertEmailDetailMembersAdditionBulkRequestInsurer(expectedInsurer: string): Promise<void> {
        await this.locator.MemberAdditionBulkRequestInsurer.waitFor({ state: 'visible', timeout: 30000 });
        const actualInsurer = (await this.locator.MemberAdditionBulkRequestInsurer.textContent())?.trim() ?? '';
        log.info(`Insurer Email detail — Insurer: ${actualInsurer}`);
        expect(actualInsurer).toContain(expectedInsurer);
    }

    async assertEmailDetailMembersAdditionBulkRequestPolicyName(expectedPolicyName: string): Promise<void> {
        await this.locator.MemberAdditionBulkRequestPolicyName.waitFor({ state: 'visible', timeout: 30000 });
        const actualPolicyName = (await this.locator.MemberAdditionBulkRequestPolicyName.textContent())?.trim() ?? '';
        log.info(`Insurer Email detail — Policy Name: ${actualPolicyName}`);
        expect(actualPolicyName).toContain(expectedPolicyName);
    }

    async assertEmailDetailPolicyCategory(expectedCategory: string): Promise<void> {
        await this.locator.emailDetailPolicyCategoryCell.waitFor({ state: 'visible', timeout: 30000 });
        const actual = (await this.locator.emailDetailPolicyCategoryCell.textContent())?.trim() ?? '';
        log.info(`Email detail — Policy Category: ${actual}`);
        expect(actual).toContain(expectedCategory);
    }

    async assertEmailDetailEmployeeNumber(expectedEmployeeNumber: string): Promise<void> {
        await this.locator.emailDetailEmployeeNumberCell.waitFor({ state: 'visible', timeout: 30000 });
        const actual = (await this.locator.emailDetailEmployeeNumberCell.textContent())?.trim() ?? '';
        log.info(`Email detail — Employee Number: ${actual}`);
        expect(actual).toContain(expectedEmployeeNumber);
    }

    async assertEmailDetailMemberName(expectedMemberName: string): Promise<void> {
        await this.locator.emailDetailMemberNameCell.waitFor({ state: 'visible', timeout: 30000 });
        const actual = (await this.locator.emailDetailMemberNameCell.textContent())?.trim() ?? '';
        log.info(`Email detail — Member Name: ${actual}`);
        expect(actual).toContain(expectedMemberName);
    }

    async assertAttachmentFileNameContains(expectedFileName: string): Promise<void> {
        await this.waitForElementIsVisible(this.locator.MemberAdditionBulkRequestMemberListAttachment);
        const actualFileName = (await this.locator.MemberAdditionBulkRequestMemberListAttachment.textContent())?.trim() ?? '';
        log.info(`Attachment file name — Expected to contain: "${expectedFileName}" | Actual: "${actualFileName}"`);
        expect(actualFileName).toContain(expectedFileName);
    }

    async downloadAndVerifyAttachmentExcel(capturedClientName: string, capturedMedicalPolicyName: string, runtime: { lastName: string; employeeNumber: string; email: string; nationalIdNumber: string }): Promise<void> {

        const attachmentLink = this.locator.MemberAdditionBulkRequestMemberListAttachmentLink;
        await this.waitForElementIsVisible(attachmentLink);

        const downloadDirectory = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(downloadDirectory)) fs.mkdirSync(downloadDirectory, { recursive: true });

        const downloadEventPromise = this.page.waitForEvent('download');
        await this.click(attachmentLink);
        const downloadedFile = await downloadEventPromise;

        const savedFilePath = path.join(downloadDirectory, downloadedFile.suggestedFilename());
        await downloadedFile.saveAs(savedFilePath);

        let waited = 0;
        while (waited < 10000) {
            if (fs.existsSync(savedFilePath) && fs.statSync(savedFilePath).size > 0) break;
            await this.page.waitForTimeout(300);
            waited += 300;
        }

        log.info(`Attachment Excel saved: ${savedFilePath}`);

        const workbook = await XlsxPopulate.fromFileAsync(savedFilePath);
        const worksheet = workbook.sheet('Membership List');

        const clientNameCell = String(worksheet.cell(5, 2).value() ?? '').trim();
        const policyNameCell = String(worksheet.cell(7, 2).value() ?? '').trim();
        // log.info(`Attachment — Client Name (Row5,Col2): "${clientNameCell}"`);
        expect(clientNameCell).toContain(capturedClientName);
        // log.info(`Attachment — Policy Name (Row7,Col2): "${policyNameCell}"`);
        expect(policyNameCell).toContain(capturedMedicalPolicyName);

        const HEADER_ROW = 11;
        const DATA_ROW = 12;
        const MAX_COL = 50;
        const headerToCol: Record<string, number> = {};

        for (let c = 1; c <= MAX_COL; c++) {
            const hdr = worksheet.cell(HEADER_ROW, c).value();
            if (hdr) headerToCol[String(hdr).trim()] = c;
        }

        const getCell = (colName: string): string =>
            String(worksheet.cell(DATA_ROW, headerToCol[colName] ?? 0).value() ?? '').trim();

        const lastName = getCell('Last Name');
        const employeeNo = getCell('Employee No.');
        const policy = getCell('Policy');
        const category = getCell('Category');
        const relation = getCell('Relation');
        const maritalStatus = getCell('Marital Status');
        const nationality = getCell('Nationality');
        const nationalId = getCell('National ID Number');
        const email = getCell('Email');

        log.info(`Attachment — Last Name: "${lastName}" | Expected: "${runtime.lastName}"`);
        expect(lastName).toBe(runtime.lastName);
        log.info(`Attachment — Employee No.: "${employeeNo}" | Expected: "${runtime.employeeNumber}"`);
        expect(employeeNo).toBe(runtime.employeeNumber);
        log.info(`Attachment — Policy: "${policy}"`);
        expect(policy).toBe(capturedMedicalPolicyName);
        log.info(`Attachment — Category: "${category}"`);
        expect(category).toContain('Cat A_');
        log.info(`Attachment — Relation: "${relation}"`);
        expect(relation).toBe('Principal');
        log.info(`Attachment — Marital Status: "${maritalStatus}"`);
        expect(maritalStatus).toBe('Married');
        log.info(`Attachment — Nationality: "${nationality}"`);
        expect(nationality).toBe('India');
        log.info(`Attachment — National ID: "${nationalId}" | Expected to contain: "${runtime.nationalIdNumber}"`);
        expect(nationalId).toContain(runtime.nationalIdNumber);
        log.info(`Attachment — Email: "${email}" | Expected: "${runtime.email}"`);
        expect(email).toBe(runtime.email);

        log.info('Attachment Excel — all verifications passed');
    }
}

// Reports Module
class ReportsActions extends BasePage {

    private readonly locator: ReportsLocators;

    constructor(page: any) {
        super(page);
        this.locator = new ReportsLocators(page);
    }

    async navigateToReports(): Promise<void> {
        await this.scrollToElement(this.locator.sidebarReportsMenu);
        await this.click(this.locator.sidebarReportsMenu);
        await this.waitForElementIsVisible(this.locator.reportsHeadingText);
        await this.assertElementVisible(this.locator.reportsHeadingText);
    }

    async openWorkflowLogsReport(): Promise<void> {
        await this.waitForElementIsVisible(this.locator.workflowLogsReportLink);
        await this.click(this.locator.workflowLogsReportLink);
        await this.waitForElementIsVisible(this.locator.workflowLogsReportClientDropdown);
    }

    async selectWorkflowClient(): Promise<void> {
        await this.click(this.locator.workflowLogsReportClientDropdown);
        await this.waitForElementIsVisible(this.locator.workflowLogsReportClientDropdownOption);
        await this.click(this.locator.workflowLogsReportClientDropdownOption);
        await this.waitForElementIsVisible(this.locator.verifyWorkflowLogsReportClientDropdown);
        await this.click(this.locator.workflowLogsReportClientDropdownClose);
    }

    async selectWorkflowPolicy(): Promise<void> {
        await this.click(this.locator.workflowLogsReportPolicyDropdown);
        await this.waitForElementIsVisible(this.locator.workflowLogsReportPolicyDropdownOption);
        await this.click(this.locator.workflowLogsReportPolicyDropdownOption);
        await this.waitForElementIsVisible(this.locator.verifyWorkflowLogsReportPolicyDropdown);
    }

    async selectWorkflowCategory(): Promise<void> {
        await this.click(this.locator.workflowLogsReportCategoryDropdown);
        await this.waitForElementIsVisible(this.locator.workflowLogsReportCategoryDropdownOption);
        await this.click(this.locator.workflowLogsReportCategoryDropdownOption);
        await this.waitForElementIsVisible(this.locator.verifyWorkflowLogsReportCategoryDropdown);
    }

    async clickSearch(): Promise<void> {
        await this.click(this.locator.SearchButton);
    }

    async exportWorkflowToExcel(): Promise<string> {
        const downloadDirectory = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(downloadDirectory)) fs.mkdirSync(downloadDirectory, { recursive: true });

        const downloadEventPromise = this.page.waitForEvent('download', { timeout: 30000 });
        await this.click(this.locator.ExportToExcelButton);
        const downloadedFile = await downloadEventPromise;

        const baseName = downloadedFile.suggestedFilename().replace('.xlsx', '');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const uniqueFileName = `${baseName}_${timestamp}.xlsx`;
        const savedFilePath = path.join(downloadDirectory, uniqueFileName);

        await downloadedFile.saveAs(savedFilePath);

        let waited = 0;
        while (waited < 15000) {
            if (fs.existsSync(savedFilePath) && fs.statSync(savedFilePath).size > 0) break;
            await this.page.waitForTimeout(300);
            waited += 300;
        }

        expect(fs.existsSync(savedFilePath), 'Workflow Excel should exist after download').toBe(true);
        log.info(`Workflow Excel downloaded: ${uniqueFileName} (${(fs.statSync(savedFilePath).size / 1024).toFixed(1)} KB)`);
        return savedFilePath;
    }

    async verifyWorkflowExcelMemberRow(filePath: string, runtime: { lastName: string; employeeNumber: string }, capturedClientName: string, capturedMedicalPolicyName: string): Promise<void> {

        const workbook = await XlsxPopulate.fromFileAsync(filePath);
        const worksheet = workbook.sheet('Workflow Logs Report');

        const HEADER_ROW = 8;
        const FIRST_DATA_ROW = 9;
        const MAX_COL = 54;

        const headerToCol: Record<string, number> = {};
        for (let c = 1; c <= MAX_COL; c++) {
            const hdr = worksheet.cell(HEADER_ROW, c).value();
            if (hdr) headerToCol[String(hdr).trim()] = c;
        }
        log.info(`Workflow headers mapped: ${Object.keys(headerToCol).length} columns`);

        const getCell = (row: number, colName: string): string =>
            String(worksheet.cell(row, headerToCol[colName] ?? 0).value() ?? '').trim();

        let lastDataRow = FIRST_DATA_ROW;
        for (let r = FIRST_DATA_ROW; r <= 10000; r++) {
            const txId = String(worksheet.cell(r, 1).value() ?? '').trim();
            if (txId === '') break;
            lastDataRow = r;
        }
        const totalDataRows = lastDataRow - FIRST_DATA_ROW + 1;
        log.info(`Workflow data rows: ${totalDataRows} (rows ${FIRST_DATA_ROW} to ${lastDataRow})`);

        let memberDataRow = -1;
        for (let r = FIRST_DATA_ROW; r <= lastDataRow; r++) {
            const empNo = getCell(r, 'Employee Number');
            if (empNo === runtime.employeeNumber) { memberDataRow = r; break; }
        }

        log.info(`Searching for Employee Number: ${runtime.employeeNumber} in ${totalDataRows} rows`);
        expect(memberDataRow, `Employee Number "${runtime.employeeNumber}" not found in Workflow Logs (rows ${FIRST_DATA_ROW}–${lastDataRow})`).toBeGreaterThan(0);
        if (memberDataRow < 0) return;

        const memberName = getCell(memberDataRow, 'Member Name');
        const employeeNo = getCell(memberDataRow, 'Employee Number');
        const company = getCell(memberDataRow, 'Company');
        const policy = getCell(memberDataRow, 'Policy');
        const category = getCell(memberDataRow, 'Category');
        const relation = getCell(memberDataRow, 'Relation');
        const requestType = getCell(memberDataRow, 'Request Type');
        const nationality = getCell(memberDataRow, 'Nationality');

        log.info(`Workflow — Row ${memberDataRow} found`);
        log.info(`  Member Name  : "${memberName}"  | Expected to contain: "${runtime.lastName}"`);
        log.info(`  Employee No  : "${employeeNo}"  | Expected: "${runtime.employeeNumber}"`);
        log.info(`  Company      : "${company}"`);
        log.info(`  Policy       : "${policy}"`);
        log.info(`  Category     : "${category}"`);
        log.info(`  Relation     : "${relation}"`);
        log.info(`  Request Type : "${requestType}"`);
        log.info(`  Nationality  : "${nationality}"`);

        expect(memberName, `Member Name should contain "${runtime.lastName}"`).toContain(runtime.lastName);
        expect(employeeNo, `Employee Number mismatch`).toBe(runtime.employeeNumber);
        expect(company, `Company mismatch`).toBe(capturedClientName);
        expect(policy, `Policy mismatch`).toBe(capturedMedicalPolicyName);
        expect(category, `Category should contain "Cat A_"`).toContain('Cat A_');
        expect(relation, `Relation should be "Principal"`).toBe('Principal');
        expect(requestType, `Request Type should be "Member Addition"`).toBe('Member Addition');
        expect(nationality, `Nationality should be "India"`).toBe('India');

        log.info('Workflow Logs Excel — all column verifications passed');
    }

    async openConsolidatedMembershipReport(): Promise<void> {
        await this.waitForElementIsVisible(this.locator.consolidatedMembershipReportLink);
        await this.click(this.locator.consolidatedMembershipReportLink);
    }

    async selectConsolidatedInsurer(): Promise<void> {
        await this.click(this.locator.consolidatedMembershipListInsurerDropdown);
        await this.scrollToElement(this.locator.consolidatedMembershipListInsurerDropdownOption);
        await this.hover(this.locator.consolidatedMembershipListInsurerDropdownOptionTestInsurerHover);
        await this.click(this.locator.consolidatedMembershipListInsurerDropdownOptionTestInsurerHover);
        await this.click(this.locator.consolidatedMembershipListInsurerDropdownOption);
        await this.click(this.locator.consolidatedMembershipListInsurerLabel);
    }

    async selectConsolidatedClient(): Promise<void> {
        await this.click(this.locator.consolidatedMembershipListClientDropdown);
        await this.hover(this.locator.consolidatedMembershipListClientDropdownOption);
        await this.click(this.locator.consolidatedMembershipListClientDropdownOption);
        await this.assertElementVisible(this.locator.verifyConsolidatedMembershipListClientDropdown);
        await this.click(this.locator.consolidatedMembershipListClientDropdownClose);
    }

    async selectConsolidatedPolicy(): Promise<void> {
        await this.click(this.locator.consolidatedMembershipListPolicyDropdown);
        await this.waitForElementIsVisible(this.locator.consolidatedMembershipListPolicyCheckbox);
        await this.click(this.locator.consolidatedMembershipListPolicyCheckbox);
        await this.waitForElementIsVisible(this.locator.verifyConsolidatedMembershipListPolicy);
        await this.click(this.locator.consolidatedMembershipListPolicyLabel);
    }

    async selectConsolidatedCategory(): Promise<void> {
        await this.click(this.locator.consolidatedMembershipListCategoryDropdown);
        await this.waitForElementIsVisible(this.locator.consolidatedMembershipListCategoryCheckbox);
        await this.click(this.locator.consolidatedMembershipListCategoryCheckbox);
        await this.click(this.locator.consolidatedMembershipListCategoryLabel);
    }

    async exportConsolidatedToExcel(): Promise<string> {
        const downloadDirectory = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(downloadDirectory)) fs.mkdirSync(downloadDirectory, { recursive: true });

        const downloadEventPromise = this.page.waitForEvent('download', { timeout: 30000 });
        await this.click(this.locator.consolidatedMembershipListPolicyExportToExcelButton);
        const downloadedFile = await downloadEventPromise;

        const baseName = downloadedFile.suggestedFilename().replace('.xlsx', '');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const uniqueFileName = `${baseName}_${timestamp}.xlsx`;
        const savedFilePath = path.join(downloadDirectory, uniqueFileName);

        await downloadedFile.saveAs(savedFilePath);

        let waited = 0;
        while (waited < 15000) {
            if (fs.existsSync(savedFilePath) && fs.statSync(savedFilePath).size > 0) break;
            await this.page.waitForTimeout(300);
            waited += 300;
        }
        expect(fs.existsSync(savedFilePath), 'Consolidated Excel should exist after download').toBe(true);
        expect(uniqueFileName, 'File name should contain ConsolidatedMembershipList').toContain('ConsolidatedMembershipList');
        log.info(`Consolidated Excel downloaded: ${uniqueFileName} (${(fs.statSync(savedFilePath).size / 1024).toFixed(1)} KB)`);
        return savedFilePath;
    }

    async verifyConsolidatedExcelMemberRow(filePath: string, runtime: { firstName: string; lastName: string; employeeNumber: string; email: string; nationalIdNumber: string }, capturedMedicalPolicyName: string): Promise<void> {
        // Structure confirmed from file: Row 4 title | Row 5 date | Row 6 headers (57 cols) | Row 7+ data
        // Max row 10005 pre-allocated — scan col 1 (BenefitNet ID) to find last real row
        const workbook = await XlsxPopulate.fromFileAsync(filePath);
        const worksheet = workbook.sheet('Membership List');

        const HEADER_ROW = 6;
        const FIRST_DATA_ROW = 7;
        const MAX_COL = 57;

        const headerToCol: Record<string, number> = {};
        for (let c = 1; c <= MAX_COL; c++) {
            const hdr = worksheet.cell(HEADER_ROW, c).value();
            if (hdr) headerToCol[String(hdr).trim()] = c;
        }

        const getCell = (row: number, col: string): string =>
            String(worksheet.cell(row, headerToCol[col] ?? 0).value() ?? '').trim();

        let lastDataRow = FIRST_DATA_ROW;
        for (let r = FIRST_DATA_ROW; r <= 10000; r++) {
            if (String(worksheet.cell(r, 1).value() ?? '').trim() === '') break;
            lastDataRow = r;
        }
        const totalRows = lastDataRow - FIRST_DATA_ROW + 1;
        log.info(`Consolidated data rows: ${totalRows} (rows ${FIRST_DATA_ROW}–${lastDataRow})`);

        let memberDataRow = -1;
        for (let r = FIRST_DATA_ROW; r <= lastDataRow; r++) {
            if (getCell(r, 'Employee Number') === runtime.employeeNumber) { memberDataRow = r; break; }
        }

        log.info(`Searching for Employee Number: ${runtime.employeeNumber} in ${totalRows} rows`);
        expect(memberDataRow, `Employee Number "${runtime.employeeNumber}" not found in Consolidated (rows ${FIRST_DATA_ROW}–${lastDataRow})`).toBeGreaterThan(0);
        if (memberDataRow < 0) return;

        const benefitNetId = getCell(memberDataRow, 'BenefitNet ID');
        const firstName = getCell(memberDataRow, 'First Name');
        const lastName = getCell(memberDataRow, 'Last Name');
        const employeeNo = getCell(memberDataRow, 'Employee Number');
        const email = getCell(memberDataRow, 'Email');
        const nationality = getCell(memberDataRow, 'Nationality');
        const maritalStatus = getCell(memberDataRow, 'Marital Status');
        const relation = getCell(memberDataRow, 'Relation');
        const policy = getCell(memberDataRow, 'Policy');
        const category = getCell(memberDataRow, 'Category');
        const countryOfRes = getCell(memberDataRow, 'Country of Residence');
        const profileStatus = getCell(memberDataRow, 'Member Profile Status');
        const nationalId = getCell(memberDataRow, 'National ID Number');

        log.info(`Consolidated — Row ${memberDataRow} | BenefitNet ID: ${benefitNetId}`);
        log.info(`  First Name     : "${firstName}"  | Expected: "${runtime.firstName}"`);
        log.info(`  Last Name      : "${lastName}"  | Expected: "${runtime.lastName}"`);
        log.info(`  Employee No    : "${employeeNo}"  | Expected: "${runtime.employeeNumber}"`);
        // log.info(`  Email          : "${email}"`);
        // log.info(`  Nationality    : "${nationality}"`);
        // log.info(`  Marital Status : "${maritalStatus}"`);
        // log.info(`  Relation       : "${relation}"`);
        // log.info(`  Policy         : "${policy}"`);
        // log.info(`  Category       : "${category}"`);
        // log.info(`  Country of Res : "${countryOfRes}"`);
        // log.info(`  Profile Status : "${profileStatus}"`);
        // log.info(`  National ID    : "${nationalId}"`);

        expect(firstName, `First Name mismatch`).toBe(runtime.firstName);
        expect(lastName, `Last Name mismatch`).toBe(runtime.lastName);
        expect(employeeNo, `Employee Number mismatch`).toBe(runtime.employeeNumber);
        expect(email, `Email mismatch`).toBe(runtime.email);
        expect(nationality, `Nationality should be "India"`).toBe('India');
        expect(maritalStatus, `Marital Status should be "Married"`).toBe('Married');
        expect(relation, `Relation should be "Principal"`).toBe('Principal');
        expect(policy, `Policy mismatch`).toBe(capturedMedicalPolicyName);
        expect(category, `Category should contain "Cat A_"`).toContain('Cat A_');
        expect(countryOfRes, `Country of Residence should be "United Arab Emirates"`).toBe('United Arab Emirates');
        expect(profileStatus, `Member Profile Status should be "Pending Addition"`).toBe('Pending Addition');
        expect(nationalId, `National ID mismatch`).toContain(runtime.nationalIdNumber);

        log.info('Consolidated Membership Excel — all column verifications passed');
    }
}

const TC_TITLE = "should add a principal member via bulk import and verify email notifications, attachment Excel, workflow logs report and consolidated membership report";

test.describe('Add Members Bulk — Full End-to-End Workflow', () => {
    

    test(`${TC_TITLE}`, async ({ page }) => {

        const loginPage = new LoginPage(page);
        const clientsPage = new ClientsPage(page);
        const emailLog = new EmailLogActions(page);
        const reports = new ReportsActions(page);

        // Step 1: Login
        await loginPage.navigateToLogin(qaConfig.baseURL);
        await loginPage.login(qaConfig.credentials.username, qaConfig.credentials.password);

        // Step 2: Navigate to Target Client → Policy → Bulk Add Form
        await clientsPage.navigateToClientsViasidebar();
        await clientsPage.openTargetClientDetails();
        const capturedClientName = clientsPage.capturedClientName;
        await clientsPage.openPolicyTab(capturedClientName);
        const capturedMedicalPolicyName = clientsPage.capturedMedicalPolicyName;
        await clientsPage.openAddMembersBulkForm();

        // Step 3: Generate unique runtime values for this test run
        const runtime = tdm.generateRuntimeData();
        log.info(`Member under test: ${runtime.firstName} ${runtime.lastName}`);
        log.info(`Gender: ${runtime.gender} | DOB: ${runtime.dob}`);
        log.info(`Email: ${runtime.email} | Addition Date: ${runtime.additionDate}`);
        log.info(`Employee No: ${runtime.employeeNumber} | National ID: ${runtime.nationalIdNumber}`);

        // Step 4: Round 1 — Partial fill to discover missing fields
        log.info('ROUND 1: Partial fill → discover validation errors');

        const round1Profile = tdm.getProfile('Principal Member - UAE Expat Dubai (Round 1 Partial)');
        const round1Resolved = tdm.resolvePlaceholders(round1Profile.memberData, runtime);
        const round1ExcelRow = tdm.buildExcelRow(round1Resolved);

        const round1FilePath = await clientsPage.downloadCensusSampleFile();
        await clientsPage.writeRowDataToExcelFile(round1FilePath, round1ExcelRow);
        await clientsPage.uploadCensusExcelFile(round1FilePath);
        await clientsPage.selectImportTypeOption();
        await clientsPage.selectNotifyHrOption();
        await clientsPage.selectNotifyMemberOption();
        await clientsPage.clickValidateImportButton();

        const isNoHrWarningDisplayed = await clientsPage.isNoHrUsersConfiguredWarningDisplayed();
        const round1ValidationErrors = await clientsPage.getValidationErrorFieldNames();
        log.info(`Round 1 — Validation errors (${round1ValidationErrors.length}): ${round1ValidationErrors.join(', ')}`);

        if (round1ValidationErrors.length === 0) {
            log.info('Round 1 — All fields validated successfully on first attempt');
            return;
        }

        // Step 5: Round 2 — Fill all missing fields and re-validate
        log.info('ROUND 2: Fill all missing fields → re-validate');

        await clientsPage.clickBackToImportLink();
        const policyCategory = `Cat A_ ${capturedMedicalPolicyName}`;
        const round2MissingFields = tdm.resolveMissingFields(round1ValidationErrors, {}, policyCategory);
        const round2ExcelRow = { ...round1ExcelRow, ...round2MissingFields };

        log.info(`Round 2 — Writing ${Object.keys(round2ExcelRow).length} total columns`);

        const round2FilePath = await clientsPage.downloadCensusSampleFile();
        await clientsPage.writeRowDataToExcelFile(round2FilePath, round2ExcelRow);
        await clientsPage.uploadCensusExcelFile(round2FilePath);
        await clientsPage.selectImportTypeOption();

        if (isNoHrWarningDisplayed) {
            await clientsPage.selectDoNotNotifyHrOption();
        } else {
            await clientsPage.selectNotifyHrOption();
        }

        await clientsPage.selectNotifyMemberOption();
        await clientsPage.clickValidateImportButton();

        // Step 6: Assert all Round 1 errors are resolved
        await clientsPage.assertPreviousValidationErrorsAreResolved(round1ValidationErrors);
        await clientsPage.handleValidationOutcomeAndProceedToImport();

        // Step 7: Assert import processing completes
        await clientsPage.assertAddMembersBulkProcessingAndSuccess();

        // Step 8: Email Logs → verify Row 1 (member notification email)
        await emailLog.navigateToEmailLogs();
        await emailLog.filterEmailLogsByClientAndPolicy();
        await emailLog.assertEmailLogRowExistsForMember(capturedClientName, capturedMedicalPolicyName, runtime.lastName);
        await emailLog.openMemberEmailLogDetail(runtime.lastName);

        await emailLog.assertEmailDetailHeadingIsVisible();
        await emailLog.assertEmailDetailSubjectContainsMemberName(runtime.lastName);
        await emailLog.assertEmailDetailRequestSubmittedToInsurer();
        await emailLog.assertEmailDetailCompanyName(capturedClientName);
        await emailLog.assertEmailDetailInsurer(APP_CONSTANTS.TESTINSURER);
        await emailLog.assertEmailDetailPolicyName(capturedMedicalPolicyName);
        await emailLog.assertEmailDetailPolicyCategory(policyCategory);
        await emailLog.assertEmailDetailEmployeeNumber(runtime.employeeNumber);

        log.info('Row 1 email verification complete');

        // Step 9: Back to list → verify Row 2 (insurer bulk request email)
        await emailLog.clickBackToList();
        await emailLog.filterEmailLogsByClientAndPolicy();
        await emailLog.openInsurerBulkRequestEmailDetail();

        await emailLog.logToEmailAddress();
        await emailLog.assertInsurerEmailSubject();
        await emailLog.assertEmailDetailRequestSubmittedToInsurer();
        await emailLog.assertEmailDetailMembersAdditionBulkRequestCompanyName(capturedClientName);
        await emailLog.assertEmailDetailMembersAdditionBulkRequestInsurer(APP_CONSTANTS.TESTINSURER);
        await emailLog.assertEmailDetailMembersAdditionBulkRequestPolicyName(capturedMedicalPolicyName);

        await emailLog.assertAttachmentFileNameContains(APP_CONSTANTS.ATTACHMENTMEMBERLIST);
        await emailLog.downloadAndVerifyAttachmentExcel(capturedClientName, capturedMedicalPolicyName, runtime);

        log.info('Row 2 insurer email verification complete');

        // Step 10: Reports → Workflow Logs Report → Export → Verify Excel
        await reports.navigateToReports();
        await reports.openWorkflowLogsReport();
        await reports.selectWorkflowClient();
        await reports.selectWorkflowPolicy();
        await reports.selectWorkflowCategory();
        await reports.clickSearch();

        const workflowExcelPath = await reports.exportWorkflowToExcel();
        await reports.verifyWorkflowExcelMemberRow(workflowExcelPath, runtime, capturedClientName, capturedMedicalPolicyName);

        log.info('Workflow Logs Report verification complete');

        // Step 11: Reports → Consolidated Membership Report → Export → Verify Excel
        await reports.navigateToReports();
        await reports.openConsolidatedMembershipReport();
        await reports.selectConsolidatedInsurer();
        await reports.selectConsolidatedClient();
        await reports.selectConsolidatedPolicy();
        await reports.selectConsolidatedCategory();
        await reports.clickSearch();

        const consolidatedExcelPath = await reports.exportConsolidatedToExcel();
        await reports.verifyConsolidatedExcelMemberRow(consolidatedExcelPath, runtime, capturedMedicalPolicyName);

        log.info('Consolidated Membership Report verification complete');
        log.info('Full end-to-end workflow completed successfully');
    });

});