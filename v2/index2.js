import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
    RGBELoader
  } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//import { GUI } from 'dat.gui'
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
scene.add( cube );

const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0.5, 2.7, 2.2);//(0,.5,2.4);
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
//var shadowCameraHelper = new THREE.CameraHelper(dL.shadow.camera);
//shadowCameraHelper.visible = true;

//const dLH = new THREE.DirectionalLightHelper(dL, .25);
scene.add(dL);
//scene.add(dLH);
//scene.add(shadowCameraHelper);
//let envMap;

let shelfdoor;//shelf, shelfdoor;

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

function lerp( a, b, t ) {
    return a + t * ( b - a );
}

function animate(time) {
	requestAnimationFrame( animate );

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

    let r = [];

    for(let avi of window.animations) {
        let destroy = {destroy: false};
        avi.tick(Date.now()/1000, avi.startTime, destroy);
        if(destroy.destroy) {
            r.push(avi);
        }
    }

    for(let avi of r) {
        window.animations.splice(window.animations.indexOf(avi),1);
    }
    //dL.target.updateMatrixWorld();
    //dL.shadow.camera.updateProjectionMatrix();
    //shadowCameraHelper.update();
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

        const cubeFolder = gui.addFolder("Cube (b2d icon)");
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
        if(object == shelfdoor.children[0] && !postInteraction) {
            //object.material.color.set( Math.random() * 0xffffff );
            renderer.domElement.style.cursor = "pointer";
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
            window.animations.push({tick: function(nowTime, startTime, kill) {
                //console.log(this, "log this");
                let time = nowTime-startTime;
                shelfdoor.rotation.y = lerp(-1.6, 0, time); //4.71238898038469 used by addubg 270 or 360 idk in radians (wait this still ain';t even the effect iwant)
                camera.position.z = lerp(2.4, 4.2, time);
                camera.fov = lerp(75, 30, time);
                camera.updateProjectionMatrix();
                light.intensity = lerp(1, .5, time);
                if(time > 1) {
                    kill.destroy = true;
                    postInteraction = true;
                }
            }, /*destroy: false,*/ startTime: Date.now()/1000});
        }
  
    }
});