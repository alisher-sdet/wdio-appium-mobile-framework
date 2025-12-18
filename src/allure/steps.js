// src/allure/steps.js
import allureReporter from "@wdio/allure-reporter";

export const step = async (name, fn) => {
	allureReporter.startStep(name);
	try {
		await fn();
		allureReporter.endStep("passed");
	} catch (err) {
		allureReporter.endStep("failed");
		throw err;
	}
};
