// src/selectors/index.js
// Примечание: каждый селектор — массив [android, ios].
// Наша утилита src/utils/selector.js (_choose, s, ss) уже умеет выбирать по OS.
import { login } from "./login.js";
import { products } from "./products.js";
import { cart } from "./cart.js";
import { item } from "./item.js";
import { menu } from "./menu.js";
import { checkout } from "./checkout.js";

export const selectors = {
	login,
	products,
	cart,
	item,
	menu,
	checkout,
};
