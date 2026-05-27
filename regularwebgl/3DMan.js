//attrib location 0 is a_position
//attrib location 1 is a_normal
//attrib location 2 is a_texCoord (texCoords could be three dimensional for models with multiple textures)
//optional
//instanced attrib location 3 is ai_color
//instanced attrib location 4,5,6,7 is ai_matrix

//uniform locations
//u_worldMatrix*^1
//u_viewProjectionMatrix
//u_color*
//u_lightColor
//u_lightPosition
//u_texture
//* only applies without instancing, replaced by ai_matrix and v_color
//^1 previously u_localMatrix

//varying
//v_normal
//v_texCoord
//v_color*
//v_texId^1
//* instanced only
//[^1] idk yet lol

//instancing with different colors could start impacting the Big Perf (wait nevermind i was thinking about doing it per vertex and not per instance!)

//optionally, i could -- in compileDrawingCommands -- weed out the invisible objects and call compileDrawingCommands when ModelInstance.visible is set

//https://computergraphics.stackexchange.com/questions/37/what-is-the-cost-of-changing-state (explains why several small draw calls are bad)
//https://community.khronos.org/t/performance-question-switch-shaders-or-use-empty-texture/76304/6

//shader
//model
//material
//instance

//model holds count of textures, instances hold texture objects then, uhhhh, somehow i make that work (maybe models hold ACTUAL material objects that hold the textures (and colors?))
//that boy said we don't do atlases for 3d. what do we do then? (google: using multiple textures in 3d)

function showError(message) {
	if(globalThis["document"]) {
		document.write(message);
	}else {
		print(message); //jbs3
	}
}

function createProgramSimple(vertexText, fragmentText) {
    const vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, vertexText);
    gl.compileShader(vshader);

    const fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, fragmentText);
    gl.compileShader(fshader);

    let program = gl.createProgram();
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    //here's where you might gl.bindAttribLocation...
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        showError(gl.getProgramInfoLog(program));
		showError(gl.getShaderInfoLog(vshader));
		showError(gl.getShaderInfoLog(fshader));
        gl.detachShader(program, vshader);
        gl.detachShader(program, fshader);
        gl.deleteProgram(program);
        program = undefined;
    }
    if(program) {
        gl.detachShader(program, vshader);
        gl.detachShader(program, fshader);
    }
    gl.deleteShader(fshader);
    gl.deleteShader(vshader);
    return program;
}

//contains all the information needed for a single draw call (including the info in material and model lol)
class DrawCall {
    material;
    model;
    instances;
    perInstanceColor;
}

//instances array could belong to a world to manage different scenes or something if i needed that lol
const instances = [];
let drawingCommands = [];

class Renderer {
    static whitePixelTexture = undefined;

    static init(gl) {
        Renderer.whitePixelTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.whitePixelTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    static destroy() {
        gl.deleteTexture(Renderer.whitePixelTexture);
    }
}

//maybe rename to RenderingMode
//class Shader {
class Material {
    // _wireframe; //idk if the material should handle wireframe...
    unlit;
    useCubemap;
    useTextureArray;
    program;
    uniformLocations;
    instancedProgram = undefined; //only created when needed
    instancedUniformLocations;
    mode;

    _customInstancedProgramCallback; // => [vertexShader, fragmentShader]

    //instancesPerModel = new Map();
    static instancesPerMaterial = new Map(); // {material: {model: {instances: [instance, instance], position: i}}}
    static transparentInstancesPerMaterial = new Map(); // {[Material] => {[Model] => {instances: [instance, instance], position: i}}}

