import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
    RGBELoader
  } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//import { GUI } from 'dat.gui'

//for my next move i will recreate a tv menu with folders for my shits

let debug = false;

const gui = new dat.gui.GUI();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshPhysicalMaterial( { color: 0xE5B2B2/*0x00ff00*/ } );
/*const*/ window.cube = new THREE.Mesh( geometry, material );
//added in post
cube.receiveShadow = true;
cube.castShadow = true; //shadows not working fix shaddows lkol
cube.position.set(-0.5, .9, .6);
cube.scale.set(.2, .2, .2);
cube.interact = () => {
    console.log("celebre");
    cube.material.emissive = new THREE.Color( 0xE5B2B2 );
};
scene.add( cube );

const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0.5, 2.7, 2.2);//(0,.5,2.4);
light.shadow.bias = -0.0001;
scene.add(light);

const lightHelper = new THREE.PointLightHelper( light, .25 );
scene.add( lightHelper );

const light2 = new THREE.PointLight(0xffffff, 1, 100);
light2.position.set(-1.97, 2.125, -0.4);//(0,.5,2.4);
scene.add(light2);

const lightHelper2 = new THREE.PointLightHelper( light2, .25 );
scene.add( lightHelper2 );

const light3 = new THREE.PointLight(0xffffff, 1, 100);
light3.position.set(-2.63, 2.125, -0.4);//(0,.5,2.4);
scene.add(light3);

const lightHelper3 = new THREE.PointLightHelper( light3, .25 );
scene.add( lightHelper3 );

camera.position.z = 2.4;
camera.position.y = .5;

const nug = new THREE.AmbientLight(0xFFFFCD, .5);
scene.add(nug);

const dL = new THREE.DirectionalLight(0xFFFFCD, .5);
dL.position.set(0,1,3);
dL.rotation.set(1,0,0);
dL.castShadow = true;
dL.shadow.bias = -0.0001; //YIPPEE https://www.reddit.com/r/threejs/comments/pans07/help_needed_weird_shadow_artifacts_on_imported/
//var shadowCameraHelper = new THREE.CameraHelper(dL.shadow.camera);
//shadowCameraHelper.visible = true;

//const dLH = new THREE.DirectionalLightHelper(dL, .25);
scene.add(dL);
//scene.add(dLH);
//scene.add(shadowCameraHelper);
//let envMap;

let shelfdoor;//shelf, shelfdoor;
let gol;

//let track = Date.now();

//console.log("awaiting??");
/*
await new Promise((good, bad) => {
    new RGBELoader()
    //.setDataType(THREE.UnsignedByteType)
    //.setPath('./')
    .load('interior.hdr', function(texture) { //just realized i coulda lerped with the splatter up annoying orange game with the points instead of doing a fast corutine
        //coroutines have a speed limit so i coulda just lerped slowly or fast idk mean but yaeah
        //var pmremGenerator = new THREE.PMREMGenerator( renderer );
        //pmremGenerator.compileEquirectangularShader();
        //let generator = new THREE.PMREMGenerator(renderer);
    
        texture.mapping = THREE.EquirectangularReflectionMapping;
    
      //envMap = generator.fromEquirectangular(texture).texture;
    
      scene.background = texture;
      scene.environment = texture;

        //texture.dispose();
  //generator.dispose();

  //material.envMap = envMap;
        //console.log(Date.now()-track, "awaition");
        good();
    });
}); //i deem this a working forced synchronousization tactic
*/

//console.log(Date.now()-track, "good");




//const hdr = new RGBELoader().load('interior.hdr'); //NGL THIS DID **NOT** WORK
//console.log(hdr);
//hdr.mapping = THREE.EquirectangularReflectionMapping;
//
//scene.background = hdr;
//scene.environment = hdr;
const fbxLoader = new GLTFLoader();

