let activeObject; //Icon
const bookmarkslist = ["/ca/webgl","/ca/webgl/bapple","/music","/games/crush", "/box2d/random.html",
                       "/breakapart/index.html",
                       "/orbfarm2.html",
                       "/ca/remake/newcel.html",
                       "/ca/neaural pattenrs.html",
                       "/ca/starcels.html",
                       "/ca/webgl/allcellular.html",
                       "/ca/webgl/cnnevo.html",
                       "/ca/webgl/everycellular.html",
                       "/ca/webgl/thisissand.html",
                       "/ca/webgl/webgl hypo.html", 
                       "/ca/webgl/cellularpersistence.html",
                       "/games/peggle.html",
                       "/games/mt1.html",
                       "/games/skribbl.html",
                       "/games/phiggle.png",
                       "/music/mqstartup2.wav",
                       "/music/mqstartup3.wav",
                       "/music/mqstartup3 dubstep.wav",
                       "/awesome_card.html",
                       "/canvas.html",
                       "/chaosma.html",
                       "/chaosmainst.html",
                       "/chaosmawebgpu.html",
                       "/gol5.html",
                       "/pathfinding.html",
                       "/prankmaker.htm",
                       "/typingtest.html",
                       "/web.gif", "/fnf/index.html", "/ca/webgl/bapple/index.html", "/games/botgame.html", "/ca/remake/fallingschool2.html", "favorites"];

//const memourls; //ah nevermind i was gonna memoize the fetches but what if i update it or somethung idk it's not like they're that big anyways shut up
const memoruls = []; //ok im doing it lol

class DesktopIcon extends HTMLElement { //haha this is like react
    //active = false;
    //offset = {x: 0,y: 0};

    constructor() {
        super();
    }

    /*connectedCallback() {
        this.style.top = `${Math.floor(Math.random()*880)}px`;
        this.style.left = `${Math.floor(Math.random()*1612)+108}px`;

        const shadow = this.attachShadow({ mode: "open" });
        const inner = this.innerHTML;
        this.innerHTML = "";

        const folder = this.getAttribute("data-folder");

        const image = document.createElement("img");
        image.src = this.getAttribute("data-icon") || (folder && "folder.gif"); //idk i don't realy have to check data-folder
        //well i would've used the css user-drag: none; but for some reason there is NO firefox support? so im using draggable
        image.draggable = false;
        image.width = "64";
        image.height = "64";
        image.style.margin = "auto";
        //image.style.imageRendering = "pixelated";

        const text = document.createElement("span");
        text.innerText = inner;
        
        shadow.appendChild(image);
        shadow.appendChild(text);

        if(!this.getAttribute("data-actually-in-folder")) {

            this.addEventListener("mousedown", event => {
                //this.active = true;
                activeObject = this;
                this.offset = {x: event.offsetX, y: event.offsetY};
                //suprisingly this still points to the DesktopIcon object
            });

            this.addEventListener("dblclick", event => { //first time using this event
                if(!folder) {
                    document.location.href = "/"+inner;
                }else {
                    
                }
            });

        }
        //this.addEventListener("mouseup", event => {
        //    //this.active = false;
        //    activeIcon = undefined;
        //});

        //this.addEventListener("mousemove", event => {
        //    if(this.active) {
        //        console.log(event);
        //        this.style.left = (event.pageX-this.offset.x)+"px";
        //        this.style.top = (event.pageY-this.offset.y)+"px";
        //    }
        //});
    }*/

    iconfromextension() {
        const ext = this.innerHTML.split(".").at(-1); //haha new
        if(ext == "html" || ext == "htm") {
            return "chrome.gif"; 
        }else if(ext == "png" || ext == "gif" || ext == "jpg" || ext == "ico") {
            return "/"+(this.getAttribute("data-actually-in-folder") ?? "")+this.innerHTML;
        }else if(ext == "mp3" || ext == "ogg") {
            return "wav.gif";
        }else {
            return ext+".gif";
        }
        /*else if(ext == "js") {
            return "js.gif";
        }else if(ext == "py") {
            return "py.gif";
        }else if(ext == "wav") {
            return "wav.gif";
        }*/
    }

