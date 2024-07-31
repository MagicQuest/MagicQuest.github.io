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
	return Math.floor(Math.random() * max)// + Math.floor(Math.random() * max));
}
function randomColor(style,thing,number) {
	console.log(style)
	if (number == 1) {
		thing.style = style + "background-color:IndianRed;"
	}else if (number == 2) {
		thing.style = style + "background-color:LightCoral;"
	}else if (number == 3) {
		thing.style.background = style + "background-color:Salmon;"
	}
	
}
i = 1
function myLoop (code,currentNumber,max) {           //  create a loop function
   setTimeout(function () {    //  call a 3s setTimeout when the loop is called
      code(code)
      i++;                     //  increment the counter
      if (i < 10) {            //  if the counter < 10, call the loop function
         myLoop(code);             //  ..  again which will trigger another 
      }                        //  ..  setTimeout()
   }, 3000)
}

//myLoop(); 
function Trans(style,thing) {
	myLoop(console.log("hit"))
	thing.style.transform = "translate(50px,100px);"
}