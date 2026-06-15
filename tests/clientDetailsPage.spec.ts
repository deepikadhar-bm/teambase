import { test, expect } from '../src/fixtures/fixtures';
import { LoginPage as LoginPageModel } from '../src/pages/loginPage';
import { ClientsPage as ClientsPageModel } from '../src/pages/clientsPage';
import { qaConfig } from 'src/config/env.qa';
import { logger } from 'src/utils/logger';

function generateUniqueEmail(): string {
    const randomNumber = Math.floor(Math.random() * 1000000);
    return `sysla.test.${randomNumber}@test.com`;
}

function generateUniqueEmployeeNumber(): string {
    const randomNumber = Math.floor(Math.random() * 1000000);
    return `EMP${randomNumber}`;
}

function generateUniqueLastName(): string {
    const randomNumber = Math.floor(Math.random() * 100000);
    return `Test${randomNumber}`;
}

test.describe('Clients Details Page', () => {

    test("Add Members Bulk - Validate pending columns then resolve", async ({ page }) => {

        const loginPage = new LoginPageModel(page);
        const clientDetails = new ClientsPageModel(page);

        await loginPage.navigateToLogin(qaConfig.baseURL);
        await loginPage.login(qaConfig.credentials.username, qaConfig.credentials.password);

        const loginSuccessMessage = await loginPage.getLoginSuccessMessage();
        expect(loginSuccessMessage).toContain('WELCOME ADMIN USER!');

        await clientDetails.clickOnClientsMenuInSideBar();
        await clientDetails.navigateToClientsDetails();
        const clientNameText = clientDetails.clientNameText;
        await clientDetails.clickOnPolicyRenewal();
        const medicalPolicyNameText = clientDetails.medicalPolicyNameText;
        await clientDetails.clickAddMembersBulk();

        logger.info('── ROUND 1: Partial fill → discover missing fields ──');

        const excelFilePath = await clientDetails.downloadSampleFile();

        const memberFirstName = 'Sysla';
        const memberLastName = generateUniqueLastName();
        const memberDateOfBirth = '01/01/1990';
        const memberGender = 'Male';
        const memberEmail = generateUniqueEmail();
        const memberAdditionDate = '11/06/2026';
        const memberEmployeeNumber = generateUniqueEmployeeNumber();
        const memberCountryOfResidence = 'United Arab Emirates';
        const memberNationalIDNumber = 'NID123456789';
        const memberType = '4 = Expat who\'s residency is issued in Dubai';

        const round1MemberData: Record<string, string> = {
            'First Name (*)': memberFirstName,
            'Last Name (*)': memberLastName,
            'Date Of Birth (*)': memberDateOfBirth,
            'Gender (*)': memberGender,
            'Email (*)': memberEmail,
            'Addition Date (*)': memberAdditionDate,
            'Employee Number (*)': memberEmployeeNumber,
            'Country of Residence (*)': memberCountryOfResidence,
            'National ID Number (*)': memberNationalIDNumber,
            'Member Type (*)': memberType,
        };

        logger.info(`Round 1 - Testing member: ${memberFirstName} ${memberLastName} (${memberEmail})`);

        await clientDetails.writeValuesToExcel(excelFilePath, round1MemberData);

        await clientDetails.clientCensusExcelFileSelect(excelFilePath);
        await clientDetails.selectImportType();
        await clientDetails.selectNotifyHR();
        await clientDetails.selectNotifyMember();
        await clientDetails.clickValidateButton();

        const noHRUserConfigPolicyIsVisible = await clientDetails.isNoHRUsersConfiguredVisible();

        const requiredFieldsNotFilled = await clientDetails.getValidationErrorFields();
        logger.info(`Round 1 - Missing fields (${requiredFieldsNotFilled.length}): ${requiredFieldsNotFilled.join(', ')}`);

        if (requiredFieldsNotFilled.length === 0) {
            logger.info('Round 1 - All fields validated successfully');
            return;
        }

        logger.info(`── ROUND 2: Fill missing fields ──`);

        await clientDetails.clickBackButton();
        // await clientDetails.waitForElementIsVisible(clientDetails.clientsLocator.DownloadSampleFile);
        // await clientDetails.verifyValidationFailedIsVisible();
        const excelFilePathRound2 = await clientDetails.downloadSampleFile();

        const additionalMemberData = clientDetails.getMissingFieldsData(requiredFieldsNotFilled, {
            firstName: memberFirstName,
            lastName: memberLastName,
            email: memberEmail,
            employeeNumber: memberEmployeeNumber,
            dateOfBirth: memberDateOfBirth,
            gender: memberGender,
            additionDate: memberAdditionDate,
            maritalStatus: 'Single',
            nationality: 'United Arab Emirates',
            relation: 'Principal',
            countryOfResidence: memberCountryOfResidence,
            nationalIDNumber: memberNationalIDNumber,
            memberType: memberType,
        });

        const round2MemberData: Record<string, string> = {
            ...round1MemberData,
            ...additionalMemberData,
        };

        logger.info(`Round 2 - Writing ${Object.keys(round2MemberData).length} fields`);

        await clientDetails.writeValuesToExcel(excelFilePathRound2, round2MemberData);

        await clientDetails.clientCensusExcelFileSelect(excelFilePathRound2);
        await clientDetails.selectImportType();

        if (noHRUserConfigPolicyIsVisible) {
            await clientDetails.selectDoNotNotifyHRWithOption();
        } else {
            await clientDetails.selectNotifyHR();
        }

        await clientDetails.selectNotifyMember();
        await clientDetails.clickValidateButton();

        await clientDetails.verifyMissingFieldsResolved(requiredFieldsNotFilled);
        await clientDetails.verifyTheValidationSuccessfulOrFailed();
        await clientDetails.verifyAddMembersProcessing();
        await clientDetails.navigateToEmails();
        await clientDetails.verifyEmailSentToTheClient(clientNameText, medicalPolicyNameText, memberLastName);

        logger.info(` Client Name : ${clientNameText} | Last Name : ${memberLastName}`);
        await clientDetails.clickTheClientEmail(memberLastName);

        await clientDetails.verifyEmailLogForSubject(memberLastName)
        await clientDetails.verifyEmailLogForCompanyName(clientNameText)
        await clientDetails.verifyEmailLogForPolicyName(medicalPolicyNameText)
    });
});