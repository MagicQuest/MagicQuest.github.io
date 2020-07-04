function print(string) {
	console.log(string);
}
function sleep( seconds ) {
	seconds = seconds * 1000
	var now = new Date().getTime();
	while ( new Date().getTime() < now + seconds )
	{
	  /* do nothing; this will exit once it reaches the time limit */
	  /* if you want you could do something and exit */
	}
}
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function clone(thing) {
	thing.cloneNode(true);
}
function SetAt(thing,func) {
	thing.setAttribute(thing,func);
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
//lmao this is deprecated because i didn't know that i could do this with the ! operator
/**
 * @deprecated migga just use the ! operator :face_palm:
 * @param {*} thing 
 */                   
function not(thing) {                      
	if(thing == true) {                      
		return false;                      
	}                      
	if(thing == false) {                      
		return true                      
	}                       
}                      
function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1) ) + min;
}
function get(doc) {
	return document.getElementById(doc);
}