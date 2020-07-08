var color = {
	red : [255,0,0],
	darkRed : [200,0,0],
	darkestRed : [100,0,0],
	green : [0,255,0],
	darkGreen : [0,200,0],
	darkestGreen : [0,100,0],
	blue : [0,0,255],
	darkBlue : [0,0,200],
	darkestBlue : [0,0,100]
}
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
/**
 * @summary this is just a copy of the python function lol
 * @since 9:03PM JULY4
 * @param {*} bruh 
 */
function choice(bruh) {
	return bruh[random(0,bruh.length-1)];
}
function get(doc) {
	return document.getElementById(doc);
}

function sound(src) {
	this.sound = document.createElement("audio");
	this.sound.src = src;
	this.sound.setAttribute("preload", "auto");
	this.sound.setAttribute("controls", "none");
	this.sound.style.display = "none";
	document.body.appendChild(this.sound);
	this.play = function(){
	  this.sound.play();
	}
	this.stop = function(){
	  this.sound.pause();
	}
}
function lmaolmaolmaolmao() {
		let lmao = localStorage.getItem("epicGifs").split(" ");
		print(lmao);
		lmao.forEach(gif => {
			var newVideo = create("video");
			newVideo.setAttribute("autoplay","");
			newVideo.name = "media";
			newVideo.setAttribute("loop","");
			newVideo.innerHTML = `<source src=${gif} type="video/mp4">`
			//var newFrame = create("iframe");
			//newFrame.src= gif;
			//newFrame.width = 500;
			//newFrame.height = 500;
			place(newVideo);
		});
}