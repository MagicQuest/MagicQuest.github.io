var rows = 75;
var cols = 150;

var playing = false;

var grid = new Array(rows);
var nextGrid = new Array(rows);

var timer;
var reproductionTime = 50;

var mode = "default"
var lastmode;

var down = false;

var modeButton = document.getElementById("mode")
var startButton = document.getElementById('start');
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
    
    startButton.onclick = startButtonHandler;
    
    // button to clear
    var clearButton = document.getElementById('clear');
    clearButton.onclick = clearButtonHandler;
    
    // button to set random initial state
    var randomButton = document.getElementById("random");
    randomButton.onclick = randomButtonHandler;

    //var modeButton = document.getElementById("mode")
    modeButton.onclick = modeButtonHandler;
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
function modeButtonHandler() {
    console.log(mode)
    if(mode == "default") {
        mode = "repl"
        
    }else if (mode == "repl") {
        mode = "building_repl"
    }else if(mode == "building_repl") {
        mode = "maze"   
    }else if(mode == "maze") {
        mode = "asim"   
    }else {
        //modeButton.innerHTML = "default"
        mode = "default"
    }
    modeButton.innerHTML = "Mode:" + mode;
    

}
function randomButtonHandler() {
    if (playing) return;
    clearButtonHandler();
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            var isLive = Math.round(Math.random());
            if (isLive == 1) {
                var cell = document.getElementById(i + "_" + j);
                cell.setAttribute("class", "live");
                grid[i][j] = 1;
            }
        }
    }
}

// clear the grid
function clearButtonHandler() {
    console.log("Clear the game: stop playing, clear the grid");
    
    playing = false;
    var startButton = document.getElementById('start');
    startButton.innerHTML = "Start";    
    lastmode = mode;
    /*clearTimeout(timer);
    
    var cellsList = document.getElementsByClassName("live");
    // convert to array first, otherwise, you're working on a live node list
    // and the update doesn't work!
    var cells = [];
    for (var i = 0; i < cellsList.length; i++) {
        cells.push(cellsList[i]);
    }
    
    for (var i = 0; i < cells.length; i++) {
        cells[i].setAttribute("class", "dead");
    }
    resetGrids;*/
    mode = "clr";
}

// start/pause/continue the game
function startButtonHandler() {
    if (playing) {
        console.log("Pause the game");
        playing = false;
        this.innerHTML = "Continue";
        clearTimeout(timer);
    } else {
        if(mode == "clr") {
            mode = lastmode
        }
        console.log("Continue the game");
        playing = true;
        this.innerHTML = "Pause";
        play();
    }
}

// run the life game
function play() {
    //console.log("bruh")
    //if(down) {
   //     cellClickHandler();
    //}
    computeNextGen();
    
    if (playing) {
        timer = setTimeout(play, reproductionTime);
    }
}

function computeNextGen() {
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            applyRules(i, j);
        }
    }
    
    // copy NextGrid to grid, and reset nextGrid
    copyAndResetGrid();
    // copy all 1 values to "live" in the table
    updateView();
}

// RULES
// Any live cell with fewer than two live neighbours dies, as if caused by under-population.
// Any live cell with two or three live neighbours lives on to the next generation.
// Any live cell with more than three live neighbours dies, as if by overcrowding.
// Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

function applyRules(row, col) {
    var numNeighbors = countNeighbors(row, col);
    //asks if this position is alive
    if(mode == "repl") {
        if (grid[row][col] == 1) {
            if (numNeighbors < 2) {
                nextGrid[row][col] = 0;
            } else if (numNeighbors == 2 || numNeighbors == 3) {
                nextGrid[row][col] = 1;
            } else if (numNeighbors > 5) {
                nextGrid[row][col] = 0;
            }
        } else if (grid[row][col] == 0) {
            if (numNeighbors == 2 || numNeighbors == 1) {
                nextGrid[row][col] = 1;
            }
        }
    }
    if(mode == "building_repl") {
        if (grid[row][col] == 1) {
            if (numNeighbors < 1) {
                nextGrid[row][col] = 0;
            } else if (numNeighbors <= 2) {
                nextGrid[row][col] = 1;
            } else if (numNeighbors > 1) {
                nextGrid[row][col] = 0;
            }
        } else if (grid[row][col] == 0) {
            if (numNeighbors == 2 || numNeighbors == 1) {
                nextGrid[row][col] = 1;
            }
        }
    }
    if(mode == "maze") {
        
        if (grid[row][col] == 1) {
            if(numNeighbors == 1 || numNeighbors == 2 || numNeighbors == 3 || numNeighbors == 4 || numNeighbors == 5) {
                grid[row][col] = 1
            }
            /*if (numNeighbors > 1) {
                nextGrid[row][col] = 1;
            }
            if(numNeighbors > 2) {
                nextGrid[row][col] = 1
            }
            if(numNeighbors > 4) {
                nextGrid[row][col] = 0;
            }*/
        } else if (grid[row][col] == 0) {
            if(numNeighbors == 3) {
                nextGrid[row][col] = 1
            }
            /*if (numNeighbors == 2) {
                nextGrid[row][col] = 1;
            }
            if(numNeighbors == 3) {
                nextGrid[row][col] = 1
            }*/
        }
    }
    if(mode == "asim") {
        if (grid[row][col] == 1) {
            if(numNeighbors == 4 || numNeighbors == 5 || numNeighbors == 6 || numNeighbors == 7) {
                grid[row][col] = 1
            }
        } else if (grid[row][col] == 0) {
            if (numNeighbors == 3 || numNeighbors == 4 || numNeighbors == 5) {
                nextGrid[row][col] = 1;
            }
        }
    }
    if(mode == "lol" || mode == "default") {
        if (grid[row][col] == 1) {
            if (numNeighbors < 2) {
                nextGrid[row][col] = 0;
            } else if (numNeighbors == 2 || numNeighbors == 3) {
                nextGrid[row][col] = 1;
            } else if (numNeighbors > 3) {
                nextGrid[row][col] = 0;
            }
        } else if (grid[row][col] == 0) {
                if (numNeighbors == 3) {
                    nextGrid[row][col] = 1;
                }
            }
    }
    if(mode == "clr") {
        nextGrid[row][col] = 0
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