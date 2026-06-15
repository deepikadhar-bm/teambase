import { test, expect } from '../src/fixtures/testFixtures';
import { LoginPage } from '../src/pages/loginPage';
import { qaConfig } from 'src/config/env.qa';
import { bnLoginData } from 'src/utils/testData';

bnLoginData.forEach(({ testName, username, password, expected, errorMsg, errorField }) => {

    test(`BN Login → ${testName}`, async ({ page }) => {

        const loginPage = new LoginPage(page);
        await loginPage.navigateToLogin(qaConfig.baseURL);

        await loginPage.login(username, password);

        if (expected === 'success') {
            await loginPage.assertURL(qaConfig.baseURL);
            const welcomeText = await loginPage.getLoginSuccessMessage();
            expect(welcomeText).toContain('WELCOME ADMIN USER!');

        } else {
            switch (errorField) {

                case 'credential':
                    const credError = await loginPage.getCredentialError();
                    expect(credError).toContain('The user name or password provided is incorrect');
                    break;

                case 'username':
                    const usernameError = await loginPage.getUserNameFieldError();
                    expect(usernameError).toContain(errorMsg);
                    break;

                case 'password':
                    const passwordError = await loginPage.getPasswordFieldError();
                    expect(passwordError).toContain(errorMsg);
                    break;

                case 'both':
                    const unameErr = await loginPage.getUserNameFieldError();
                    const passErr = await loginPage.getPasswordFieldError();
                    expect(unameErr).toContain('required');
                    expect(passErr).toContain('required');
                    break;
            }
        }
    });
});