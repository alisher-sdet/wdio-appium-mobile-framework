//selectorMonitorContract.js

export const SelectorMonitorContract = {
	isEnabled() {
		return Boolean(process.env.SELECTOR_MONITOR || process.env.DEBUG_SELECTORS);
	},

	shouldCreateArtifacts() {
		return this.isEnabled();
	},

	shouldRunReport() {
		return this.isEnabled();
	},

	projectRoot() {
		return process.env.PROJECT_ROOT || process.cwd();
	},

	artifactsDir() {
		return `${this.projectRoot()}/artifacts`;
	},
};