await new Promise((good, bad) => {
         //ok damn it i need to use the es6 modules one (i do NOT like modules)
        fbxLoader.load(
            './shelf2.glb',
            (object) => {
                // object.traverse(function (child) {
                //     if ((child as THREE.Mesh).isMesh) {
                //         // (child as THREE.Mesh).material = material
                //         if ((child as THREE.Mesh).material) {
                //             ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).transparent = false
                //         }
                //     }
                // })
                // object.scale.set(.01, .01, .01)
                //console.log(object.scene.children[0].rotation.y); //probably radians
                window.shelf = object.scene.children[0].children[0];
                //shelf.recieveShadow = true;
                console.log("nigga", shelf, object);
                for (let m of object.scene.children[0].children) {
                    m.castShadow = true;
                    m.receiveShadow = true;
                }
                //shelf.material.normalMap = new THREE.TextureLoader().load( 'housetexturenormal2 4k.png' );
                scene.add(object.scene)
                good();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        );
})

await new Promise((good, bad) => {
        fbxLoader.load(
            './shelfdoor.glb',
            (object) => {
                // object.traverse(function (child) {
                //     if ((child as THREE.Mesh).isMesh) {
                //         // (child as THREE.Mesh).material = material
                //         if ((child as THREE.Mesh).material) {
                //             ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).transparent = false
                //         }
                //     }
                // })
                // object.scale.set(.01, .01, .01)
                shelfdoor = object.scene.children[0];
                console.log(shelfdoor.children[0]);
                //shelfdoor.children[0].material.envMap = envMap;
                //shelfdoor.children[1].material.envMap = envMap;
                scene.add(object.scene);
                good();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        );
});

await new Promise((good, bad) => {
    fbxLoader.load(
        './life.glb',
        (object) => {
            // object.traverse(function (child) {
            //     if ((child as THREE.Mesh).isMesh) {
            //         // (child as THREE.Mesh).material = material
            //         if ((child as THREE.Mesh).material) {
            //             ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).transparent = false
            //         }
            //     }
            // })
            // object.scale.set(.01, .01, .01)
            //shelfdoor = object.scene.children[0];
            console.log(object, "nigger");
            window.gol = object.scene.children[0];
            window.gol.position.set(0.5, .9, .6);
            window.gol.scale.set(.05, .05, .05);
            window.gol.rotation.set(0,Math.PI/2,0);
            window.gol.interact = () => {
                window.gol.material.emissive = new THREE.Color(0xfff); //not sure why i thought this was white lilol (well ok sometimes you can have like a 3 number thang)
                setTimeout(()=> {
                    document.location.href = "https://magicquest.github.io/ca";
                },5000);
            }           
            //shelfdoor.children[0].material.envMap = envMap;
            //shelfdoor.children[1].material.envMap = envMap;
            scene.add(object.scene);
            good();
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        (error) => {
            console.log(error)
        }
    );
});

await new Promise((good, bad) => {
    fbxLoader.load(
        './speaker3.glb',
        (object) => {
            // object.traverse(function (child) {
            //     if ((child as THREE.Mesh).isMesh) {
            //         // (child as THREE.Mesh).material = material
            //         if ((child as THREE.Mesh).material) {
            //             ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).transparent = false
            //         }
            //     }
            // })
            // object.scale.set(.01, .01, .01)
            //shelfdoor = object.scene.children[0];
            //console.log(object, "nigger");
            window.speaker = object.scene.children[0];
            window.speaker.position.set(0.45, .20, .6);
            window.speaker.scale.set(.1, .1, .1);
            window.speaker.rotation.set(0,-.25,0);
            window.speaker.interact = () => {
                window.speaker.children[0].material.emissive.r = .3;// = new THREE.Color(0x0000ff);
                let startup = new Audio("/music/mqstartup3.wav");
                //startup.ontimeupdate = (event) => {
                //    console.log(event.currentTarget.currentTime); //kinda fired every half second
                //    window.speaker.children[0].material.emissive.r = Math.sin(event.currentTarget.currentTime)/3.33333333;
                //}
                //window.lol = 0;
                let int = 0;
                window.randomactionidkfella = () => {
                    window.speaker.children[0].material.emissive.r = Math.abs(Math.sin(int/50)/3.33333333);
                    int++;
                    //window.lol++; //yo this is like a poor man's global variable :sob: (i didn't think i could use a local let right here but i gues so)
                }
                startup.onended = () => {
                    document.location.href = "/music";
                };
                startup.play();
                //window.speaker.children[1].material.emissive = new THREE.Color(0xff0000); material don't matter or sumn idk
                //setTimeout(()=> {
                //    document.location.href = "https://magicquest.github.io/music";
                //},5000);
                return true;
            }           
            //shelfdoor.children[0].material.envMap = envMap;
            //shelfdoor.children[1].material.envMap = envMap;
            scene.add(object.scene);
            good();
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        (error) => {
            console.log(error)
        }
    );
});
    
//});

// damn this still ain't work
/*
let object = new GLTFLoader().load('./shelf2.glb');
shelf = object.scene.children[0].children[0];
console.log("nigga", shelf, object);
//shelf.material.normalMap = new THREE.TextureLoader().load( 'housetexturenormal2 4k.png' );
scene.add(object.scene)

object = new GLTFLoader().load('./shelfdoor.glb');
shelfdoor = object.scene.children[0];
console.log(shelfdoor.children[0]);
//shelfdoor.children[0].material.envMap = envMap;
//shelfdoor.children[1].material.envMap = envMap;
scene.add(object.scene);
*/

//let getPlaneImage = new Promise((good, bad) => { //eurithra i can use promises to force synchronization

//});
const wall = new THREE.TextureLoader().load( 'wall.png' ); //in the docs this is allowed!?
const house = new THREE.TextureLoader().load( 'house2.jpg' ); //in the docs this is allowed!? (accidently had this say house2.jpg aswell so idk it don't seem to matter)
const house2 = new THREE.TextureLoader().load( 'house2.jpg' ); //in the docs this is allowed!?

function makePlane(txtr, size, position) {
    const img = new THREE.MeshPhysicalMaterial({
        map:txtr,
    });
    img.map.needsUpdate = true;

    // plane
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.y),img); // (189, 252) & (378, 504)
    plane.position.set(position.x, position.y, position.z);
    //plane.overdraw = true;
    scene.add(plane);
    return plane;
}

const plane = makePlane(house, {x: 252/31, y: 252/31}, new THREE.Vector3(.1, -0.3, -.22));
const plane2 = makePlane(house2, {x: 252/21, y: 189/31}, new THREE.Vector3(.1, -0.3, -.21));
const wip = makePlane(wall, {x: 819/400, y: 715/400}, new THREE.Vector3(.02, 0.6, .1));

//const img = new THREE.MeshBasicMaterial({ //CHANGED to MeshBasicMaterial (lol not my comment)
//    map:house,//THREE.ImageUtils.loadTexture('img/front.jpg') //erm i kinda don't really care (ok nevermind it has been removed 😂💯😂)
//});
//img.map.needsUpdate = true; //ADDED
//
//// plane
//const plane = new THREE.Mesh(new THREE.PlaneGeometry(252/31, 189/31),img); // (189, 252) & (378, 504)
//plane.position.set(.1, -0.3, -.21);
////plane.overdraw = true;
//scene.add(plane);
//
//
//const wallImg = new THREE.MeshPhysicalMaterial({ //CHANGED to MeshBasicMaterial (lol not my comment)
//    map:wall,//THREE.ImageUtils.loadTexture('img/front.jpg') //erm i kinda don't really care (ok nevermind it has been removed 😂💯😂)
//});
//wallImg.map.needsUpdate = true; //ADDED
//
//// plane
//const wip = new THREE.Mesh(new THREE.PlaneGeometry(819/400, 715/400),wallImg); // (189, 252) & (378, 504)
//wip.position.set(.02, 0.6, .1);
////plane.overdraw = true;
//scene.add(wip);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild( renderer.domElement );

addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera)
    //erm if you had an ultra wide monitor you would see the hdr (which imma remove in a sec)
 });