    connectedCallback() {
        this.style.top = `${Math.floor(Math.random()*880)}px`;
        this.style.left = `${Math.floor(Math.random()*1612)+108}px`;

        const shadow = this.attachShadow({ mode: "open" });
        const content = document.getElementById("ditemplate").content.cloneNode(true);

        const type = this.getAttribute("data-type");

        const image = content.children[1];
        //image.src = this.getAttribute("data-icon") || (folder && "folder.gif") || this.iconfromextension(); //idk i don't realy have to check data-folder
        image.style.backgroundImage = `url("${this.getAttribute("data-icon") || (type == "folder" && "folder.gif") || this.iconfromextension()}")`;

        //const text = document.createElement("span");
        //text.innerText = inner;
        
        //shadow.appendChild(image);
        //shadow.appendChild(text);

        const infolder = this.getAttribute("data-actually-in-folder");

        if(bookmarkslist.includes("/"+(infolder ?? "")+this.innerHTML)) {
            image.classList.add("bookmarked");
        }
        console.log("/"+(infolder ?? "")+this.innerHTML);

        if(infolder == null) { //WHY THE FUCK IS ??= A VALID OPERAYTOR
            this.style.position = "absolute";

            this.addEventListener("mousedown", event => {
                //this.active = true;
                activeObject = this;
                this.offset = {x: event.offsetX, y: event.offsetY};
                //suprisingly this still points to the DesktopIcon object
            });

        }else {
            this.style.display = "inline-flex";
        }

        this.addEventListener("dblclick", event => { //first time using this event
            if(!type) {
                document.location.href = "/"+(infolder ?? "")+this.innerHTML; //just asked clyde about the nullish coalescing operator
            }else if (type == "folder"){
                const explorer = document.createElement("file-explorer");
                explorer.style = "width: 600px; height: 400px;";
                if(infolder) {
                    const curexpl = this.parentElement.parentNode.host; //good god
                    explorer.style.left = curexpl.style.left;//(parseInt(curexpl.style.left)+15)+"px";
                    explorer.style.top = curexpl.style.top;//(parseInt(curexpl.style.top)+15)+"px";
                    explorer.style.width = curexpl.style.width;
                    explorer.style.height = curexpl.style.height;
                    explorer.setAttribute("data-directory", infolder+this.innerHTML);
                    document.body.removeChild(curexpl);
                }else {
                    explorer.style.left = (mouse.x+15)+"px";
                    explorer.style.top = (mouse.y+15)+"px";
                    explorer.setAttribute("data-directory", this.innerHTML);
                }
                document.body.appendChild(explorer);
            }else if(type == "window") {

            }
        });

        this.addEventListener("auxclick", event => {
            const a = document.createElement("a");
            a.href = "/"+(infolder ?? "")+this.innerHTML;
            a.target = "_blank";
            a.click();
        });

        shadow.appendChild(content);
    }
}

class SideBarElement extends HTMLElement {
    active = false;

    constructor() {
        super();
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });

        const button = document.createElement("button");
        
        const type = this.getAttribute("data-type");

        let symbols;

        if(type == "left") {
            symbols = ["▶","◀"];
            button.innerText = "▶";
        }else if(type == "bottom") {
            symbols = ["▲", "▼"];
            button.innerText = "▲";
            button.style = "width: 100%; position: relative; bottom: 0; user-select: none;";
        }

        button.addEventListener("click", event => {
            this.active = !this.active;
            button.innerText = symbols[+this.active]; //this looks kinda weird but hear me out
        });

        shadow.appendChild(button);
    }
}

class FileExplorerElement extends HTMLElement {
    maximized = false;
    
    constructor() {
        super();
    }

