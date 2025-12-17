/* to start run : npx wdio config/wdio.android.conf.js / npm run android | npm run ios
- - - - - - - - - - - - - - - - - - - - - - - - - - - */
// test/specs/login.local.spec.js
import { users } from "../../src/data/users.js";
import { loginScreen } from "../../src/screens/LoginScreen.js";
import { productsScreen } from "../../src/screens/ProductsScreen.js";
import allureReporter from "@wdio/allure-reporter";

const APP_PACKAGE = "com.swaglabsmobileapp";

describe("Sauce Labs Sample App — Login", () => {
	// before(async () => {
	// 	await loginScreen.waitForLoginButton();
	// });
	before(async () => {
		allureReporter.startStep("Wait for login screen");
		await loginScreen.waitForLoginButton();
		allureReporter.endStep("passed");
	});

	afterEach(async () => {
		await driver.terminateApp(APP_PACKAGE).catch(() => {});
		await driver.activateApp(APP_PACKAGE);
		await loginScreen.waitForLoginButton();
	});

	// it("should show login button on start screen", async () => {
	// 	await expect(loginScreen.loginButton).toBeDisplayed();
	// });
	it("should show login button on start screen", async () => {
		allureReporter.addFeature("Login");
		allureReporter.addStory("Start screen");
		allureReporter.addSeverity("critical");

		allureReporter.startStep("Verify Login button is visible");
		await expect(loginScreen.loginButton).toBeDisplayed();
		allureReporter.endStep("passed");
	});

	it("should show error for locked_out_user", async () => {
		await loginScreen.login(users.locked.username, users.locked.password);
		await expect(loginScreen.errorMessage).toBeDisplayed();
	});

	it("should login with standard user (happy path)", async () => {
		await loginScreen.login(users.standard.username, users.standard.password);
		await productsScreen.waitForDisplayed();
		await expect(productsScreen.title).toBeDisplayed();
	});
});
