import { Page, Locator } from '@playwright/test';

export class ClientsLocator {

    constructor(public readonly page: Page) { }

    private named(name: string, locator: Locator): Locator {
        (locator as any).__name = name;
        return locator;
    }

    get sidebarClientsMenu(): Locator {
        return this.named('Sidebar Clients Menu',
            this.page.locator(`//ul[@id="side-menu"]//li//a//span[text()="Clients"]`));
    }

    get clientsHeadingText(): Locator {
        return this.named('Clients Heading Text',
            this.page.locator(`//h2[normalize-space(text()="Clients")]`));
    }

    get targetClientNameLink(): Locator {
        return this.named('Target Client Name Link',
            this.page.locator(`//table//tbody//tr//td//a[text()="Syslatech_TestClient1"]`));
    }

    clientNameLabel(clientName: string): Locator {
        return this.named(`Client Name Label: ${clientName}`,
            this.page.locator(`//table//tbody//tr//td[text()="${clientName}"]`));
    }

    get policiesLabel(): Locator {
        return this.named('Policies Tab',
            this.page.locator(`//a[text()="Policies"]`));
    }

    get policyRenewalTab(): Locator {
        return this.named('Policy Renewal Tab',
            this.page.locator(`//a[normalize-space(.)="Policy Renewal"]`));
    }

    get targetMedicalPolicyLink(): Locator {
        return this.named('Target Medical Policy Link',
            this.page.locator(`//a[text()="MedicalPolicy1_Syslatech_TestClient1"]`));
    }

    get policyNameLabel(): Locator {
        return this.named('Policy Name Label',
            this.page.locator(`//label[normalize-space()="Policy Name"]/..//span`));
    }

    get addMembersBulkButton(): Locator {
        return this.named('Add Members Bulk Button',
            this.page.locator(`//a[normalize-space()="Add Members Bulk"]`));
    }

    get downloadSampleFileLink(): Locator {
        return this.named('Download Sample File Link',
            this.page.locator(`//div[@class="alert alert-info"]//a[normalize-space(text()="Download sample file")]`));
    }

    get censusExcelFileInput(): Locator {
        return this.named('Census Excel File Input',
            this.page.locator(`//label[normalize-space()="Client Census (Excel) (*)"]//following-sibling::div//div[@aria-label="Select Files"]//input[@id="excel-file" and @type="file"]`));
    }

    get importTypeDropdown(): Locator {
        return this.named('Import Type Dropdown',
            this.page.locator(`//label[normalize-space()="Import Type (*)"]//following-sibling::div//span[contains(@class,"k-dropdown-wrap")]`));
    }

    get importTypeShowPendingAndEmailInsurerOption(): Locator {
        return this.named('Import Type: Show Pending and Email Insurer',
            this.page.locator(`//ul[@id="create-workflow-list_listbox"]//li[normalize-space()="Show in Pending Tasks and Email Insurer"]`));
    }

    get importTypeShowPendingAndNoEmailInsurerOption(): Locator {
        return this.named('Import Type: Show Pending and No Email Insurer',
            this.page.locator(`//ul[@id="create-workflow-list_listbox"]//li[normalize-space()="Show in Pending Tasks and No Email to Insurer"]`));
    }

    get notifyHrDropdown(): Locator {
        return this.named('Notify HR Dropdown',
            this.page.locator(`//label[normalize-space()="Notify HR (*)"]//following-sibling::div//span[contains(@class,"k-dropdown-wrap")]`));
    }

    get notifyHrOption(): Locator {
        return this.named('Notify HR Option',
            this.page.locator(`//ul[@id="notify_hr_list_listbox"]//li[normalize-space()="Notify HR"]`));
    }

    get doNotNotifyHrOption(): Locator {
        return this.named("Don't Notify HR Option",
            this.page.locator(`//ul[@id="notify_hr_list_listbox"]//li[normalize-space()="Don't Notify HR"]`));
    }

    get notifyMemberDropdown(): Locator {
        return this.named('Notify Member Dropdown',
            this.page.locator(`//label[normalize-space()="Notify Member (*)"]//following-sibling::div//span[contains(@class,"k-dropdown-wrap")]`));
    }

    get notifyMemberOption(): Locator {
        return this.named('Notify Member Option',
            this.page.locator(`//ul[@id="notify-member-list_listbox"]//li[normalize-space()="Notify Member"]`));
    }

    get validateImportButton(): Locator {
        return this.named('Validate Import Button',
            this.page.locator(`//button[@id="validate-btn"]`));
    }

    get importMembersButton(): Locator {
        return this.named('Import Members Button',
            this.page.getByRole('button', { name: 'Import Members' }));
    }

    get backToImportLink(): Locator {
        return this.named('Back to Import Link',
            this.page.getByText('Back to Import'));
    }

    get validationResultsGrid(): Locator {
        return this.named('Validation Results Grid',
            this.page.locator(`//*[@id="validationResult"]`));
    }

    get validationSuccessBanner(): Locator {
        return this.named('Validation Success Banner',
            this.page.getByText('Validation Successful'));
    }

    get validationFailedBanner(): Locator {
        return this.named('Validation Failed Banner',
            this.page.getByText('Validation Failed'));
    }

    get noHrUsersConfiguredWarning(): Locator {
        return this.named('No HR Users Configured Warning',
            this.page.locator(`//div[@class="alert alert-warning"]//span[text()="There are no HR users configured for this Policy so HR users will not receive any email from the system."]`));
    }

    get importProgressBarModal(): Locator {
        return this.named('Import Progress Bar Modal',
            this.page.locator(`//div[@id="ProgressBarWindow"]`));
    }

    get addMembersBulkInProgressHeading(): Locator {
        return this.named('Add Members Bulk In Progress Heading',
            this.page.locator(`//h3[text()="Add Members Bulk - In progress"]`));
    }

    get addMembersBulkSuccessHeading(): Locator {
        return this.named('Add Members Bulk Success Heading',
            this.page.getByRole('heading', { name: 'Add Members Bulk Successful' }));
    }

    get errorAndWarningCells(): Locator {
        return this.named('Error and Warning Cells',
            this.page.locator(`//tr[contains(@class,'k-group-row-validation-type-error')]//td[@role='gridcell'][last()] | //*[@id='validationResult']//tr//td[last()] | //*[@id='validationResult']//td[contains(@class,'k-last')]`));
    }
}