    /*connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });

        //<div style="white-space: pre; display: flex; justify-content: space-between; cursor: move; background: linear-gradient(#FFE697, #F5D470); border-bottom: 1px solid grey;"><span style="white-space: pre;">    title</span><div><button>_</button><button>[ ]</button><button>X</button></div></div>
        const realDirectory = this.getAttribute("data-directory");//"data-title");

        const titleDiv = document.createElement("div");
        titleDiv.title = realDirectory;
        titleDiv.style = "white-space: pre; display: flex; justify-content: space-between; cursor: move; background: linear-gradient(#FFE697, #F5D470); border-bottom: 1px solid grey; user-select: none;";
        titleDiv.addEventListener("mousedown", event => {
            //this.active = true;
            if(event.composedPath()[0].tagName != "BUTTON") { //didn't click on the minimize button ykyky
                activeObject = this;
                this.offset = {x: event.offsetX, y: event.offsetY};
            }
            console.log(this, event.composedPath()[0].tagName);
        });
        //maximize moved
        titleDiv.addEventListener("dblclick", function(event) {
            if(event.composedPath()[0].tagName != "BUTTON") {
                this.maximize();//.bind(this)();
            }
        }.bind(this));
        const tempspan = document.createElement("span"); tempspan.innerHTML = realDirectory+" - File Explorer ;)";
        tempspan.style.marginLeft = "25px";
        titleDiv.appendChild(tempspan);
        const tempDiv = document.createElement("div");
        const miniButton = document.createElement("button");
        const maxiButton = document.createElement("button");
        const closeButton = document.createElement("button");
        miniButton.innerText = "_";
        maxiButton.innerText = "[ ]";
        closeButton.innerText = "X";

        tempDiv.appendChild(miniButton);
        tempDiv.appendChild(maxiButton);
        tempDiv.appendChild(closeButton);
        titleDiv.appendChild(tempDiv);

        shadow.appendChild(titleDiv);

        const contentDiv = document.createElement("div");
        contentDiv.style.overflow = "auto";
        contentDiv.style.height = "100%";
        if(realDirectory != "favorites") {
            contentDiv.innerHTML = "Please wait...";//"content?";
            //fetch("https://github.com/MagicQuest/MagicQuest.github.io/tree/master/box2d", {body: null, method: "GET", "headers": {"content-type": "application/json", "accept": "application/json", "accept-language": "en-US,en;q=0.9"}}).then(res => {console.log(res); res.json();}).then(json => {
            fetch("https://api.github.com/repos/magicquest/MagicQuest.github.io/contents/"+realDirectory).then(res => res.json()).then(json => {
                contentDiv.innerHTML = "";
                for(const item of json) {
                    const icon = document.createElement("desktop-icon");
                    icon.innerHTML = item.name;
                    icon.setAttribute("data-actually-in-folder", realDirectory+"/");
                    if(item.type == "dir") {
                        icon.setAttribute("data-folder", true);
                    }//else {
                        //icon.setAttribute("data-icon", "/web.gif");
                    //}
                    contentDiv.appendChild(icon);
                    //icon.shadowRoot.adoptedStyleSheets = document.adoptedStyleSheets;
                }
            });
        }else {
            for(const item of bookmarkslist) {
                if(item != "favorites") {
                    const icon = document.createElement("desktop-icon");
                    icon.innerHTML = item.substring(1);
                    icon.setAttribute("data-actually-in-folder", "");//item.substring(1)+"/");
                    if(!item.includes(".")) {
                        icon.setAttribute("data-folder", true);
                    }
                    icon.style.border = "1px dotted black";
                    //icon.style.padding = "2px";
                    icon.style.margin = "5px";
                    contentDiv.appendChild(icon);
                }
            }
        }
        //const table = document.createElement("table");
        //const thead = document.createElement("thead");
        //thead.innerHTML = `<tr><th>Name</th><th>Date modified</th></tr>`
        //table.appendChild(thead);

        //const tbody = document.createElement("tbody");
        //tbody.innerHTML = `<tr><td>NIGGE#R</td></tr>`;
        //table.appendChild(tbody);

        //contentDiv.appendChild(table);
        shadow.appendChild(contentDiv);

        const dirDiv = document.createElement("div");
        dirDiv.style = "background: linear-gradient(#FFE697, #F5D470); border-top: 1px solid grey;";
        //dirDiv.innerText = "home > box2d";
        const split = realDirectory.split("/");
        console.log(split);

        const homedir = document.createElement("button");
        homedir.innerText = "home";
        dirDiv.appendChild(homedir);
        dirDiv.append(" > ");

        if(split.length > 1) {
            for(const directory of split) {

            }
        }else {            
            const button2 = document.createElement("button");
            button2.innerText = realDirectory;
            dirDiv.appendChild(button2);
        }

        shadow.appendChild(dirDiv);

        miniButton.style.backgroundColor = "red";
        miniButton.addEventListener("click", event => {

        });

        maxiButton.addEventListener("click", event => this.maximize());//.bind(this));

        closeButton.addEventListener("click", event => document.body.removeChild(this));

        //maxiButton.addEventListener("click", event => {
        //    //this.style.left = "108px";
        //    //this.style.top = "0px";
        //    //this.style.width = "calc(100% - 108px)";
        //    //this.style.height = "100%";
        //    
        //});
    }*/

