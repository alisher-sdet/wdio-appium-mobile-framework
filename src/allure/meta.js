// src/allure/meta.js
import allureReporter from "@wdio/allure-reporter";

export const feature = (name) => {
	allureReporter.addFeature(name);
};

export const story = (name) => {
	allureReporter.addStory(name);
};

export const severity = (level) => {
	allureReporter.addSeverity(level);
};

export const owner = (name) => {
	allureReporter.addOwner(name);
};

export const tag = (name) => {
	allureReporter.addTag(name);
};

// export const deviceInfo = () => {
// 	const caps = browser.capabilities || {};

// 	const device =
// 		caps["appium:deviceName"] ||
// 		caps.deviceName ||
// 		caps.device ||
// 		"unknown device";

// 	const platformName =
// 		caps.platformName || (caps.os ? "Android" : "unknown platform");

// 	const platformVersion =
// 		caps["appium:platformVersion"] ||
// 		caps.platformVersion ||
// 		caps.os_version ||
// 		"";

// 	// ✅ ВСЕГДА добавляем
// 	allureReporter.addLabel("device", device);
// 	allureReporter.addLabel(
// 		"platform",
// 		platformVersion ? `${platformName} ${platformVersion}` : platformName
// 	);
// };