window.controls = new OrbitControls( camera, renderer.domElement ); //haha usiung window is genious
  //controls.addEventListener( 'change', animate ); // use if there is no animation loop
controls.minDistance = 2;
controls.maxDistance = 10;
controls.target.set( 0, 0, - 0.2 );
controls.update();
controls.enabled = false;


let shit = false;

let postInteraction = false;

let mouse = {x: 0, y: 0};

window.animations = []; //using window actually exposes module vars (which is why i hate using modules because all of this debugging is locked behind the shit)

window.animations.push({tick: (nowTime, startTime) => {
    let time = nowTime-startTime;
    cube.position.y = lerp(.9, 1, /*kystep*/cosdip(0,1,time/5)); //https://www.desmos.com/calculator/e6ww76gpur
    if(time > 5) {
        //postInteraction = true; //wtf is postinteraction (wait its a global nvm thats fort somer shit)
        return false;
    }
    return true;
}, startTime: Date.now()/1000+Math.random(), loop: true});

window.animations.push({tick: (nowTime, startTime) => {
    let time = nowTime-startTime;
    window.gol.position.y = lerp(.9, 1, /*kystep*/cosdip(0,1,time/5)); //https://www.desmos.com/calculator/e6ww76gpur
    if(time > 5) {
        //postInteraction = true; //wtf is postinteraction (wait its a global nvm thats fort somer shit)
        return false;
    }
    return true;
}, startTime: Date.now()/1000+Math.random(), loop: true});