    constructor(gl, unlit, useCubemap, useTextureArray, customProgram = undefined, customInstancedProgramCallback = undefined) {
        mode = gl.TRIANGLES;
        this.unlit = unlit;
        Material.instancesPerMaterial.set(this, new Map());
        Material.transparentInstancesPerMaterial.set(this, new Map());
        if(customProgram) {
            this.program = customProgram;
        }else {
            this.program = ...; //create program based on properties
        }
        this._customInstancedProgramCallback = customInstancedProgramCallback;
        this.uniformLocations["u_matrix"] = gl.getUniformLocation(this.program, "u_matrix");
        this.uniformLocations["u_color"] = gl.getUniformLocation(this.program, "u_color");
        if(!this.unlit) {
            //... (should i do point lights or direction or should i do both and how do i do multiple point lights?)
        }
    }

    static custom(gl, program, customInstancedProgramCallback) {
        return new Material(gl, undefined, undefined, undefined, program, customInstancedProgramCallback);
    }

    //addRef(model) {
    //    debugger;
    //    if(!this.instancesPerModel.has(model)) {
    //        this.instancesPerModel.set(model, 1);
    //    }else {
    //        this.instancesPerModel.set(model, this.instancesPerModel.get(model)+1);
    //    }
    //}
    //
    //subRef(model) {
    //    debugger;
    //    if(!this.instancesPerModel.has(model)) {
    //        throw Error("subRef called yet no models use this material?");
    //    }
    //    const v = this.instancesPerModel.get(model);
    //    if(v == 1) {
    //        //yeah we're just gonna delete this one
    //        this.instancesPerModel.delete(model);
    //    }else {
    //        this.instancesPerModel.set(model, v-1);
    //    }
    //}

    addRef(instance) {
        let instancesPerModel;
        if(instance._color[3] != 1.0) {
            //transparent!
            //verbose!
            //if (!Material.transparentInstancesPerMaterial.has(this)) {
            //    instancesPerModel = new Map();
            //} else {
                instancesPerModel = Material.transparentInstancesPerMaterial.get(this);
            //}
        }else {
            //if (!Material.instancesPerMaterial.has(this)) {
            //    instancesPerModel = new Map();
            //} else {
                instancesPerModel = Material.instancesPerMaterial.get(this);
            //}
        }
        let metadata;
        if (!instancesPerModel.has(instance.model)) {
            metadata = {instances: [], position: undefined};
        } else {
            metadata = instancesPerModel.get(instance.model);
        }
        metadata.instances.push(instance);
    }

    subRef(instance) {
        let instancesPerModel;
        if(instance._color[3] != 1.0) {
            //transparent!
            instancesPerModel = Material.transparentInstancesPerMaterial.get(this).get(instance.model);
        }else {
            instancesPerModel = Material.instancesPerMaterial.get(this).get(instance.model);
        }
        const metadata = instancesPerModel.get(instance.model);
        if(metadata.instances.length == 1) {
            instancesPerModel.delete(instance.model);
        }else {
            metadata.instances.splice(metadata.instances.findIndex(v=>v==instance), 1);
        }
        //we don't have to set it again because it's a reference :)
    }

    //call this function to translate Material.instancePerMaterial and friends into drawing commands
    //typically called when an object's material changes
    static compileDrawingCommands() {
        drawingCommands = [];

        for (const material of Material.instancesPerMaterial.keys()) {
            const instancesUsing = Material.instancesPerMaterial.get(material);
            for (const metadata of instancesUsing.values()) {
                const arr = metadata.instances;
                const model = arr[0].model;
                const temp = new DrawCall;
                temp.material = material;
                temp.model = model;
                temp.instances = [];
                temp.perInstanceColor = false;
                let lastColor = arr[0]._color;
                if (arr.length != 1 && material.instancedProgram == undefined) {
                    //well shit
                    material.createInstancedProgram();
                }
                for (const instance of arr) {
                    //for of ^ 3
                    if(!temp.perInstanceColor) {
                        for(let i = 0; i < instance._color.length; i++) {
                            const c = instance._color[i];
                            if(c != lastColor[i]) {
                                temp.perInstanceColor = true;
                                break;
                            }
                        }
                    }
                    temp.instances.push(instance);
                }
                metadata.position = drawingCommands.push(temp)-1; //ok bro
            }
        }
    }

