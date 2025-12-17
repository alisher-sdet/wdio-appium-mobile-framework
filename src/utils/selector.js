// src/utils/selector.js
// import selectorMonitor from "./selectorMonitor.js";
import { getSelectorMonitor } from "./selectorMonitor.js";
const selectorMonitor = getSelectorMonitor();

/**
 * Утилиты для выбора селекторов по платформе (Android / iOS)
 * Usage:
 *   s(['~test-Price', 'accessibility id: test-Price'])  -> element
 *   ss(['~test-Price', 'accessibility id: test-Price']) -> elements array
 */

export function _choose(selector) {
	if (Array.isArray(selector)) {
		if (typeof driver !== "undefined" && driver.isAndroid) {
			return selector[0];
		}
		return selector[1] ?? selector[0];
	}
	return selector;
}

function _platformName() {
	if (typeof driver === "undefined") return "unknown";
	if (driver.isAndroid) return "android";
	if (driver.isIOS) return "ios";
	return "unknown";
}

export function s(selector) {
	const chosenRaw = _choose(selector);

	// if already a WDIO element - return as is
	if (
		chosenRaw &&
		typeof chosenRaw === "object" &&
		(chosenRaw.ELEMENT || chosenRaw["element-6066-11e4-a52e-4f735466cecf"])
	) {
		// перед record(...) в s()
		const chosen = String(chosenRaw);
		console.debug(
			`[s] platform=${_platformName()} input=${JSON.stringify(
				selector
			)} -> chosen=${chosen}`
		);
		selectorMonitor.record({
			input: selector,
			chosen,
			platform: _platformName(),
			kind: "ss",
		});

		selectorMonitor.record({
			input: selector,
			chosen: "<existing-element>",
			platform: _platformName(),
			kind: "s",
		});
		return chosenRaw;
	}

	// if chosenRaw is a string and looks like special android=... locator, pass as-is to $
	const chosen = String(chosenRaw);

	// record usage
	selectorMonitor.record({
		input: selector,
		chosen,
		platform: _platformName(),
		kind: "ss",
	});

	return $(chosen);
}

export function ss(selector) {
	const chosenRaw = _choose(selector);

	if (
		chosenRaw &&
		typeof chosenRaw === "object" &&
		(chosenRaw.ELEMENT || chosenRaw["element-6066-11e4-a52e-4f735466cecf"])
	) {
		selectorMonitor.record({
			input: selector,
			chosen: "<existing-element-array>",
			platform: _platformName(),
			kind: "ss",
		});
		return [chosenRaw];
	}

	const chosen = String(chosenRaw);
	console.debug(
		`[ss] platform=${_platformName()} input=${JSON.stringify(
			selector
		)} -> chosen=${chosen}`
	);
	selectorMonitor.record({
		input: selector,
		chosen,
		platform: _platformName(),
		kind: "ss",
	});

	return $$(chosen);
}

// convenience export for monitor
export { selectorMonitor };
