// src/selectors/products.js
// Формат: [androidSelector, iosSelector]
// Для команд типа android=new UiSelector() — помещаем android-представление в первый элемент.

export const products = {
	screen: ["~test-PRODUCTS", "accessibility id: test-PRODUCTS"],
	itemTitle: ["~test-Item title", "accessibility id: test-Item title"],
	itemPrice: ["~test-Price", "accessibility id: test-Price"],
	sortButton: [
		"~test-Modal Selector Button",
		"accessibility id: test-Modal Selector Button",
	],
	// androidSortPriceLowToHigh: android string first, iOS maybe a predicate or null
	androidSortPriceLowToHigh: [
		'android=new UiSelector().text("Price (low to high)")',
		'predicate: name == "Price (low to high)"',
	],
	// можно добавить дополнительные селекторы: productImage, addToCartButton и т.д.
};
