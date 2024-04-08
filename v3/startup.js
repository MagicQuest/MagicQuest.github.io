function choice(table) {
    return table[Math.floor(Math.random()*table.length)];
}

function p(text) {
    const p = document.createElement("p");
    p.innerText = text;
    return p;
}
osconsole.appendChild(p("    -w "+innerWidth));
osconsole.appendChild(p("    -h "+innerHeight));
if(!localStorage.getItem("visited")) {
    osconsole.appendChild(p("    -setup"));
    //localStorage.setItem("visited", true); //real
}

localStorage.setItem("visited", Date.now());

let started = false;

function killstartup() {
    //setTimeout(() => {
        osconsole.appendChild(p("\n"));
        if(!started) {
        //so to scroll i could use scrollTop or the func
        osconsole.scroll(0,osconsole.scrollHeight);
        osconsole.animate({opacity: [1,0]}, {duration: 1000, iterations: 1}).finished.then(shit => {
            document.body.removeChild(osconsole);
        });
    }

        new Audio(Math.random() > .25 ? "/music/mqstartup3.wav" : "/music/mqstartup3 dubstep.wav").play();
    //}, 500);
    started = true;
}

function startupconsolespam() {
    const commands = ["ipconfig /all", "netstat", "cmd /C", "powershell", "mqstartup", "code", "ffmpeg", "ffplay", "ffprobe", "cmake-gui", "mkdir", "chdsk", "set", "ping localhost", "taskmgr", "shutdown -s -t 0", "shutdown -a", "cmd /K", "node app.js", "start notepad", "notepad"]; //`#include <iostream>\n\nusing namespace std;\n\n#define print(msg) cout << msg << endl;\n\nint main() {\n    print("Hello World!");\n    return 0;\n}`
    const colors = ["0,0,0", "0,55,218", "19,161,14", "58,150,221", "197,15,31", "136,23,152", "193,156,0", "204,204,204", "118,118,118", "180,0,158"];
    //sorry for fetching twice (loading the page THEN fetching the page) BUT IDC
    fetch("startup.js").then(x => x.text()).then(thiscode => {
        //const p = document.createElement("p");
        //p.innerText = thiscode;
        osconsole.appendChild(p(thiscode));
        //so to scroll i could use scrollTop or the func
        osconsole.scroll(0,osconsole.scrollHeight);
    });
    let i = 0;
    const max = Math.round(Math.random()*500);
    console.log(max);
    function timerfunc() {
        i++;
        if(i > max) {
            //osconsole.style.setProperty("--foreground", `black`);
            //killstartup();
            startupfinished = true;
            osconsole.style.setProperty("--foreground", `white`);
            osconsole.appendChild(p("Press any key to continue... (because audio won't play unless you do...)")); //this looks GEEKED but it counts from 10% - 100%
            osconsole.scroll(0,osconsole.scrollHeight);

            //OH SHIT I JUST REMEMBERED I CAN USE HTMLElement.animate !!!!!
            //and for some reason my nested timeout wasn't working (DAMN IT, CHROME CACHED STARTUP.JS AND MY CHANGES WEREN'T GOING THROUGH!)
            //setTimeout(() => {
            //    osconsole.style.opacity = "0";
            //    setTimeout(() => {
            //        document.body.removeChild(osconsole);
            //    }, 100);
            //}, 500);
            return;
        }else if(i+10 > max) {
            osconsole.appendChild(p(((i+10-max)*10)+"%")); //this looks GEEKED but it counts from 10% - 100%
            osconsole.scroll(0,osconsole.scrollHeight);
            setTimeout(timerfunc, 100);
        }else {
            if(Math.random() > .025) {
                osconsole.appendChild(p(document.location.host+document.location.pathname+"> "+choice(commands)));
                osconsole.scroll(0,osconsole.scrollHeight);
            }else {
                //if(Math.random() > .5) {
                    osconsole.appendChild(p("color"));
                    osconsole.scroll(0,osconsole.scrollHeight);
                    osconsole.style.setProperty("--foreground", `rgb(${choice(colors)})`);
                //}else {
                    /*osconsole.style.setProperty("--background", `rgb(${choice(colors)})`);*/
                //}
            }
            setTimeout(timerfunc, Math.round(Math.random()*20)); //no setInterval because i want variable sped
        }
    }
    setTimeout(timerfunc, 100);
    //const timer = setInterval(() => {
    //    i++;
    //    if(i > max) {
    //        clearInterval(timer);
    //        return;
    //    }
//
//
    //},100);
}
//startup();
//setTimeout(startupconsolespam, 3000)
//(function() {
//{
    function dot() {
        osconsole.appendChild(p("    ."));
        osconsole.scroll(0,osconsole.scrollHeight);
        if(skip) {
            killstartup();
        }
        return !skip;
    }

    setTimeout(() => {
        dot() && //yeah this is crazy but HOLD ON (what happened to writing dumb code)
        setTimeout(() => {
            dot() &&
            setTimeout(() => {
                dot() &&
                setTimeout(startupconsolespam, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
//})();
//}