    changeDir(event) {
        const newDirectory = event.target.directory.slice(0,-1); //substring(-1);
        console.log(newDirectory);//, secondary);
        const newexplorer = document.createElement("file-explorer");
        newexplorer.setAttribute("data-directory", newDirectory);
        //newexplorer.style = Object.assign(Object.create(Object.getPrototypeOf(this.style)), this.style); //uhh this is weird!
        //console.log(this);
        newexplorer.style.left = this.style.left;
        newexplorer.style.top = this.style.top;
        newexplorer.style.width = this.style.width;
        newexplorer.style.height = this.style.height;
        document.body.appendChild(newexplorer);
        document.body.removeChild(this);
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        const content = document.getElementById("fetemplate").content.cloneNode(true); //just realized im using getElementById instead of literally says (window.)fetemplate (window is optional)

        const realDirectory = this.getAttribute("data-directory");

        const titleDiv = content.children[1];
        titleDiv.title = realDirectory;
        titleDiv.addEventListener("mousedown", event => {
            //this.active = true;
            if(event.composedPath()[0].tagName != "BUTTON") { //didn't click on the minimize button ykyky
                activeObject = this;
                this.offset = {x: event.offsetX, y: event.offsetY};
            }
            console.log(this, event.composedPath()[0].tagName);
        });
        //maximize moved
        titleDiv.addEventListener("dblclick", function(event) {
            if(event.composedPath()[0].tagName != "BUTTON") {
                this.maximize();//.bind(this)();
            }
        }.bind(this));
        const tempspan = titleDiv.firstElementChild;
        tempspan.innerHTML = realDirectory + tempspan.innerHTML;
        
        //const miniButton = document.createElement("button");
        //const maxiButton = document.createElement("button");
        //const closeButton = document.createElement("button");

        const contentDiv = content.children[2];
        if(realDirectory != "favorites") {
            //contentDiv.innerHTML = "Please wait...";//"content?";
            //fetch("https://github.com/MagicQuest/MagicQuest.github.io/tree/master/box2d", {body: null, method: "GET", "headers": {"content-type": "application/json", "accept": "application/json", "accept-language": "en-US,en;q=0.9"}}).then(res => {console.log(res); res.json();}).then(json => {
            function getIcons(json) { //i know this is kinda weird BUT just hear me out!
                function createIcon(item) {
                    const icon = document.createElement("desktop-icon");
                    icon.innerHTML = item.name;
                    icon.setAttribute("data-actually-in-folder", realDirectory != "" ? (realDirectory+"/") : realDirectory);
                    if(item.type == "dir") {
                        icon.setAttribute("data-type", "folder");
                    }//else {
                        //icon.setAttribute("data-icon", "/web.gif");
                    //}
                    contentDiv.appendChild(icon);
                    //icon.shadowRoot.adoptedStyleSheets = document.adoptedStyleSheets;
                }
                contentDiv.innerHTML = "";
                const remainingItems = [];
                for(const item of json) {
                    if(item.type == "dir") {
                        createIcon(item);
                    }else {
                        remainingItems.push(item);
                    }
                }
                /*for(const item of remainingItems) {
                    createIcon(item);
                }*/
                remainingItems.forEach(createIcon);
                memoruls[realDirectory] = json;
            }
            
            if(memoruls[realDirectory]) {
                getIcons(memoruls[realDirectory]);
                console.log("memo",realDirectory);
            }else {
                fetch("https://api.github.com/repos/magicquest/MagicQuest.github.io/contents/"+realDirectory).then(res => res.json()).then(json => getIcons(json));
                console.log("got memo",realDirectory);
            }
        }else {
            contentDiv.innerHTML = "";
            for(const item of bookmarkslist) {
                if(item != "favorites") {
                    const icon = document.createElement("desktop-icon");
                    icon.innerHTML = item.substring(1);
                    icon.setAttribute("data-actually-in-folder", "");//item.substring(1)+"/");
                    if(!item.includes(".")) {
                        icon.setAttribute("data-type", "folder");
                    }
                    icon.style.border = "1px solid black";
                    //icon.style.padding = "2px";
                    icon.style.margin = "5px";
                    contentDiv.appendChild(icon);
                }
            }
        }

        const dirDiv = content.children[3];

        const split = realDirectory.split("/");
        console.log(split);

        //right after 1:59 this shit GO HARD https://rave.dj/JZSTdeFxFJiWBQ
        dirDiv.firstElementChild.directory = "/"; //yeah this is a weird system ; https://www.youtube.com/watch?v=xLR8ZsCahHc&list=PLcyEDBBpDbRAtjtFFi9Itmbtr4rP9OucW&index=319&t=1543s
        dirDiv.firstElementChild.addEventListener("click", event => this.changeDir(event)); //homebutton (also apparently the event => this.changeDir(event) is required (instead of just simply this.changeDir) because it's not bound to this objkect anymore)

        if(split.length > 1) {
            let fullpath = "";
            for(let i = 0; i < split.length; i++) {
                const directory = split[i];
                fullpath += directory+"/";
                console.log("fullpathjs", fullpath);
                const button = document.createElement("button");
                button.innerText = directory;
                button.directory = fullpath;
                button.className = "flush";
                button.addEventListener("click", event => this.changeDir(event));//realDirectory, directory));
                //button.addEventListener("click", event => {
                //    console.log(directory, this);
                //    const newexplorer = document.createElement("file-explorer");
                //    newexplorer.setAttribute("data-directory", );
                //    newexplorer.style = this.style;
                //    document.body.appendChild(newexplorer);
                //    document.body.removeChild(this);
                //});
                dirDiv.appendChild(button);
                if(i != split.length-1) {
                    dirDiv.append(" > ");
                }  
            }
        }else {            
            const button = document.createElement("button");
            button.innerText = realDirectory;
            button.directory = realDirectory+"/";
            button.className = "flush";
            button.addEventListener("click", event => this.changeDir(event));
            dirDiv.appendChild(button);
        }
        
        const buttons = titleDiv.lastElementChild.children;

        buttons[0].addEventListener("click", event => {
            
        });
        
        buttons[1].addEventListener("click", event => this.maximize());//.bind(this));
        
        buttons[2].addEventListener("click", event => document.body.removeChild(this));
        
        shadow.appendChild(content);
    }

