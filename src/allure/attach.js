// src/allure/attach.js
import allureReporter from "@wdio/allure-reporter";

export const attachScreenshot = async (name = "Screenshot") => {
	const screenshot = await browser.takeScreenshot();
	allureReporter.addAttachment(
		name,
		Buffer.from(screenshot, "base64"),
		"image/png"
	);
};

export const attachPageSource = async () => {
	const source = await browser.getPageSource();
	allureReporter.addAttachment("Page Source", source, "text/xml");
};

export function attachJson(name, json) {
	allureReporter.addAttachment(
		name,
		JSON.stringify(json, null, 2),
		"application/json"
	);
}
