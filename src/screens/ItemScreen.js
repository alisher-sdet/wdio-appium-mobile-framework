// src/screens/ItemScreen.js
import { s } from "../utils/selector.js";
import { selectors } from "../selectors/index.js";

class ItemScreen {
	get title() {
		return s(selectors.item.title);
	}

	get addToCartButton() {
		return s(selectors.item.addToCartButton);
	}

	get backButton() {
		return s(selectors.item.backButton);
	}

	async addToCart() {
		await this.addToCartButton.waitForDisplayed();
		await this.addToCartButton.click();
	}

	async back() {
		await this.backButton.waitForDisplayed();
		await this.backButton.click();
	}
}

export const itemScreen = new ItemScreen();
