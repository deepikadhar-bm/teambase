import { Page, Locator } from "@playwright/test";

export class ClientsLocator {
    constructor(public readonly page: Page) { }

    // getLocator(xpath: string): Locator {
    //     return this.page.locator(xpath);
    // }

    get Clients(): Locator {
        return this.page.locator('//ul[@id="side-menu"]//li//a//span[text()="Clients"]');
    }

    get EmailsMenu(): Locator {
        return this.page.locator('//ul[@id="side-menu"]//li//a//span[text()="Emails"]');
    }

    get EmailLogsMenu(): Locator {
        return this.page.locator('//ul[@id="side-menu"]//li//a//span[text()="Email Logs"]');
    }

    get ClientsHeading(): Locator {
        return this.page.locator('//h2[normalize-space(text()="Clients")]');
    }

    get ClientName(): Locator {
        return this.page.locator('//table//tbody//tr//td//a[text()="Syslatech_TestClient1"]');
    }

    get PolicyRenewal(): Locator {
        return this.page.locator('//a[normalize-space(.)="Policy Renewal"]');
    }

    get MedicalPolicy(): Locator {
        return this.page.locator('//a[text()="MedicalPolicy1_Syslatech_TestClient1"]');
    }

    get AddMembersBulk(): Locator {
        return this.page.locator('//a[normalize-space()="Add Members Bulk"]');
    }

    get PolicyName(): Locator {
        return this.page.locator('//label[normalize-space()="Policy Name"]/..//span');
    }

    get DownloadSampleFile(): Locator {
        return this.page.locator('//div[@class="alert alert-info"]//a[normalize-space(text()="Download sample file")]');
    }

    get ClientCensusExcelFileUpload(): Locator {
        return this.page.locator('//label[normalize-space()="Client Census (Excel) (*)"]//following-sibling::div//div[@aria-label="Select Files"]//input[@id="excel-file" and @type="file"]');
    }

    get ImportTypeDropdown(): Locator {
        return this.page.locator('//label[normalize-space()="Import Type (*)"]//following-sibling::div//span[contains(@class,"k-dropdown-wrap")]');
    }

    get ImportTypeOption(): Locator {
        return this.page.locator('//ul[@id="create-workflow-list_listbox"]//li[normalize-space()="Show in Pending Tasks and Email Insurer"]');
    }

    get NotifyHRDropdown(): Locator {
        return this.page.locator('//label[normalize-space()="Notify HR (*)"]//following-sibling::div//span[contains(@class,"k-dropdown-wrap")]');
    }

    get DoNotNotifyHROption(): Locator {
        return this.page.locator(`//ul[@id="notify_hr_list_listbox"]//li[normalize-space()="Don’t Notify HR"]`);
    }

    get NotifyHROption(): Locator {
        return this.page.locator('//ul[@id="notify_hr_list_listbox"]//li[normalize-space()="Notify HR"]');
    }

    get NotifyMemberDropdown(): Locator {
        return this.page.locator('//label[normalize-space()="Notify Member (*)"]//following-sibling::div//span[contains(@class,"k-dropdown-wrap")]');
    }

    get NotifyMemberOption(): Locator {
        return this.page.locator('//ul[@id="notify-member-list_listbox"]//li[normalize-space()="Notify Member"]');
    }

    get ValidateButton(): Locator {
        return this.page.locator('//button[@id="validate-btn"]');
    }

    get ValidationResultsGrid(): Locator {
        return this.page.locator('//*[@id="validationResult"]');
    }

    get BackButton(): Locator {
        return this.page.getByText('Back to Import');
    }

    get ValidationSuccessful(): Locator {
        return this.page.getByText('Validation Successful');
    }

    get NoHRUsersConfiguredPolicy(): Locator {
        return this.page.locator('//div[@class="alert alert-warning"]//span[text()="There are no HR users configured for this Policy so HR users will not receive any email from the system."]');
    }

    get ValidationFailed(): Locator {
        return this.page.getByText('Validation Failed');
    }

    get ImportButton(): Locator {
        return this.page.getByRole('button', { name: 'Import Members' });
    }

    get AddMembersInProgress(): Locator {
        return this.page.locator('//h3[text()="Add Members Bulk - In progress"]');
    }

    get AddMembersSuccessful(): Locator {
        return this.page.getByRole('heading', { name: 'Add Members Bulk Successful' });
    }

    get EmailSearchButton(): Locator {
        return this.page.locator('//form[@id="formSearch"]//button[text()="Search"]');
    }

    get NotificationType(): Locator {
        return this.page.getByText('Notification Type:');
    }

    get ProgressBarWindow(): Locator {
        return this.page.locator('//div[@id="ProgressBarWindow"]');
    }
    get AddMembersBulkEmailHeading(): Locator {
        return this.page.locator('//div[@id="detailsView"]//h2[normalize-space(.)="Add Members Bulk Email"]');
    }

    clickClientEmailOnNotification(lastName: string): Locator {
        return this.page.locator(`//tbody[@role="rowgroup"]//tr//td[@colspan="2"]//small[contains(text(),"${lastName}")]/../..//td[3]//small[contains(text(),"Wrong")]/../..//td[5]//a[normalize-space(text()=" View")]`);
    }

    verifyEmailLogForClientName(lastName: string, clientName: string): Locator {
        return this.page.locator(`//tbody[@role="rowgroup"]//tr//td[@colspan="2"]//small[contains(text(),"${lastName}")]/../..//td[3]//small[contains(text(),"Wrong")]/../..//td[4]//small//span[text()="Client: "]/..//a[contains(text(),"${clientName}")]`);
    }
    verifyEmailLogForClientPolicy(lastName: string, medicalPolicyName: string): Locator {
        return this.page.locator(`//tbody[@role="rowgroup"]//tr//td[@colspan="2"]//small[contains(text(),"${lastName}")]/../..//td[3]//small[contains(text(),"Wrong")]/../..//td[4]//small//span[text()="Policy: "]/..//a[contains(text(),"${medicalPolicyName}")]`);
    }
    verifyEmailLogForSubject(lastName: string): Locator {
        return this.page.locator(`//h3[span[normalize-space(text()="Subject:")] and contains(., "${lastName}")] | //*[contains(text(), "Subject:")]/descendant-or-self::*[contains(., "${lastName}")]`);
    }

    verifyEmailLogCompanyName(clientName: string): Locator {
        return this.page.locator(`//tr[th[normalize-space(.)="Company Name"]]/td[contains(normalize-space(.), "${clientName}")]`);
    }

    verifyEmailLogPolicyName(medicalPolicyName: string): Locator {
        return this.page.locator(`//tr[th[normalize-space(.)="Policy Name"]]/td[contains(normalize-space(.), "${medicalPolicyName}")]`);
    }
    verifyEmailLogPolicyCategory(policyCategoryText: string): Locator {
        return this.page.locator(`//h3[text()="Member Details"]//following-sibling::table//tr//th[text()="Policy Category"]//following-sibling::td[normalize-space(text()="${policyCategoryText}")]`);
    }
    verifyEmailLogEmployeeNo(employeeNo: string): Locator {
        return this.page.locator(`//h3[text()="Policy Details"]//following-sibling::table//tr//th[text()="Policy Name"]//following-sibling::td[normalize-space(text()="${employeeNo}")]`);
    }
}