    checkColorForInstancingOptimization(instance) {
        let instancesPerModel;
        if(instance._color[3] != 1.0) {
            //transparent!
            instancesPerModel = Material.transparentInstancesPerMaterial.get(this).get(instance.model);
        }else {
            instancesPerModel = Material.instancesPerMaterial.get(this).get(instance.model);
        }
        const metadata = instancesPerModel.get(instance.model);
        const drawcall = drawingCommands[metadata.position];
        drawcall.perInstanceColor = false;
        let lastColor = metadata.instances[0]._color;
        instanceLoop: //probably the third ever time i've used a label in javascript
        for(const instance of metadata.instances) {
            for(let i = 0; i < instance._color.length; i++) {
                const c = instance._color[i];
                if(c != lastColor[i]) {
                    drawcall.perInstanceColor = true;
                    break instanceLoop;
                }
            }
        }
    }

    //moved into ModelInstance because this would be easier there lol!
    /*updateTransparency(instance, transparent) {
        this.subRef(instance); //remove instance from map based on current color
        if (transparent) { //now transparent
            //we can (probably) assume this instance is already in Material.instancesPerMaterial
            
        } else { //now opaque

        }
    }*/

    //get mode() {
    //    return this._wireframe ? gl.LINES : gl.TRIANGLES;
    //}

    //called when two or more instances use the same model AND same material
    createInstancedProgram() {
        if(this._customInstancedProgramCallback) {
            const [vertexShader, fragmentShader] = this._customInstancedProgramCallback();
            this.instancedProgram = createProgramSimple(vertexShader, fragmentShader);
        }else {
            //lookup a vertex+fragment shader combo that has instanced attributes for the matrix, etc.
            //...
        }
    }

    destroy() {
        gl.deleteProgram(this.program);
        if (this.instancedProgram) {
            gl.deleteProgram(this.instancedProgram);
        }
        if (Material.instancesPerMaterial.has(this)) {
            const moogcity2 = Material.instancesPerMaterial.get(this);
            if(moogcity2.keys().toArray().length) {
                console.warn("Material destroyed yet there are instances that use it!", moogcity2);
            }
            Material.instancesPerMaterial.delete(this);
        }
        if (Material.transparentInstancesPerMaterial.has(this)) {
            const whatcourtemancheseffortsoundslike = Material.transparentInstancesPerMaterial.get(this);
            if(whatcourtemancheseffortsoundslike.keys().toArray().length) {
                console.warn("Material destroyed yet there are (transparent) instances that use it!", whatcourtemancheseffortsoundslike);
            }
            Material.transparentInstancesPerMaterial.delete(this);
        }
    }
}

class Model {
    //_billboard; (maybe this should be in ModelInstance)
    VAO;

    _vertices;
    _normals;
    _texCoords; //optional

    vertexBuffer;
    normalBuffer;
    texCoordBuffer; //optional

    instancedColorBuffer; //optional but unless you promise to only use this object once (singleUsePerMaterial), it'll be created
    instancedColorBufferLen; //for sub optimization
    instancedMatrixBuffer; //optional but unless you promise to only use this object once (singleUsePerMaterial), it'll be created
    instancedMatrixBufferLen; //for bufferSubData optimization

    //vertexCount;

    wireframe;

    defaultMaterial;

    textureCount;

    //id;

    //instances; //instances sorted by material, we'll use actual instancing if there's more than one for the same material (but then i'd have to use a different shader)

    constructor(vertices, normals = undefined, texCoords = undefined, singleUse = false) {
        if (vertices.length % 9 != 0) throw Error("Model::Model can only use triangulated vertices! Use wireframe for gl.LINES, otherwise fuck you!");
        if (!normals) {
            normals = Model.calculateNormals(vertices);
        }
        this._vertices = vertices;
        this._normals = normals;
        this._texCoords = texCoords;

        this.VAO = glPolyfill.createVertexArray(gl);
        glPolyfill.bindVertexArray(gl, this.VAO);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); //a_position
        gl.enableVertexAttribArray(0); //a_position

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0); //a_normal
        gl.enableVertexAttribArray(1); //a_normal

