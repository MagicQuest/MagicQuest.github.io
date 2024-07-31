function clone(thing) {
	thing.cloneNode(true);
}
function SetAt(thing,func) {
	thing.setAttribute('onclick',func);
}
function del(thing) {
	document.body.removeChild(thing);
}
function place(thing) {
	//setInterval(place(thing),1000)
	document.body.appendChild(thing);
}
function create(thing) {
	return document.createElement(thing);
}
function random(max) {
	max++;
	return Math.floor(Math.random() * max);
}