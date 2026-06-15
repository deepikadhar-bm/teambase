import { Page } from '@playwright/test';
import { BasePage } from './basePage';
import { LoginLocator } from '../../src/locators/loginLocators';

export class LoginPage extends BasePage {
    private loginLocator: LoginLocator;

    constructor(page: Page) {
        super(page);
        this.loginLocator = new LoginLocator(page);
    }

    async navigateToLogin(baseURL: string) {
        await this.navigateTo(baseURL);
        await this.waitForElementIsVisible(this.loginLocator.LoginPageText);
        await this.assertElementVisible(this.loginLocator.LoginPageText);
    }

    async login(username: string, password: string) {
        await this.fill(this.loginLocator.UserNameInput, username);
        await this.fill(this.loginLocator.PasswordInput, password);
        await this.click(this.loginLocator.LoginButton);
    }

    async getLoginSuccessMessage() {
        return await this.getText(this.loginLocator.LoginSuccessMessage);
    }

    async getUserNameError() {
        return await this.getText(this.loginLocator.UserNameError);
    }

    async getPasswordError() {
        return await this.getText(this.loginLocator.PasswordError);
    }

    async getErrorMessage() {
        return await this.getText(this.loginLocator.ErrorMessage);
    }

    async getCredentialError() {
        return await this.getText(this.loginLocator.ErrorMessage);
    }

    async getUserNameFieldError() {
        return await this.getText(this.loginLocator.UserNameError);
    }

    async getPasswordFieldError() {
        return await this.getText(this.loginLocator.PasswordError);
    }

    async isUserNameErrorVisible() {
        return await this.isVisible(this.loginLocator.UserNameError);
    }

    async isPasswordErrorVisible() {
        return await this.isVisible(this.loginLocator.PasswordError);
    }

    async isCredentialErrorVisible() {
        return await this.isVisible(this.loginLocator.ErrorMessage);
    }
}