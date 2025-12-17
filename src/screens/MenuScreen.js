// src/screens/MenuScreen.js
import { s } from "../utils/selector.js";
import { selectors } from "../selectors/index.js";

class MenuScreen {
	get menuButton() {
		return s(selectors.menu.menuButton);
	}

	get logoutButton() {
		return s(selectors.menu.logoutButton);
	}

	get resetAppStateButton() {
		return s(selectors.menu.resetAppState);
	}

	async openMenu() {
		await this.menuButton.waitForDisplayed();
		await this.menuButton.click();
	}

	async logout() {
		await this.logoutButton.waitForDisplayed();
		await this.logoutButton.click();
	}

	async resetAppState() {
		await this.resetAppStateButton.waitForDisplayed();
		await this.resetAppStateButton.click();
	}
}

export const menuScreen = new MenuScreen();
