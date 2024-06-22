//information about the clone hero format
//https://github.com/TheNathannator/GuitarGame_ChartFormats/blob/main/doc/FileFormats/.chart/Core%20Infrastructure.md
//https://github.com/TheNathannator/GuitarGame_ChartFormats/blob/main/doc/FileFormats/.chart/5-Fret%20Guitar.md
//https://docs.google.com/document/d/1v2v0U-9HQ5qHeccpExDOLJ5CMPZZ3QytPmAG5WF0Kzs/edit?pli=1

function parse() {
    //i originally wrote this whole thing in js but ran it with JBS3 (y'all wouldn't know nothing 'bout that yet (https://github.com/MagicQuest/JBS3))
    //anyways console.log doesn't work for some reason so i have to use print in jbs so i gotta change all those
    const resolution = headers["Song"][headers["Song"].findIndex(e => e.includes("Resolution"))].match(propertyRegex)[2];
    console.log(`song resolution = ${resolution}`);
    console.log(difficulties.value);
    
    let tempoOffset = 0;
    let lastTempoChange = 0;
    const tempoEvents = headers["SyncTrack"].filter(e => e.includes("B")); //OH YEAH (direction and magnitude);
    let curTempo = tempoEvents[0].match(trackRegex)[3]; //BRAIN BLAST! (oh shoot im using this wrong)
    //let firstTimeTempo = true;
    let cloneherochart = headers[getDifficultyChartName(difficulties.value)];
    //if(!cloneherochart) {
    //    print("difficulty not found");
    //    quit;
    //}
    let tempchart = [];//headers[getDifficultyChartName("Easy")]; //i need to slip in tempo events here so it's not weird
    let chart = [];
    //idk if there is a builtin function for this so (nvm)
    //let indexestoinsert = [];
    let k = 0;
    for(let i = 0; i < cloneherochart.length; i++) {
        const chnote = cloneherochart[i];
        let [_, timing, eventType, args] = chnote.match(trackRegex);
        timing = +timing;
        args = args.split(" ");
        const note = {_, timing, eventType, args};
        if(eventType == "N" || eventType == "E") { //we don't care about starpower (im including solo events so i can trigger kiai mode in osu) also -> https://github.com/TheNathannator/GuitarGame_ChartFormats/blob/main/doc/FileFormats/.chart/Core%20Infrastructure.md#track-events AND https://docs.google.com/document/d/1v2v0U-9HQ5qHeccpExDOLJ5CMPZZ3QytPmAG5WF0Kzs/edit?pli=1
            if(args[0] <= 4) { //if 5 then opaque force notes, if 6 then tap note (we don't care about what kindof note it is) 0 - 4 is the lane it is in (oh shoot what should i do for open notes (7))
                //const tke = tempoEvents[k].match(trackRegex); //timing of tempo event
                //if(timing <= tke[1] && cloneherochart[i+1].match(trackRegex)[1] >= tke[1]) { 
                //    //chart[i] = {_: tke[0], timing: tke[1], eventType: tke[2], args: tke[3]};
                //    chart.push({_: tke[0], timing: tke[1], eventType: tke[2], args: tke[3]});
                //    k++;
                //}
                //chart[i] = note;
                tempchart.push(note);
            }else if(eventType == "E") {
                tempchart.push(note);
            }
        }
    }
    
    for(let i = 0; i < tempchart.length; i++) {
        const note = tempchart[i];
        //if(k >= tempoEvents.length) {
        //    break;
        //}
    //tempoLoop: //ah nevermind break works the way i thought it would
    if(k < tempoEvents.length) {
        for(let j = k; j < tempoEvents.length; j++) {
            const tke = tempoEvents[j].match(trackRegex); //timing of tempo event
            //print(tke[1], note.timing, tempchart[i+1].timing);
            if(note.timing >= tke[1]) {
                //chart[i] = {_: tke[0], timing: tke[1], eventType: tke[2], args: tke[3]};
                chart.push({_: tke[0], timing: tke[1], eventType: tke[2], args: tke[3]});
                //print(tke[0]);
                k++;
            }else {
                break;// tempoLoop; //bro what the fuck
            }
        }
    }
        chart.push(note);
        //print(note._);
        //if(i > 100) {
        //    break;
        //}
        //if(note.timing > 100000) {
        //    break;
        //}
    }
    //print(chart);
    
    let timingPoints = [];
    let keys = [];
    
    function formulanooffset(timing, tempo) {
        return verboseformula(timing, tempo, 0, 0);
    }
    
    function formula(timing, tempo) {
        return verboseformula(timing, tempo, tempoOffset, lastTempoChange);
    }
    
    function verboseformula(timing, tempo, TO, LTC) { //for hold notes
        return TO+(((timing-LTC)/resolution*60000)/(tempo/1000)); //gotta divide tempo by 1000 because osu mania uses milliseconds
    }
    
    //let tempo = +tempoEvents[0].match(trackRegex)[3];
    
    let solo = 0;
    
    function setTempo(time, lastTempo, newTempo) {
        //let lastTempo = lT;
        tempoOffset = formula(time, lastTempo);
        timingPoints.push(`${tempoOffset},${(60/(newTempo))*1000000},4,1,0,0,1,${solo}`);
        curTempo = newTempo;
        lastTempoChange = time;
    }
    
    //function checkTempo(time, nothingcrazy) {
    //    let retTempo = undefined;
    //    let ts = 0;
    //    let i;
    //    for(i = 0; i < tempoEvents.length; i++) {
    //        let [_, start, obv, tempo] = tempoEvents[i].match(trackRegex);
    //        let nextStart = tempoEvents[i+1]?.match(trackRegex)[1]; //OH YEAH optional chaining (direction and magnitude)
    //        //print(time-start);
    //        if(time - start >= 0) {
    //            if(nextStart) {
    //                if(time - nextStart <= 0) { //imma just assume that's right
    //                    //print(`${time} between ${start} - ${nextStart}, tempo must be ${_}`);
    //                    retTempo = tempo;
    //                    ts = start;
    //                    break;
    //                }
    //            }else {
    //                //print(`no further tempo events past ${start} (${time}) so tempo must be ${_}`);
    //                retTempo = tempo;
    //                ts = start;
    //                break;
    //            }
    //        }
    //    }
    //
    //    //if(nothingcrazy) {
        //    let TtempoOffset = tempoOffset;
        //    let TlastTempoChange = lastTempoChange;
        //    if((retTempo && curTempo != retTempo) || firstTimeTempo) {
        //        //lastTempo = curTempo; //yyeah
        //        if(i != 0) {
        //            lastTempo = +tempoEvents[i-1].match(trackRegex)[3];
        //        }else {
        //            lastTempo = retTempo;
        //        }
        //        TtempoOffset = formula(ts, lastTempo); //yeah whoops i shouldn't be using current tempo here because a note could happen after multiple tempo changes (for some reason)
        //        //print("TtempoOffset", TtempoOffset, ts, lastTempo);
        //        //timingPoints.push(`${tempoOffset},${(60/(retTempo))*1000000},4,1,0,0,1,0`);
        //        //curTempo = retTempo;
        //        TlastTempoChange = ts;
        //        //print("Ttempo change subbing "+ts);
        //    }
        //    return [retTempo, TtempoOffset, TlastTempoChange];
        //}else {
        //    if((retTempo && curTempo != retTempo) || firstTimeTempo) {
        //        //lastTempo = curTempo;
        //        if(i != 0) {
        //            lastTempo = +tempoEvents[i-1].match(trackRegex)[3];
        //        }else {
        //            lastTempo = retTempo;
        //        }
        //        tempoOffset = formula(ts, lastTempo); //yeah whoops i shouldn't be using current tempo here because a note could happen after multiple tempo changes (for some reason)
        //        //print("tempoOffset", tempoOffset, ts, lastTempo);
        //        timingPoints.push(`${tempoOffset},${(60/(retTempo))*1000000},4,1,0,0,1,0`); //wait the 6th value is the sample volume so remember that
        //        curTempo = retTempo;
        //        lastTempoChange = ts;
        //        firstTimeTempo = false;
        //        //print("tempo change subbing "+ts);
        //    }
        //    return retTempo;    
    //    //}
    //}
    
    //https://www.vgmusic.com/file/ce355e3866ef228df023ac94d70c177a.html
    //let i = chart[0].match(trackRegex);
    
    function getTempoAt(time) {
        let retTempo = undefined;
        let ts = 0;
        let i;
        for(i = 0; i < tempoEvents.length; i++) {
            let [_, start, obv, tempo] = tempoEvents[i].match(trackRegex);
            let nextStart = tempoEvents[i+1]?.match(trackRegex)[1]; //OH YEAH optional chaining (direction and magnitude)
            //print(time-start);
            if(time - start >= 0) {
                if(nextStart) {
                    if(time - nextStart <= 0) { //imma just assume that's right
                        //print(`${time} between ${start} - ${nextStart}, tempo must be ${_}`);
                        retTempo = tempo;
                        ts = start;
                        break;
                    }
                }else {
                    //print(`no further tempo events past ${start} (${time}) so tempo must be ${_}`);
                    retTempo = tempo;
                    ts = start;
                    break;
                }
            }
        }
    
        let TtempoOffset = tempoOffset;
        let TlastTempoChange = lastTempoChange;
    
        console.log(`retTempo: ${retTempo}, curTempo: ${curTempo}`);
    
        if(retTempo != curTempo) {
            //print("old tempooffset", tempoOffset);
            let lastTempo;
            if(i != 0) {
                lastTempo = +tempoEvents[i-1].match(trackRegex)[3];
            }else {
                lastTempo = curTempo;
            }
            //print(i, "i");
            TtempoOffset = formula(time, lastTempo);
            //print("new tempofosset",TtempoOffset);
            //timingPoints.push(`${tempoOffset},${(60/(newTempo))*1000000},4,1,0,0,1,0`);
            //curTempo = newTempo;
            //print("old tempochange", lastTempoChange);
            TlastTempoChange = time;
            //print("new tempoChange", TlastTempoChange);
        }
    
        return [retTempo, TtempoOffset, TlastTempoChange, i];
    }
    
    function getTempoChangesBetween(startTime, endTime) {
        let changes = [];
        let startI = getTempoAt(startTime)[3]+1; //watch out?
        if(startI == (tempoEvents.length)) { //no tempo changes between because there are no further changes
            return changes;
        }
        //print(startI, 'nigge');
        let i;
        for(i = startI; i < tempoEvents.length; i++) {
            let [_, start, obv, tempo] = tempoEvents[i].match(trackRegex);
            //let nextStart = tempoEvents[i+1]?.match(trackRegex)[1]; //OH YEAH optional chaining (direction and magnitude)
            //print(time-start);
            //print(endTime, start, endTime-start, "can't be 0", tempo);
            if(endTime - start >/*=*/ 0 && start != startTime) {
                changes.push([tempo, start]);
            }
        }
    
        return changes;
    }   
    
    let i = 0;
    let osunotex = [51, 153, 256, 358, 460]; //51+Math.floor(x/5*512) x is 0 -> 4 or [0, 5)
    
    for(let note of chart) { //oh that's cool getDifficultyChartName is only called once here (well obviously but i was worried about it calling it every loop)
        //honestly im not sure about this math but it looks good (tempo*notetiming)/60000000 (ok that shit was cap)
        //new formula (timing/resolution*60000)/tempo
        //print(args);
        //eventType can be 'N'ote, 'S'tarpower, or solo'E'vents
        //the last args for notes are the relative length
        
        if(note.eventType == "N") { //we don't care about starpower or solo events
            if(note.args[0] <= 4) { //if 5 then opaque force notes, if 6 then tap note (we don't care about what kindof note it is) 0 - 4 is the lane it is in
                //let tempo = checkTempo(note.timing); //this is a weird system
                let milli = formula(note.timing, curTempo);//(timing/resolution*60000)/tempo; //(curTempo*timing)/60000000;
                //console.log(note._);
                if(note.args.at(-1) != 0) {
                    let holdtiming = (note.timing)+(+note.args.at(-1));
                    let changes = getTempoChangesBetween(note.timing, holdtiming);
                    let realtime = milli;
                    //let remainingtiming = holdtiming;
                    //oh my glob hold notes work exactly the way i didn't want them to work (if the tempo changes during the hold i have to account for that)
                    //print(changes, "chagngess");
                    //if(changes.length == 1) {
                    //    let [tempo, start] = changes[0];
                    //    print(remainingtiming, start, i);
                    //    remainingtiming -= start;
                    //    realtime += formulanooffset(remainingtiming, curTempo);//tempo);
                    //}else if(changes.length > 1) {
                    if(changes.length > 0) {
                        console.log(changes[0][1]-note.timing)
                        let cumvals = changes[0][1]-note.timing;//haha cumulative
                        realtime += formulanooffset(changes[0][1]-note.timing, curTempo);//getTempoAt(note.timing)[0]);
                        for(let i = 1; i < changes.length; i++) {
                            let [tempo, start] = changes[i];
                            let [lastTempo, lastStart] = changes[i-1];
                            console.log(start-lastStart, lastTempo);
                            cumvals += start-lastStart;
                            realtime += formulanooffset(start-lastStart, lastTempo);
                            //start-note.timing
                            //if(i == 0) {
                            //    print(remainingtiming, start, i);
                            //    remainingtiming -= start;
                            //    realtime += formulanooffset(remainingtiming, curTempo);//tempo);
                            //}else {
                            //    print(remainingtiming, start, i);
                            //    if(remainingtiming > start) {
                            //        remainingtiming -= start;
                            //        realtime += formulanooffset(remainingtiming, changes[i-1][0]); //i think?
                            //    }else {
                            //        realtime += formulanooffset(remainingtiming, tempo);//changes[i-1][0]);
                            //        remainingtiming = 0;
                            //        break;
                            //    }
                            //}
                        }
                        console.log("cumvalse", cumvals);
                        realtime += formulanooffset(holdtiming-(note.timing+cumvals), changes.at(-1)[0]);
                        //remainingtiming = 0;
                    }else {
                        //let [holdtempo, TtempoOffset, TlastTempoChange] = getTempoAt(holdtiming);
                        //let vtime = verboseformula(remainingtiming, holdtempo, TtempoOffset, TlastTempoChange);
                        let vtime = formulanooffset(+note.args.at(-1), curTempo);
                        console.log(vtime);
                        realtime += vtime;
                    }
                    //if(remainingtiming > 0 || changes.length == 0) {
                    //    if(changes.length == 0) {
                    //        //let [holdtempo, TtempoOffset, TlastTempoChange] = getTempoAt(holdtiming);
                    //        //let vtime = verboseformula(remainingtiming, holdtempo, TtempoOffset, TlastTempoChange);
                    //        let vtime = formulanooffset(+note.args.at(-1), curTempo);
                    //        print(vtime);
                    //        realtime += vtime;
                    //    }else {
                    //        //let [holdtempo, TtempoOffset, TlastTempoChange] = getTempoAt(holdtiming);
                    //        //let vtime = verboseformula(remainingtiming, holdtempo, TtempoOffset, TlastTempoChange);
                    //        let vtime = formulanooffset(remainingtiming, changes.at(-1)[0]);
                    //        print(vtime);
                    //        realtime += vtime;
                    //    }
                    //}
                    //print(changes, realtime, "realtime");
                    ////let [holdtempo, tempoOffset, lastTempoChange] = checkTempo((note.timing)+(+note.args.at(-1)), true);
                    //let [holdtempo, TtempoOffset, TlastTempoChange] = getTempoAt(holdtiming);
                    //let holdlength = milli+(verboseformula(holdtiming, holdtempo, TtempoOffset, TlastTempoChange)); //verboseformula(holdtiming, holdtempo, TtempoOffset, TlastTempoChange);
                    //print(holdlength, +note.args.at(-1), milli+holdlength);
                    keys.push(`${osunotex[+note.args[0]]},192,${milli},128,0,${realtime}:0:0:0:0:`); //7th bit is set so 0b10000000 means hold note (shoot i only recently learned about the binary notation kinda thing like that)
                }else {
                    keys.push(`${osunotex[+note.args[0]]},192,${milli},1,0,0:0:0:0:`);
                }
            }
        }else if(note.eventType == "B") {
            //tempo event!
            //checkTempo(note.timing);
            console.log(note.args, "tempo args");
            setTempo(note.timing, curTempo, +note.args);
        }else if(note.eventType == "E") {
            let milli = formula(note.timing, curTempo);
            if(note.args[0] == "solo") {
                solo = 1;
                timingPoints.push(`${milli},-100,4,1,0,0,0,1`); //kiai mode for solo events (idek what happens when you turn it on)
            }else if(note.args[0] == "soloend") {
                solo = 0;
                timingPoints.push(`${milli},-100,4,1,0,0,0,0`);
            }
        }
        i++;
        //if(i > 25) {
        //    break;
        //}
        //break;
    }
    
    let str = "[TimingPoints]\n";
    
    //print("[TimingPoints]");
    for(let timingpoint of timingPoints) {
        //print(timingpoint);
        str += `${timingpoint}\n`;
    }
    str += "\n\n[HitObjects]\n";
    //print();
    //print();
    //print("[HitObjects]");
    for(let key of keys) {
        //print(key);
        str += `${key}\n`;
    }
    
    words.value = str;
    words.disabled = false;
}