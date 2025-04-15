/* This file contains all the methods used to manipulate the DOM Api in a more easy way */

/**
 * Creates an element with id and classes.
 *
 * @param {string} selector - String that contains the tag, id and classes which will be created.
 * @returns {element} The element created by parsing the selector.
 *
 * @example
 * const result = dom.constructElement("div#login-btn.btn")
 * console.log(result); // <div id="login-btn" class="btn"></div>
 */
export function constructElement(selector) {
	const tag = selector.match(/^[^#.\[\]]+/)[0];
	let ids = null;
	let classes = null;
	let attributes = null;
	
	const element = document.createElement(tag);
	selector = selector.substring(tag.length, selector.length);
	if (selector.indexOf('#') !== -1) {
		ids = selector.substring(selector.indexOf('#') + 1,
			selector.indexOf('.') !== -1 ? selector.indexOf('.') : selector.length)
			.split("#").join(" ");
		element.id = ids;
	}
	if (selector.indexOf('.') !== -1 && (selector.indexOf('[') === -1 || selector.indexOf('.') < selector.indexOf('['))) {
		classes = selector.substring(selector.indexOf('.') + 1,
			selector.indexOf('[') !== -1 ? selector.indexOf("[") : selector.length)
			.split(".").join(" ");
		element.className = classes;
	}
	if (selector.indexOf('[') !== -1) {
		attributes = selector.match(/(?<=\[).+?(?=\])/g);
		for (let i = 0; i < attributes.length; i++) {
			const splittedAttr = attributes[i].split("=");
			element.setAttribute(splittedAttr[0], splittedAttr[1]);
		}
	}
	return (element);
}

/**
 * Creates an element with id and classes.
 *
 * @param {string} selector - String that contains the tag, id and classes which will be created.
 * @param {number} nbrTimes - Number of times you want to create the element
 * @returns {array} An array containing the elements created.
 *
 * @example
 * const result = dom.constructManyElements("div#login-btn.btn", 4)
 * console.log(result); // [div#login-btn.btn, div#login-btn.btn, div#login-btn.btn, div#login-btn.btn]
 */
export function constructManyElements(selector, nbrTimes) {
	const arr = [];
	for (let i = 0; i < nbrTimes; i++) {
		arr[i] = constructElement(selector);
	}
	return (arr);
}

/**
 * Creates an element with id and classes.
 *
 * @param {element} element - Html father element.
 * @param {array} appends - Array of Html element which will be appended to element
 *
 * @example
 * let div = dom.constructElement("div")
 * let h1 = dom.constructManyElements("h1", 2)
 * dom.appendManyElement(div, h1)
 * Result :	<div>
 * 				<h1></h1>
 *				<h1></h1>
 * 			</div>
 */
export function appendManyElements(element, appends) {
	appends.forEach(append => {
		element.append(append);
	})
}

/**
 * Creates an element with id and classes.
 *
 * @param {element} element - Html element.
 * @param {CssClasses} appends - Array of Css classes to add to element
 *
 * @example
 * let div = dom.constructElement("div")
 * dom.addClassesToElement(div, ["text-center", "text-white"])
 * Result: <div class="text-center text-white"></div>
 */
export function addClassesToElement(element, CssClasses) {
	CssClasses.forEach(CssClass => {
		element.classList.add(CssClass);
	})
}

export function setElementContent(elements, content) {
	for (let i = 0; i < elements.length; i++) {
		elements[i].innerHTML = content[i];
	}
}
