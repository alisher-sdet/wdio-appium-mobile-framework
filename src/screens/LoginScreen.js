// src/screens/LoginScreen.js
import { s } from "../utils/selector.js";
import { selectors } from "../selectors/index.js";

class LoginScreen {
	// SELECTORS (wrapped)
	get usernameInput() {
		return s(selectors.login.username);
	}

	get passwordInput() {
		return s(selectors.login.password);
	}

	get loginButton() {
		return s(selectors.login.loginButton);
	}

	get errorMessage() {
		return s(selectors.login.errorMessage);
	}

	// HELPERS
	async waitForLoginButton(timeout = 10000) {
		await this.loginButton.waitForDisplayed({ timeout });
	}

	// ACTIONS
	async login(username, password) {
		await this.waitForLoginButton();
		await this.usernameInput.clearValue();
		await this.usernameInput.setValue(username);
		await this.passwordInput.clearValue();
		await this.passwordInput.setValue(password);
		await this.loginButton.click();
	}
}

export const loginScreen = new LoginScreen();
