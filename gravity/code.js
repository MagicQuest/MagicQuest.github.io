var rows = 75;
var cols = 150;

var grid = new Array(rows);
var nextGrid = new Array(rows);

var timer;
var reproductionTime = 50;

var down = false;
var gravity;

var gravButton = document.getElementById("gravity")
var pauseButton = document.getElementById("pause")

var playing = true;
function initializeGrids() {
    for (var i = 0; i < rows; i++) {
        grid[i] = new Array(cols);
        nextGrid[i] = new Array(cols);
    }
}

function resetGrids() {
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            grid[i][j] = 0;
            nextGrid[i][j] = 0;
        }
    }
}

function copyAndResetGrid() {
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            grid[i][j] = nextGrid[i][j];
            nextGrid[i][j] = 0;
        }
    }
}

// Initialize
function initialize() {
    createTable();
    initializeGrids();
    resetGrids();
    setupControlButtons();
    play();
}

// Lay out the board
function createTable() {
    var gridContainer = document.getElementById('gridContainer');
    if (!gridContainer) {
        // Throw error
        console.error("Problem: No div for the drid table!");
    }
    var table = document.createElement("table");
    
    for (var i = 0; i < rows; i++) {
        var tr = document.createElement("tr");
        for (var j = 0; j < cols; j++) {//
            var cell = document.createElement("td");
            cell.setAttribute("id", i + "_" + j);
            cell.setAttribute("class", "dead");
            cell.onclick = cellClickHandler;
            tr.appendChild(cell);
        }
        table.appendChild(tr);
    }
    gridContainer.appendChild(table);
    }

    function cellClickHandler() {
        
        var rowcol = this.id.split("_");
        var row = rowcol[0];
        var col = rowcol[1];
        console.log("row:" + row + "\n" + "col:" + col)
        var classes = this.getAttribute("class");
        if(classes.indexOf("live") > -1) {
            this.setAttribute("class", "dead");
            grid[row][col] = 0;
        } else {
            this.setAttribute("class", "live");
            grid[row][col] = 1;
        }
        
    }

    function updateView() {
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                var cell = document.getElementById(i + "_" + j);
                if (grid[i][j] == 0) {
                    cell.setAttribute("class", "dead");
                } else {
                    cell.setAttribute("class", "live");
                }
            }
        }
    }

function setupControlButtons() {
    // button to start

    //var modeButton = document.getElementById("mode")
    gravButton.onclick = gravButtonHandler;

    pauseButton.onclick = pauseButtonHandler;
}
function pauseButtonHandler() {
    if(!playing) {
        playing = true;
        pauseButton.innerHTML = "Pause"
        play()
    }else {
        playing = false;
        pauseButton.innerHTML = "Continue"
    }

}
function gravButtonHandler() {
    if(gravity == true) {
        gravity = false;
    }else {
        gravity = true
    }
}
window.addEventListener("mousedown",() => {
    down = true;
})
window.addEventListener("mouseup",() => {
    down = false;
})
/*window.addEventListener("keydown",(event) => {
    console.log(event)
    if(event.key == " ") {
        if (playing) {
            console.log("Pause the game");
            playing = false;
            startButton.innerHTML = "Continue";
            clearTimeout(timer);
        } else {
            if(mode == "clr") {
                mode = lastmode
            }
            console.log("Continue the game");
            playing = true;
            startButton.innerHTML = "Pause";
            play();
        }
    }
})*/


// run the life game
function play() {
    //console.log("bruh")
    //if(down) {
   //     cellClickHandler();
    //}
    
    
    if (playing) {
        computeNextGen();
        timer = setTimeout(play, reproductionTime);
    }
}

function computeNextGen() {
    //console.log("bruh")
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            //well boys we are going to have to use a courintie (coroutine)
            oof(i,j)
            
            //(function (j) {
              // setTimeout(function() {
                    //oof();
             //   },1000*j);
           // })(j)
            //setTimeout(() => {
                //consoasdle.log("nugga")
                
            //},10000)
            
        }
    }
    
    // copy NextGrid to grid, and reset nextGrid
    //copyAndResetGrid();
    // copy all 1 values to "live" in the table
    updateView();
}
////function oof(i,j) {
 //   applyRules(i, j);
//}
function oof(i,j) {
    setTimeout(function() { 
        applyRules(i, j);
    },i * 100); 
}

// RULES
// Any live cell with fewer than two live neighbours dies, as if caused by under-population.
// Any live cell with two or three live neighbours lives on to the next generation.
// Any live cell with more than three live neighbours dies, as if by overcrowding.
// Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

function applyRules(row, col) {
    var numNeighbors = countNeighbors(row, col);
    //asks if this position is alive
    if (grid[row][col] == 1) {
        //console.log(row+1)
        if(row+1 < rows) {
            if(grid[row+1][col] != 1) {
                grid[row][col] = 0
            grid[row+1][col] = 1
            }
            console.log(row+1)
            
        }
    if(grid[row][col] == 0) {
        if(numNeighbors == 1) {
            grid[row][col] = 1
        }
    }
        //if(row+1 != rows) {
            //grid[row][col] = 1
           // grid[row+1][col] = 1
        //}
    }
}
function countNeighbors(row, col) {
    var count = 0;
    if (row-1 >= 0) {
        if (grid[row-1][col] == 1) count++;
    }
    if (row-1 >= 0 && col-1 >= 0) {
        if (grid[row-1][col-1] == 1) count++;
    }
    if (row-1 >= 0 && col+1 < cols) {
        if (grid[row-1][col+1] == 1) count++;
    }
    if (col-1 >= 0) {
        if (grid[row][col-1] == 1) count++;
    }
    if (col+1 < cols) {
        if (grid[row][col+1] == 1) count++;
    }
    if (row+1 < rows) {
        if (grid[row+1][col] == 1) count++;
    }
    if (row+1 < rows && col-1 >= 0) {
        if (grid[row+1][col-1] == 1) count++;
    }
    if (row+1 < rows && col+1 < cols) {
        if (grid[row+1][col+1] == 1) count++;
    }
    return count;
}


// Start everything
window.onload = initialize;