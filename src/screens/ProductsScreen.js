// src/screens/ProductsScreen.js
import { s, ss } from "../utils/selector.js";
import { products as selectors } from "../selectors/products.js";
import { TIMEOUTS } from "../config/timeouts.js";

class ProductsScreen {
	get selectors() {
		return selectors;
	}

	/* ---------- ELEMENT GETTERS ---------- */
	get title() {
		return s(this.selectors.screen);
	}

	get sortButton() {
		return s(this.selectors.sortButton);
	}

	/**
	 * Возвращает элемент опции сортировки "Price (low to high)".
	 * Ожидает, что в selectors.androidSortPriceLowToHigh либо:
	 *  - уже хранится строка с префиксом 'android=' (preferred), или
	 *  - хранится сырой uiAutomator выражение (без префикса) — тогда мы добавим префикс.
	 */
	get sortPriceLowToHighOption() {
		if (driver.isAndroid) {
			const raw = this.selectors.androidSortPriceLowToHigh;
			if (!raw) {
				throw new Error(
					"No androidSortPriceLowToHigh selector provided in selectors"
				);
			}
			// raw может быть строкой или массив [android, ios]
			const sel = Array.isArray(raw) && raw.length > 0 ? raw[0] : String(raw);

			// если селектор уже содержит префикс android=, используем как есть
			if (sel.startsWith("android=")) {
				return $(sel);
			}
			// иначе добавим префикс
			return $(`android=${sel}`);
		}

		// iOS branch: если есть селектор — используем s() (может быть accessibility id / predicate)
		const ios = this.selectors.iosSortPriceLowToHigh;
		if (ios) return s(ios);

		throw new Error("sortPriceLowToHighOption: iOS selector not provided");
	}

	/* ---------- Helpers ---------- */
	async _normalizeElements(raw) {
		if (Array.isArray(raw)) return raw;
		if (raw && typeof raw === "object") {
			if (Array.isArray(raw.value)) return raw.value;
			if (raw.ELEMENT || raw["element-6066-11e4-a52e-4f735466cecf"])
				return [raw];
		}
		return [];
	}

	async _elements(selector) {
		// ss(selector) возвращает $$(chosenSelector) — обычно массив элементов
		const raw = await ss(selector);
		return this._normalizeElements(raw);
	}

	/* ---------- Waiting ---------- */
	async waitForDisplayed(timeout = TIMEOUTS.DEFAULT_WAIT) {
		await this.title.waitForDisplayed({ timeout });
	}

	async _waitForElementsToAppear(
		selector,
		{ timeout = TIMEOUTS.LONG_WAIT, interval = TIMEOUTS.POLL_INTERVAL } = {}
	) {
		const sel = selector;
		await browser.waitUntil(
			async () => {
				const arr = await this._elements(sel);
				return Array.isArray(arr) && arr.length > 0;
			},
			{
				timeout,
				interval,
				timeoutMsg: `Elements ${JSON.stringify(
					sel
				)} did not appear within ${timeout}ms`,
			}
		);

		return this._elements(sel);
	}

	/* ---------- Data getters ---------- */
	async getItemNames({ waitTimeout = TIMEOUTS.LONG_WAIT } = {}) {
		await this.waitForDisplayed();
		const els = await this._waitForElementsToAppear(this.selectors.itemTitle, {
			timeout: waitTimeout,
		});
		const out = [];
		for (const el of els) {
			out.push(await el.getText().catch(() => ""));
		}
		return out;
	}

	async getItemPrices({ waitTimeout = TIMEOUTS.LONG_WAIT } = {}) {
		await this.waitForDisplayed();
		const els = await this._waitForElementsToAppear(this.selectors.itemPrice, {
			timeout: waitTimeout,
		});

		if (!els || els.length === 0) {
			throw new Error(
				"No price elements found with selector " +
					JSON.stringify(this.selectors.itemPrice)
			);
		}

		const texts = [];
		for (const el of els) {
			texts.push(String((await el.getText().catch(() => "")) ?? "").trim());
		}

		const prices = texts
			.map((t) => t.replace(/[^0-9,.\-]/g, "").replace(",", "."))
			.map((s) => parseFloat(s))
			.filter((n) => Number.isFinite(n));

		if (prices.length === 0) {
			throw new Error(
				"Price elements found but none could be parsed to numbers. Raw texts: " +
					JSON.stringify(texts)
			);
		}

		return prices;
	}

	/* ---------- Actions ---------- */
	async sortByPriceLowToHigh() {
		// snapshot length before
		let beforeLen = 0;
		try {
			const before = await this._elements(this.selectors.itemPrice);
			beforeLen = before.length;
		} catch (e) {
			beforeLen = 0;
		}

		// нажимаем кнопку сортировки через s()
		await s(this.selectors.sortButton).click();

		// получаем элемент опции в зависимости от платформы и кликаем
		const option = this.sortPriceLowToHighOption;
		await option.waitForDisplayed({ timeout: TIMEOUTS.SHORT_WAIT });
		await option.click();

		// wait list changed / appeared
		await browser.waitUntil(
			async () => {
				const arr = await this._elements(this.selectors.itemPrice);
				if (arr.length === 0) return false;
				if (beforeLen === 0) return arr.length > 0;
				return arr.length !== beforeLen || arr.length > 0;
			},
			{
				timeout: TIMEOUTS.LONG_WAIT,
				interval: TIMEOUTS.POLL_INTERVAL,
				timeoutMsg: "Price items did not appear/change after sorting",
			}
		);

		// stabilization: every element has non-empty text
		await browser.waitUntil(
			async () => {
				const arr = await this._elements(this.selectors.itemPrice);
				if (arr.length === 0) return false;
				for (const el of arr) {
					const txt = await el.getText().catch(() => "");
					if (!txt || txt.trim().length === 0) return false;
				}
				return true;
			},
			{
				timeout: TIMEOUTS.STABILIZE_WAIT,
				interval: Math.max(100, TIMEOUTS.POLL_INTERVAL),
				timeoutMsg: "Price texts not stable after sorting",
			}
		);
	}
}

export const productsScreen = new ProductsScreen();
