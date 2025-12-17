// src/screens/CheckoutScreen.js
import { s } from "../utils/selector.js";
import { selectors } from "../selectors/index.js";

class CheckoutScreen {
	get firstName() {
		return s(selectors.checkout.firstName);
	}

	get lastName() {
		return s(selectors.checkout.lastName);
	}

	get postalCode() {
		return s(selectors.checkout.postalCode);
	}

	get continueButton() {
		return s(selectors.checkout.continueButton);
	}

	get finishButton() {
		return s(selectors.checkout.finishButton);
	}

	async fillPersonInfo({ first = "", last = "", postal = "" }) {
		await this.firstName.waitForDisplayed();
		await this.firstName.clearValue();
		await this.firstName.setValue(first);

		await this.lastName.clearValue();
		await this.lastName.setValue(last);

		await this.postalCode.clearValue();
		await this.postalCode.setValue(postal);
	}

	async continue() {
		await this.continueButton.waitForDisplayed();
		await this.continueButton.click();
	}

	async finish() {
		await this.finishButton.waitForDisplayed();
		await this.finishButton.click();
	}
}

export const checkoutScreen = new CheckoutScreen();
