// wdio.android.conf.js
import path from "path";
import { config as sharedConfig } from "./wdio.shared.conf.js";

export const config = {
	...sharedConfig,
	port: 4723,
	specs: [path.join(process.cwd(), "./test/specs/**/*.js")],
	capabilities: [
		{
			platformName: "Android",
			"appium:automationName": "UiAutomator2",
			"appium:deviceName": "Pixel 9 Pro",
			"appium:platformVersion": "16.0",
			"appium:app": path.join(
				process.cwd(),
				"./app/android/Android.SauceLabs.Mobile.Sample.app.2.7.1.apk"
			),
			"appium:autoGrantPermissions": true,
			"appium:newCommandTimeout": 3600,
			"appium:appWaitActivity": "*",
		},
	],
	services: ["appium"],
};
