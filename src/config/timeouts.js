// src/config/timeouts.js
// Центральный конфиг таймаутов для проекта — изменяй здесь, чтобы повлиять на все экраны.
export const TIMEOUTS = {
	DEFAULT_WAIT: 10000, // стандартное ожидание (ms)
	SHORT_WAIT: 3000, // короткие ожидания
	LONG_WAIT: 15000, // долгие ожидания (медленные устройства / CI)
	STABILIZE_WAIT: 3000, // стабилизация текста/контента после действий
	POLL_INTERVAL: 200, // интервал опроса для waitUntil
};

// // Пример (для CI, более надёжно):
// export const TIMEOUTS = {
//   DEFAULT_WAIT: 15000,
//   SHORT_WAIT: 5000,
//   LONG_WAIT: 30000,
//   STABILIZE_WAIT: 5000,
//   POLL_INTERVAL: 250
// };

// // Если нужно временно ускорить один конкретный тест, можно передать таймаут в вызов:
// const prices = await productsScreen.getItemPrices({ waitTimeout: 4000 });

// Если нужно увеличить/уменьшить таймауты вручную, есть 2 варианта:
// - Глобально: wdio.conf.js -> waitforTimeout, mocha.timeout.
// - В тестах/методах: например await productsScreen.waitForDisplayed(20000).
