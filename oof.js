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
function circle(ctx,x,y,r,endAngle = 360,fillColor = "0") {
	ctx.beginPath();
	
	ctx.arc(x, y, r, 0, (endAngle/180) * Math.PI);
	if(fillColor != "0") {
		ctx.fillStyle = fillColor;
		ctx.fill();
	}
	ctx.stroke();
}
function checkCollide(pointX, pointY, objectx, objecty, objectw, objecth) { // pointX, pointY belong to one rectangle, while the object variables belong to another rectangle
	var oTop = objecty;
	var oLeft = objectx; 
	var oRight = objectx+objectw;
	var oBottom = objecty+objecth; 

	if(pointX > oLeft && pointX < oRight){
		 if(pointY > oTop && pointY < oBottom ){
			  return 1;
		 }
	}
	else
		 return 0;
};
function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function rgbToHex(rgb) {
	r = rgb.r;
	g = rgb.g;
	b = rgb.b;
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
function del(thing,parent) {
	parent.removeChild(thing);
}
function place(thing) {
	//setInterval(place(thing),1000)
	document.body.appendChild(thing);
}
function place(thing,parent) {
	parent.appendChild(thing);
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
//the most retarded person :facepalm: THE STRING PROTOTYEP ALERADY HAS INCLUDES
function findString(string,stringToFind) {
	return string.indexOf(stringToFind) != -1 ? true : false;
}
function sound(src) {
	this.sound = document.createElement("audio");
	this.sound.src = src;
	this.sound.setAttribute("preload", "auto");
	this.sound.setAttribute("controls", "none");
	this.sound.style.display = "none";
	document.body.appendChild(this.sound);
	this.setVolume = function(vol) {
		this.sound.volume = vol;
		return this;
	}
	this.play = function(){
	  this.sound.play();
	  this.sound.onended = function(event) {
		  console.log(this);
		  del(this,this.parentElement);
	  }
	}
	this.stop = function(){
	  this.sound.pause();
	}
}
function removeAt(array,index) {
	array.splice(index,1);
}