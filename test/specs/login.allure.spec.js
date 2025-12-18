// test/specs/login.allure.spec.js
import { users } from "../../src/data/users.js";
import { loginScreen } from "../../src/screens/LoginScreen.js";
import { productsScreen } from "../../src/screens/ProductsScreen.js";

import { step, feature, story, severity } from "../../src/allure/index.js";

const APP_PACKAGE = "com.swaglabsmobileapp";

describe("Login", () => {
	before(async () => {
		await loginScreen.waitForLoginButton();
	});

	afterEach(async () => {
		await driver.terminateApp(APP_PACKAGE).catch(() => {});
		await driver.activateApp(APP_PACKAGE);
		await loginScreen.waitForLoginButton();
	});

	it("should login with standard user", async () => {
		feature("Login");
		story("Happy path");
		severity("blocker");

		await step("Login as standard user", async () => {
			await loginScreen.login(users.standard.username, users.standard.password);
		});

		await step("Verify Products screen is displayed", async () => {
			await productsScreen.waitForDisplayed();
			await expect(productsScreen.title).toBeDisplayed();
		});
	});
});
