const canvas = document.getElementById("canvas");

canvas.width = innerWidth;
canvas.height = innerHeight;

const context = canvas.getContext('2d');
const pattern = context.createPattern(checker, "repeat"); //first time EVER using a pattern

function animate() {
    //context.clearRect(0,0,innerWidth, innerHeight);
    
    if(nodegraph) {
        context.fillStyle = pattern;
        context.fillRect(mouse.x-25, mouse.y-25, 50, 50);
    }else {
        context.clearRect(0,0,innerWidth,innerHeight);
    }

    requestAnimationFrame(animate);
}

animate();