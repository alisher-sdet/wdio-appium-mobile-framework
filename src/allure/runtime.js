import allureReporter from "@wdio/allure-reporter";

export function addRuntimeLabels() {
	try {
		const caps = browser.capabilities || {};

		// 📱 Device (у тебя уже работает)
		const device = caps["appium:deviceName"] || caps.deviceName;

		if (device) {
			allureReporter.addLabel("device", device);
		}

		// 🤖 OS (ВАЖНО: стандартный label!)
		const osName = caps.platformName; // Android
		const osVersion = caps["appium:platformVersion"] || caps.platformVersion;

		if (osName) {
			allureReporter.addLabel(
				"os",
				osVersion ? `${osName} ${osVersion}` : osName
			);
		}
	} catch (e) {
		console.warn("[ALLURE] addRuntimeLabels failed:", e.message);
	}
}