function smoothstep (min, max, value) { //erm wait a minute MathUtils.smoothstep is a thing (shoot im not using that) and they got smootherstep 😭image.png (@manvel gif)
    let x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return x*x*(3 - 2*x);
}; //https://www.desmos.com/calculator/wuuwsybycn - desmos.com/calculator/lo90tmgdma

function smootherstep(min, max, value) {
    //https://www.desmos.com/calculator/1ebqh0pqwt
    let x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return smoothstep(min, max, x*x*(3 - 2*x));
}

function kystep(min, max, value) {
    let x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return (-Math.cos(Math.PI**(2*x))+1)/2; //(-Math.cos(180**(1.21*x))+1)/2; (js used radians and not degrees like desmos so i had to upgrade the plotter to show me that);
}

function easeilo(min, max, value) { //ease in less out (https://www.desmos.com/calculator/e521id72yu)
    let x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return (x**Math.E)*(3-2*x); //(-Math.cos(180**(1.21*x))+1)/2; (js used radians and not degrees like desmos so i had to upgrade the plotter to show me that);
}

//a little tom foolery (https://www.desmos.com/calculator/ul0qj1ovqn)

function cosdip(min, max, value) {
    let x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return (Math.cos(x*2*Math.PI)/2)+.5;
}

function lerp( a, b, t ) {
    return a + t * ( b - a );
}

//class anime { //ahha thinking about animejs.com
//    tick;
//    startTime;
//    loop;
//
//    constructor(tick, startTime = Date.now()/1000, loop = false) {
//        this.tick = tick;
//        this.startTime = startTime;
//        this.loop = loop;
//    }
//}