    maximize() {
        if(this.maximized) {
            console.log(this.style, this.lastSize);
            //this.style.left = this.lastSize.left + " !important";
            //this.style.top = this.lastSize.top + " !important";
            //this.style.width = this.lastSize.width + " !important";
            //this.style.height = this.lastSize.height + " !important";
            //this.style.setProperty("left", this.lastSize.left, "important");
            //this.style.setProperty("top", this.lastSize.top, "important");
            //this.style.setProperty("width", this.lastSize.width, "important");
            //this.style.setProperty("height", this.lastSize.height, "important");
            this.classList.remove("expand");
            //this.style = this.lastSize;
            //this.lastSize = {left: this.style.left, top: this.style.top, width: this.style.width, height: this.style.height};
            //this.animate(this.lastSize, {fill: "both", duration: 100});
        }else {
            //this.style = "";
            this.lastSize = {left: this.style.left, top: this.style.top, width: this.style.width, height: this.style.height};
            this.classList.add("expand");
            //this.animate({left: [this.style.left, "108px"], top: [this.style.top, "0px"], width: ["calc(100% - 108px)"], height: ["100%"]}, {fill: "both", duration: 100});
        }
        this.maximized = !this.maximized;
    }
}

class BasicWindowElement extends HTMLElement {
    maximized = false;
    
