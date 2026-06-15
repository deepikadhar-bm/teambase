import { Page, Locator } from "@playwright/test";

export class LoginLocator {
    constructor(private readonly page: Page) { }

    get LoginPageText(): Locator {
        return this.page.locator('//div[@id="login_page"]//h2[normalize-space(text())="Login to Your Account"]');
    }

    get UserNameInput(): Locator {
        return this.page.locator('//input[@id="signin_username"]');
    }

    get PasswordInput(): Locator {
        return this.page.locator('//input[@id="signin_password"]');
    }

    get LoginButton(): Locator {
        return this.page.locator('//button[@id="btnSubmit"]');
    }

    get LoginSuccessMessage(): Locator {
        return this.page.locator('//div[@class="alert alert-info" and text()="WELCOME ADMIN USER!"]');
    }

    get UserNameError(): Locator {
        return this.page.locator('//span[@class="field-validation-error text-danger" and @data-valmsg-for="UserName"]');
    }

    get PasswordError(): Locator {
        return this.page.locator('//span[@class="field-validation-error text-danger" and @data-valmsg-for="Password"]');
    }

    get ErrorMessage(): Locator {
        return this.page.locator('//div[@class="validation-summary-errors text-danger"]//ul//li');
    }
}