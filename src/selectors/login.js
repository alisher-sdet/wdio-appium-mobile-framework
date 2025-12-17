// src/selectors/login.js
// Формат: [androidSelector, iosSelector]
// Использование: s(selectors.username) / ss(...)

export const login = {
	username: ["~test-Username", "accessibility id: test-Username"],
	password: ["~test-Password", "accessibility id: test-Password"],
	loginButton: ["~test-LOGIN", "accessibility id: test-LOGIN"],
	errorMessage: ["~test-Error message", "accessibility id: test-Error message"],
	// если появятся другие элементы на экране — добавь сюда
	// example: rememberMe: ["~test-Remember", "accessibility id: test-Remember"]
};