function animate(time) {
	requestAnimationFrame( animate );

	cube.rotation.x += 0.01;//+(Math.random()/100);
	cube.rotation.y += 0.01;//+(Math.random()/100);

    window.gol.rotation.x += 0.01;//+(Math.random()/100);
    window.gol.rotation.y += 0.01;//+(Math.random()/100);
    window.gol.rotation.z += 0.01;

    window.speaker.rotation.z = Math.sin(time/400)/10;
    //window.speaker.rotation.y = Math.cos(time/400)/10 - .25;
    //window.speaker.rotation.z += 0.01;

    let r = [];

    for(let avi of window.animations) {
        //let destroy = {destroy: false};
        //avi.tick(Date.now()/1000, avi.startTime, destroy);
        //if(destroy.destroy) { //yo this is kinda weird lol i should just return bruh
        if(!avi.tick(Date.now()/1000, avi.startTime)) {
            if(avi.loop) {
                avi.startTime = Date.now()/1000;
                continue;
            }
            r.push(avi);
        }
    }

    for(let avi of r) {
        window.animations.splice(window.animations.indexOf(avi),1);
    }
    //dL.target.updateMatrixWorld();
    //dL.shadow.camera.updateProjectionMatrix();
    //shadowCameraHelper.update();

    window.randomactionidkfella?.(); //WTF IS THAT SHIT

	renderer.render( scene, camera );

    if(!shit && shelf && shelfdoor) {
        shit = true;
        console.log(shelf, shelfdoor);
        gui.add({ debug: function() {
            debug = !debug;
            controls.enabled = debug;
            if(!debug) {
                camera.position.set(0, .5, 2.4);
                camera.position.x = 0;
                camera.position.z = 2.4;
                camera.position.y = .5;
                camera.rotation.set(0,0,0);
                lightHelper.visible = false;
                lightHelper2.visible = false;
                lightHelper3.visible = false;
                //dLH.visible = false;
            }else {
                lightHelper.visible = true;
                lightHelper2.visible = true;
                lightHelper3.visible = true;
                //dLH.visible = true;
            }
        } }, 'debug');

        const shelfFolder = gui.addFolder('Shelf')
        shelfFolder.add(shelf.rotation, 'x', -Math.PI*2, Math.PI * 2)
        shelfFolder.add(shelf.rotation, 'y', -Math.PI*2, Math.PI * 2)
        shelfFolder.add(shelf.rotation, 'z', -Math.PI*2, Math.PI * 2)
        shelfFolder.add(shelf.material, 'visible', false, true);
        shelfFolder.add(shelf, 'castShadow', false, true);
        shelfFolder.add(shelf, 'receiveShadow', false, true);
        //shelfFolder.open()    
        
        const doorFolder = gui.addFolder('ShelfDoor')
        doorFolder.add(shelfdoor.rotation, 'x', -Math.PI*2, Math.PI * 2)
        doorFolder.add(shelfdoor.rotation, 'y', -Math.PI*2, Math.PI * 2)
        doorFolder.add(shelfdoor.rotation, 'z', -Math.PI*2, Math.PI * 2);
        doorFolder.add(shelfdoor, 'visible', false, true);
        doorFolder.add(shelfdoor, 'castShadow', false, true);
        doorFolder.add(shelfdoor, 'receiveShadow', false, true);
        //doorFolder.open()

        const cameraFolder = gui.addFolder('Camera');
        cameraFolder.add(camera.position, 'x', -10, 10);
        cameraFolder.add(camera.position, 'y', -10, 10);
        cameraFolder.add(camera.position, 'z', -10, 10);
        //cameraFolder.open();

        const pF = gui.addFolder("PointLight");
        pF.add(light.position, 'x', -10, 10);
        pF.add(light.position, 'y', -10, 10);
        pF.add(light.position, 'z', -10, 10);
        pF.add(light, 'intensity', -10, 10);
        pF.add(light, 'castShadow', false, true);
        //pF.open();
        console.log(pF);

        const planeFolder = gui.addFolder("Plane");
        planeFolder.add(plane.position, 'x', -10, 10);
        planeFolder.add(plane.position, 'y', -10, 10);
        planeFolder.add(plane.position, 'z', -10, 10);
        //planeFolder.open();

        const wallFolder = gui.addFolder("Wall");
        wallFolder.add(wip.position, 'x', -10, 10);
        wallFolder.add(wip.position, 'y', -10, 10);
        wallFolder.add(wip.position, 'z', -10, 10);
        //wallFolder.open();

        const cubeFolder = gui.addFolder("Cube (b2d icon)"); //box2d
        cubeFolder.add(cube.position, 'x', -10, 10);
        cubeFolder.add(cube.position, 'y', -10, 10);
        cubeFolder.add(cube.position, 'z', -10, 10);
        cubeFolder.add(cube.scale, 'x', 0, 1);
        cubeFolder.add(cube.scale, 'y', 0, 1);
        cubeFolder.add(cube.scale, 'z', 0, 1);
        cubeFolder.add(cube, 'castShadow', false, true);
        cubeFolder.add(cube, 'receiveShadow', false, true);

        const directLight = gui.addFolder("directional lightgniv");
        directLight.add(dL.position, 'x', -10, 10);
        directLight.add(dL.position, 'y', -10, 10);
        directLight.add(dL.position, 'z', -10, 10);
        directLight.add(dL.rotation, 'x', -Math.PI*2, Math.PI*2);
        directLight.add(dL.rotation, 'y', -Math.PI*2, Math.PI*2);
        directLight.add(dL.rotation, 'z', -Math.PI*2, Math.PI*2);
        directLight.add(dL, 'intensity', -10, 10);
        directLight.add(dL, 'castShadow', false, true);
        directLight.add(dL.shadow, 'bias', -1, 1);
        directLight.add(dL.shadow.camera, 'near', -100, 100);
        directLight.add(dL.shadow.camera, 'far', -100, 100);
        //cubeFolder.open();
        //gui.remember(shelf);

        //gui.add(shelf, 'rotation');

        //gui.remember(shelfdoor);

        //gui.add(shelfdoor, 'rotation');
    }
};

