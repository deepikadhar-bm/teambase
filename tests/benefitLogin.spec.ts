import { test, expect } from '../src/fixtures';
import { LoginPage as LoginPageModel } from '../src/pages/loginPage';
import { qaConfig } from 'src/config/env.qa';

test.describe('BenefitNet Login Tests', () => {

  test('Should login successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPageModel(page);

    await loginPage.navigateToLogin(qaConfig.baseURL);
    await loginPage.login(qaConfig.credentials.username, qaConfig.credentials.password);

    const loginSuccessMessage = await loginPage.getLoginSuccessMessage();
    expect(loginSuccessMessage).toContain('WELCOME ADMIN USER!');
  });

  test('Should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPageModel(page);

    await loginPage.navigateToLogin(qaConfig.baseURL);
    await loginPage.login(qaConfig.credentials.username, 'WrongPass');

    const error = await loginPage.getErrorMessage();
    expect(error).toContain('The user name or password provided is incorrect');
  });

  test('Should show validation for empty fields', async ({ page }) => {
    const loginPage = new LoginPageModel(page);

    await loginPage.navigateToLogin(qaConfig.baseURL);
    await loginPage.login('', '');

    const error = await loginPage.getErrorMessage();
    expect(error).toContain('User email is not specified');

    const userNameError = await loginPage.getUserNameError();
    expect(userNameError).toContain('The User name field is required.');

    const passwordError = await loginPage.getPasswordError();
    expect(passwordError).toContain('The Password field is required.');
  });

});