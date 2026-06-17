import { Page } from "@playwright/test";
import { BasePage } from "@pages/basePage";
import { LoginLocator } from '../pages/elements/loginLocators';

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
        await this.assertElementVisible(this.loginLocator.LoginSuccessMessage);
    }

};