animate();

console.log(camera);

addEventListener("touchmove", (event) => {
    event.preventDefault();
    if(!debug) {
        if(postInteraction) {
            camera.rotation.y = .125-event.touches[0].clientX/(window.innerWidth*4); //some math involved between the first const and second 😭
            camera.rotation.x = .125-event.touches[0].clientY/(window.innerHeight*4);
        }else {
            camera.rotation.y = 0.0625-event.touches[0].clientX/(window.innerWidth*8); //some math involved between the first const and second 😭
            camera.rotation.x = 0.0625-event.touches[0].clientY/(window.innerHeight*8);
        }
    }
});

addEventListener("mousemove", (event) => {
    //console.log("x", .25-event.clientY/(window.innerHeight*2), " yt ", .25-event.clientX/(window.innerWidth*2));
    if(!debug) {
        if(postInteraction) {
            camera.rotation.y = .125-event.clientX/(window.innerWidth*4); //some math involved between the first const and second 😭
            camera.rotation.x = .125-event.clientY/(window.innerHeight*4);
        }else {
            camera.rotation.y = 0.0625-event.clientX/(window.innerWidth*8); //some math involved between the first const and second 😭
            camera.rotation.x = 0.0625-event.clientY/(window.innerHeight*8);
        }
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
  
    let intersects = raycaster.intersectObject(scene, true);
  
    if (intersects.length > 0) {
      
        let object = intersects[0].object;
  
        //console.log(intersects, object);
        if(((object == shelfdoor.children[0] && !postInteraction) || object.interact) || object.parent.interact) {
            //object.material.color.set( Math.random() * 0xffffff );
            renderer.domElement.style.cursor = "pointer";
        //}else if(object.parent.interact ){ //the moment i thought about using the ?. operator it doesn't matter lol (ok i should use it when i want to access a some shit like mozillia saysi t https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
            //renderer.domElement.style.cursor = "pointer";
        }else {
            renderer.domElement.style.cursor = "";
        }
  
    }else {
        renderer.domElement.style.cursor = "";
    }
});

let raycaster = new THREE.Raycaster();

addEventListener("mousedown", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    raycaster.setFromCamera(mouse, camera);
  
    let intersects = raycaster.intersectObject(scene, true);
  
    if (intersects.length > 0) {
      
        let object = intersects[0].object;

        console.log(intersects, object);
        if(object == shelfdoor.children[0] && !postInteraction) {
            //object.material.color.set( Math.random() * 0xffffff );
            window.animations.push({tick: function(nowTime, startTime) { //uhhhh listen to music (flex) B) then watch smosh but then watch instargm
            //window.animations.push(new anime(() => {//i got this new anime plot
                //console.log(this, "log this");
                let time = nowTime-startTime;
                shelfdoor.rotation.y = lerp(-1.6, 0, /*kystep*/smoothstep(0,1,time)); //4.71238898038469 used by addubg 270 or 360 idk in radians (wait this still ain';t even the effect iwant)
                camera.position.z = lerp(2.4, 4.2, smoothstep(0,1,time));
                camera.fov = lerp(75, 30, smootherstep(0,1,time));
                camera.updateProjectionMatrix();
                light.intensity = lerp(1, .5, time);
                if(time > 1) {
                    //kill.destroy = true;
                    postInteraction = true;
                    return false;
                }
                return true;
            //}));
            }, /*destroy: false,*/ startTime: Date.now()/1000, loop: false}); //should most certainly use a class for this so thats what imma do ina mine
        }else if(object.interact || object.parent.interact) {
            if(!object.parent.interact?.()) { //yo this is lit!!! (you fr need ?. if i want to interact with the other objs)
                object.interact();
            }
        }
    }
});