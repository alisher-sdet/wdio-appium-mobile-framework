// src/screens/CartScreen.js
import { s, ss } from "../utils/selector.js";
import { selectors } from "../selectors/index.js";

class CartScreen {
	get cartButton() {
		return s(selectors.cart.cartButton);
	}

	get checkoutButton() {
		return s(selectors.cart.checkoutButton);
	}

	get cartItemTitles() {
		return ss(selectors.cart.cartItemTitle);
	}

	async openCart() {
		await this.cartButton.waitForDisplayed();
		await this.cartButton.click();
	}

	async checkout() {
		await this.checkoutButton.waitForDisplayed();
		await this.checkoutButton.click();
	}

	async getCartItems() {
		const els = await this.cartItemTitles;
		if (!els || els.length === 0) return [];
		const out = [];
		for (const el of els) {
			out.push(await el.getText().catch(() => ""));
		}
		return out;
	}
}

export const cartScreen = new CartScreen();
