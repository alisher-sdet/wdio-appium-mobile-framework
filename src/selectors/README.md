# Selectors — правила и примеры

Папка `src/selectors/` хранит объекты-селекторы для экранов (Android / iOS).
Цель: одна точка правды для локаторов, простой формат, легко редактировать.

## Формат

Каждый файл экспортирует объект (например `export const products = { ... }`).
Значение селектора — **строка** или **массив из двух строк**:

- строка: используется как передано — подходит, если селектор одинаков для обеих ОС.
- массив [android, ios]: предпочтение выбирается автоматически (см. util `s`/`ss`).

Примеры:

```js
// одинаково для обеих ОС
itemTitle: "~test-Item title";

// специфично: [androidSelector, iosSelector]
itemPrice: ["~test-Price", "accessibility id: test-Price"];

// android-only (если нет iOS селектора)
androidOnly: ['android=new UiSelector().text("Price (low to high)")', null];
```
