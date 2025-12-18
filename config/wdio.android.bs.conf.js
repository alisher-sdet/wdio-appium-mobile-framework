// wdio.android.bs.conf.js
import path from "path";
import { config as sharedConfig } from "./wdio.shared.conf.js";

export const config = {
	/**
	 * Берём ВСЁ базовое из shared:
	 * - framework
	 * - hooks (onPrepare / onComplete / selector monitor)
	 * - timeouts
	 * - reporters (spec)
	 */
	...sharedConfig,

	/**
	 * BrowserStack credentials
	 * (обязательно через env)
	 */
	user: process.env.BS_USER,
	key: process.env.BS_KEY,

	/**
	 * Specs — переопределяем явно
	 */
	// specs: [path.join(process.cwd(), "test/specs/**/*.js")],
	specs: [path.join(process.cwd(), "test/specs/login.local.spec.js")],
	// specs: [path.join(process.cwd(), "test/specs/login_allure.local.spec.js")],
	mochaOpts: {
		grep: "should show login button on start screen",
	},

	/**
	 * App Automate capabilities
	 */
	capabilities: [
		{
			platformName: "Android",
			"appium:automationName": "UiAutomator2",
			"appium:deviceName": "Google Pixel 8",
			"appium:platformVersion": "14.0",
			"appium:app": "bs://382163ea29dfc23cf301ecbca7608e800888b746",

			"bstack:options": {
				projectName: "ui_ma_wd",
				buildName: "ui_ma_wd Android",
				// sessionName: "placeholder", // будет перезаписано
			},
		},
	],

	/**
	 * BrowserStack service
	 */
	services: [
		[
			"browserstack",
			{
				testObservability: false, // ✅ ВЫКЛЮЧАЕМ
				testReporting: false, // ✅ ВЫКЛЮЧАЕМ

				// buildIdentifier: "ui_ma_wd_android",
			},
		],
	],

	/**
	 * ❗ ОБЯЗАТЕЛЬНО:
	 * JUnit нужен для Test Observability
	 */
	// reporters: [
	// 	"spec",
	// 	// [
	// 	// 	"junit",
	// 	// 	{
	// 	// 		// outputDir: "./reports/junit",
	// 	// 		// outputFileFormat: ({ cid }) => `results-${cid}.xml`,
	// 	// 		outputDir: path.resolve(process.cwd(), "reports/junit"),
	// 	// 		outputFileFormat: ({ cid }) => `results-${cid}.xml`,
	// 	// 		addFileAttribute: true,
	// 	// 	},
	// 	// ],
	// ],
};