        if (texcoords) {
            this.texCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0); //a_texCoord
            gl.enableVertexAttribArray(2); //a_texCoord
        }else {
            //0.5 to sample in the middle of the texture (the 1x1 white pixel)
            gl.vertexAttrib2f(2, 0.5, 0.5); //a_texCoord
            gl.enableVertexAttribArray(2); //a_texCoord
        }

        if(!singleUse) {
            this.instancedColorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.instancedColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 1.0, 1.0, 1.0]), gl.DYNAMIC_DRAW);
            this.instancedColorBufferLen = 4;
            // gl.vertexAttrib4f(3, 1.0, 1.0, 1.0, 1.0); //ai_color
            gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
            glPolyfill.vertexAttribDivisor(3, 1); 
            gl.enableVertexAttribArray(3); //ai_color

            this.instancedMatrixBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.instancedMatrixBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, m4.identity(), gl.DYNAMIC_DRAW);
            this.instancedColorBufferLen = 16;
            //gl.vertexAttrib4f(4, 1.0, 0.0, 0.0, 0.0); //ai_matrix
            //gl.vertexAttrib4f(4+1, 0.0, 1.0, 0.0, 0.0); //ai_matrix
            //gl.vertexAttrib4f(4+2, 0.0, 0.0, 1.0, 0.0); //ai_matrix
            //gl.vertexAttrib4f(4+3, 0.0, 0.0, 0.0, 0.0); //ai_matrix
            gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16*4, 0);
            gl.vertexAttribPointer(4+1, 4, gl.FLOAT, false, 16*4, 4);
            gl.vertexAttribPointer(4+2, 4, gl.FLOAT, false, 16*4, 8);
            gl.vertexAttribPointer(4+3, 4, gl.FLOAT, false, 16*4, 12);
            glPolyfill.vertexAttribDivisor(4, 1);
            glPolyfill.vertexAttribDivisor(4+1, 1);
            glPolyfill.vertexAttribDivisor(4+2, 1);
            glPolyfill.vertexAttribDivisor(4+3, 1);
            gl.enableVertexAttribArray(4); //ai_matrix
            gl.enableVertexAttribArray(4+1); //ai_matrix+1
            gl.enableVertexAttribArray(4+2); //ai_matrix+2
            gl.enableVertexAttribArray(4+3); //ai_matrix+3
        }

        //this.vertexCount = vertices.length;

        //this.id = Math.floor(Math.random() * 1000000);
    }

    //iPromiseNotToUseThisModelMoreThanOnceWithTheSameMaterial
    //this is inherited by wireframeCopy!
    singleUsePerMaterial() {
        gl.disableVertexAttribArray(3); //ai_color
        gl.disableVertexAttribArray(4); //ai_matrix
        gl.disableVertexAttribArray(4+1); //ai_matrix+1
        gl.disableVertexAttribArray(4+2); //ai_matrix+2
        gl.disableVertexAttribArray(4+3); //ai_matrix+3

        gl.deleteBuffer(this.instancedColorBuffer);
        gl.deleteBuffer(this.instancedMatrixBuffer);
        
        this.instancedColorBuffer = undefined;
        this.instancedMatrixBuffer = undefined;

        return this;
    }

    /*Model*/ wireframeCopy() {
        if (vertices.length % 9 != 0) throw Error("Model::wireframeCopy called on model with non-triangular vertices!");
        const vertices = Model.calculateLinesFromEdges(this._vertices);
        const normals = Model.calculateLinesFromEdges(this._normals);
        let texCoords = undefined;
        if(this._texCoords) {
            texCoords = Model.calculateLinesForTexCoords(this._texCoords);
        }
        return new Model(vertices, normals, texCoords, this.instancedColorBuffer == undefined);
    }

    destroy() {
        glPolyfill.deleteVertexArray(gl, this.VAO);
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.normalBuffer);
        if (this.texCoordBuffer) {
            gl.deleteBuffer(this.texCoordBuffer);
        }
        if(this.instancedColorBuffer) {
            gl.deleteBuffer(this.instancedColorBuffer);
        }
        if(this.instancedMatrixBuffer) {
            gl.deleteBuffer(this.instancedMatrixBuffer);
        }
    }
}