    constructor() {
        super();
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        const title = this.getAttribute("window-type");
        const windowcontent = document.getElementById("windowtemplate").content.cloneNode(true);

        const titleDiv = windowcontent.firstElementChild;
        titleDiv.title = title;
        titleDiv.addEventListener("mousedown", event => {
            //this.active = true;
            if(event.composedPath()[0].tagName != "BUTTON") { //didn't click on the minimize button ykyky
                activeObject = this;
                this.offset = {x: event.offsetX, y: event.offsetY};
            }
            console.log(this, event.composedPath()[0].tagName);
        });
        //maximize moved
        titleDiv.addEventListener("dblclick", function(event) {
            if(event.composedPath()[0].tagName != "BUTTON") {
                this.maximize();//.bind(this)();
            }
        }.bind(this));
        const tempspan = titleDiv.firstElementChild;
        tempspan.innerHTML = title;

        const content = document.getElementById(title+"template").content.cloneNode(true);
        windowcontent.appendChild(content);

        shadow.appendChild(windowcontent);

        const buttons = titleDiv.lastElementChild.children;

        buttons[0].addEventListener("click", event => {
            
        });
        
        buttons[1].addEventListener("click", event => this.maximize());//.bind(this));
        
        buttons[2].addEventListener("click", event => document.body.removeChild(this));
    }

    maximize() {
        if(this.maximized) {
            console.log(this.style, this.lastSize);
            //this.style.left = this.lastSize.left + " !important";
            //this.style.top = this.lastSize.top + " !important";
            //this.style.width = this.lastSize.width + " !important";
            //this.style.height = this.lastSize.height + " !important";
            //this.style.setProperty("left", this.lastSize.left, "important");
            //this.style.setProperty("top", this.lastSize.top, "important");
            //this.style.setProperty("width", this.lastSize.width, "important");
            //this.style.setProperty("height", this.lastSize.height, "important");
            this.classList.remove("expand");
            //this.style = this.lastSize;
            //this.lastSize = {left: this.style.left, top: this.style.top, width: this.style.width, height: this.style.height};
            //this.animate(this.lastSize, {fill: "both", duration: 100});
        }else {
            //this.style = "";
            this.lastSize = {left: this.style.left, top: this.style.top, width: this.style.width, height: this.style.height};
            this.classList.add("expand");
            //this.animate({left: [this.style.left, "108px"], top: [this.style.top, "0px"], width: ["calc(100% - 108px)"], height: ["100%"]}, {fill: "both", duration: 100});
        }
        this.maximized = !this.maximized;
    }

}

customElements.define("desktop-icon", DesktopIcon);
customElements.define("side-bar", SideBarElement);
customElements.define("file-explorer", FileExplorerElement);
customElements.define("def-window", BasicWindowElement);