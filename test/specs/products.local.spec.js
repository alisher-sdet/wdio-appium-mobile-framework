// test/specs/products.local.spec.js
import { users } from "../../src/data/users.js";
import { loginScreen } from "../../src/screens/LoginScreen.js";
import { productsScreen } from "../../src/screens/ProductsScreen.js";

describe("Sauce Labs Sample App — Products", () => {
	before(async () => {
		await loginScreen.login(users.standard.username, users.standard.password);
	});

	beforeEach(async () => {
		await productsScreen.waitForDisplayed();
	});

	it("should show at least one product", async () => {
		const names = await productsScreen.getItemNames();
		expect(names.length).toBeGreaterThan(0);
		console.log("Products:", names);
	});

	it("should sort products by price low to high", async () => {
		const pricesBefore = await productsScreen.getItemPrices();
		console.log("Prices before sort:", pricesBefore);

		await productsScreen.sortByPriceLowToHigh();

		const pricesAfter = await productsScreen.getItemPrices();
		console.log("Prices after sort:", pricesAfter);

		expect(pricesAfter.length).toBeGreaterThan(0);
		const sortedCopy = [...pricesAfter].sort((a, b) => a - b);
		expect(pricesAfter).toEqual(sortedCopy);
	});
});