//probably not gonna be called that
class ModelInstance {
    _position = [0.0, 0.0, 0.0];
    _matrix = m4.identity();
    _color = new Float32Array([1.0, 1.0, 1.0, 1.0]);
    _material;
    billboard = false;
    visible = true;
    model;
    textures = [];
    constructor(model) {
        this.model = model;
        this.material = model.defaultMaterial;
        instances.push(this);
    }
    set material(newValue) {
        if (!(newValue instanceof Material)) {
            //catastrophic failure man, go back
            alert("Goodbye cruel world!");
            window.history.back();
        }
        if (this._material) {
            this._material.subRef(this);
        }
        newValue.addRef(this);
        this._material = newValue;
        Material.compileDrawingCommands();
        //make sure this is a valid configuration
    }
    setPosition(x, y, z) {
        this._position = [x, y, z];
        m4.translation(x, y, z, this._matrix);
    }
    setColor(r, g, b, a) {
        const oldalpha = this._color[3];
        let dobother = false;
        if (oldalpha != a) {
            debugger; //lowkey was writing bullshit
            dobother = oldalpha == 1.0 || (oldalpha != 1.0 && a == 1.0);
            if(dobother) {
                this._material.subRef(this);
            }
            //if (oldalpha == 1.0) { //if our old color was not transparent
            //    this.material.subRef(this);
            //    //this.material.updateTransparency(this, true);
            //} else if (a == 1.0) { //if our old color was transparent but now it's not
            //    this.material.subRef(this);
            //    //this.material.updateTransparency(this, false);
            //}
        }
        this._color.set([r, g, b, a]);
        if (dobother) {
            this._material.addRef(this);
        }
        this._material.checkColorForInstancingOptimization(this);
    }
    destroy() {
        this.model = undefined;
        this.material = undefined; //by setting our material to undefined we have the setter update our status to the material thereby
        instances.splice(instances.findIndex(v=>v==this), 1);
    }
    //draw() {
    //    this.material.draw();
    //}
}

//const material = new Material(...);
//const wireframe = new Material(...).wireframe();
//const cube = new Model(...);
//cube.defaultMaterial = material;
//
//const instance = new ModelInstance(cube);
//instance.draw();
//const instance2 = new ModelInstance(cube);
//instance2.material = wireframe; //adds the wireframe vertices to the original cube model and uses them to draw
//instance2.draw();

//yeah ok all that shit i wrote was cap
//how will i actually draw these

debugger;
Renderer.init(gl);
const material = new Material(gl, false, false, false);
const cubeModel = new Model([
  //x    y     z
    1.0, -1.0, 1.0, // front
    -1.0, 1.0, 1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
]);
cubeModel.defaultMaterial = material;
const planeModel = new Model([
    1.0, 0.0, 1.0,
    -1.0, 0.0, -1.0,
    -1.0, 0.0, 1.0,
    -1.0, 0.0, -1.0,
    1.0, 0.0, 1.0,
    1.0, 0.0, -1.0,
]).singleUsePerMaterial(); //i promise
planeModel.defaultMaterial = material;

const cube1 = new ModelInstance(cubeModel);
const cube2 = new ModelInstance(cubeModel);
const plane = new ModelInstance(plane);

function animate(t) {
    draw(t, camera);
    requestAnimationFrame(animate);
}
animate();

//moved to Material
//function sortEtAddDrawingCommand(instancesPerMaterial) {
//
//}
//
//function addInstance(instance) {
//    if (instance.visible == false) return; //don't bother doing shit
//    drawingCommands = [];
//    //sort all instances so my shit is EFFICIENT (just remembered if i;m drawing transparent instances i need to draw farther ones first)
//    //actually since we'll do instancing i can't actually loop through instances (because how will i pass all their positions as an attribute)
//    //we need a separate drawing array
//    instances.push(instance);
//    const instancesPerMaterial = new Map();
//    //for(const instance of instances) {
//    //    let ref; 
//    //    if(!instancesPerMaterial.has(instance.material)) {
//    //        ref = {instances: []};
//    //    }else {
//    //        ref = instancesPerMaterial.get(instance.material);
//    //    }
//    //    ref.instances.push(instance);
//    //    instancesPerMaterial.set(instance.material, ref);
//    //}
//    //oh yeah i need to sort by materials and then instances
//    for (const instance of instances) {
//        // if(!instance.visible) continue;
//        let ref;
//        let ref2;
//        if (!instancesPerMaterial.has(instance._material)) {
//            ref = new Map();
//        } else {
//            ref = instancesPerMaterial.get(instance._material);
//        }
//        if (!ref.has(instance.model.id)) {
//            ref2 = [];
//        } else {
//            ref2 = ref.get(instance.model.id);
//        }
//        ref2.push(instance);
//        instancesPerMaterial.set(instance._material, ref2);
//    }
//    for (const material of instancesPerMaterial.keys()) {
//        const instancesUsing = instancesPerMaterial.get(material);
//        for (const arr of instancesUsing.values()) {
//            const model = arr[0].model;
//            const temp = new DrawCall;
//            temp.material = material;
//            temp.vertexCount = model.vertexCount;
//            temp.VAO = model.VAO;
//            temp.instances = [];
//            if (arr.length != 1 && material.instancedProgram == undefined) {
//                //well shit
//                material.createInstancedProgram();
//            }
//            for (const instance of arr) {
//                //for of ^ 3
//                temp.instances.push(instance);
//            }
//            drawingCommands.push(temp);
//        }
//    }
//}

function draw(t, camera) {
    debugger;
    for (const command of drawingCommands) {
        glPolyfill.bindVertexArray(gl, command.model.VAO);
        //if(command.instanceCount == 1) {
        //    gl.drawArrays(command.mode, 0, command.vertexCount);
        //}else {
        //    gl.drawArraysInstanced(command.mode, 0, command.vertexCount, command.instanceCount);
        //}
        if (command.instances.length == 1) {
            const instance = command.instances[0];
            if(!instance.visible) continue;
            gl.useProgram(command.material.program);
            if (instance.billboard) {
                instance.matrix = m4.lookAt(instance.position, instance.position + camera.forward, [0.0, 1.0, 0.0]);
            }
            gl.uniformMatrix4fv(command.material.uniformLocations["u_worldMatrix"], false, instance.matrix);
            gl.uniformMatrix4fv(command.material.uniformLocations["u_viewProjectionMatrix"], false, camera.matrix);
            gl.uniform4fv(command.material.uniformLocations["u_color"], instance._color);
            gl.drawArrays(command.material.mode, 0, command.model._vertices.length);
        } else {
            gl.useProgram(command.material.instancedProgram);

            gl.uniformMatrix4fv(command.material.instancedUniformLocations["u_viewProjectionMatrix"], false, camera.matrix);

            //let lastColor = command.instances[0].color;
            const colorAttrib = [];
            //somehow the fastest method was using TypedArray::set but not for colors! (we're talking about a 0.05 ms difference though... AYE, PERF IS PERF 😂😂😂)
            const matrixAttrib = new Float32Array(command.instances.length*16); //16 elements
            for (let i = 0; i < command.instances.length; i++) {
                const instance = command.instances[i];
                if(!instance.visible) continue;
                // matrixAttrib.push(...instance.matrix); //cringe...
                // according to jsbenchmark the spread operator is just slightly slower than looping through each element manually
                if (instance.billboard) {
                    instance.matrix = m4.lookAt(instance.position, instance.position + camera.forward, [0.0, 1.0, 0.0]);
                }
                if(command.perInstanceColor) {
                    /*for(const c of instance._color) {
                        colorAttrib.push(c);
                    }*/
                    //pushing all 4 at once is faster (but i thought pushing all at once for matrices was slow? (turns out i never tested this lol, pushing all at once for matrices was actually the third fastest, second was pushing 3 elements at a time, and first was TypedArray set))
                    colorAttrib.push(instance._color[0], instance._color[1], instance._color[2], instance._color[3]);
                }
                //faster than slice but not faster than pushing once and that's not faster than pushing 5 times (pushing 3+3+3+3+4)
                //for (const m of instance.matrix) {
                //    matrixAttrib.push(m);
                //}
                matrixAttrib.set(instance.matrix, i*16);
            }
            //material.pleaseSetInstancedAttribMatrixForMeJustInCaseItsAtADifferentPlaceButProbablyNotKTHXBAI(matrixAttrib);
            //lol we can do that in Material.compileDrawingCommands (well actually if we have two different instanced models using the same material it'd be wrong)
            //we'll enable these attributes though in Material.compileDrawingCommands (well actually we'll just enable them in the Model constructor!)
            
            gl.bindBuffer(gl.ARRAY_BUFFER, command.model.instancedMatrixBuffer);
            if(command.model.instancedMatrixBufferLen == matrixAttrib.length) {
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixAttrib);
            }else {
                command.model.instancedMatrixBufferLen = matrixAttrib.length;
                gl.bufferData(gl.ARRAY_BUFFER, matrixAttrib, gl.DYNAMIC_DRAW);
            }
            
            gl.bindBuffer(gl.ARRAY_BUFFER, command.model.instancedColorBuffer);
            if(colorAttrib.length == 0) {
                //gl.vertexAttrib4f(3, command.instances[0]._color[0], command.instances[0]._color[1], command.instances[0]._color[2], command.instances[0]._color[3]);
                //gl.vertexAttribDivisor(3, 1);
                //gl.enableVertexAttribArray(3);
                if(command.model.instancedColorBufferLen == 4) {
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(command.instances[0]._color)); //we can use bufferSubData >:]
                }else {
                    command.model.instancedColorBufferLen = 4;
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorAttrib), gl.DYNAMIC_DRAW);
                }
                glPolyfill.vertexAttribDivisor(3, command.instances.length); //in theory this will keep using the first color value specified for all instances since the divisor is the amount of instances
            }else {
                if(colorAttrib.length == command.model.instancedColorBufferLen) {
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(colorAttrib)); //we can use bufferSubData >:]
                }else {
                    command.model.instancedColorBufferLen = colorAttrib.length;
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorAttrib), gl.DYNAMIC_DRAW);
                }
            }
            
            //gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16*4, 0); //surely it remembers vertexAttribDivisor? (yes the VAO does remember that)
            //gl.vertexAttribPointer(4+1, 4, gl.FLOAT, false, 16*4, 0); //surely it remembers vertexAttribDivisor?
            //gl.vertexAttribPointer(4+2, 4, gl.FLOAT, false, 16*4, 0); //surely it remembers vertexAttribDivisor?
            //gl.vertexAttribPointer(4+3, 4, gl.FLOAT, false, 16*4, 0); //surely it remembers vertexAttribDivisor?
            //gl.enableVertexAttribArray(4);
            //gl.enableVertexAttribArray(4+1);
            //gl.enableVertexAttribArray(4+2);
            //gl.enableVertexAttribArray(4+3);

            gl.drawArraysInstanced(command.material.mode, 0, command.model._vertices.length, command.instances.length);

            glPolyfill.vertexAttribDivisor(3, 1); //reset ts just in case all the colors were the same and we did that divisor trick
        }
    }
}