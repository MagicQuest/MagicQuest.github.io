//attrib location 0 is a_position
//attrib location 1 is a_normal
//attrib location 2 is a_texCoord (texCoords could be three dimensional for models with multiple textures)
//optional
//instanced attrib location 3 is ai_color
//instanced attrib location 4,5,6,7 is ai_matrix
//texture array attrib location 8 is a_texId

//uniform locations
//u_worldMatrix*^1
//u_viewProjectionMatrix
//u_color*
//u_texture
//lighting extensions:
//  u_reverseLightDir
//  u_lightColor
//  u_lightPosition
//* only applies without instancing, replaced by ai_matrix and v_color
//[^1] previously u_localMatrix

//varying
//v_normal
//v_texCoord
//v_color*
//v_texId^1
//v_position^2
//* instanced only
//[^1] idk yet lol (ok yeah we're gonna do it lol)
//[^2] lit shaders only

//lowkey i was lazy and so if you name the gl context something other than gl this shit might throw an error lol

//instancing with different colors could start impacting the Big Perf (wait nevermind i was thinking about doing it per vertex and not per instance!)

//optionally, i could -- in compileDrawingCommands -- weed out the invisible objects and call compileDrawingCommands when ModelInstance.visible is set
//for further optimization i could sort drawing commands per shader so that i'd only have to change the program twice for a shader that has to use both regular and instanced programs (in this situation i'd have 4 models with one instance using the first, two instances using the second, one instance using the third, and two instances using the fourth model, causing four draw calls and possibly 4 program changes!)
//when switching to and from my white pixel texture, i could either bind the texture we want to use (to gl.TEXTURE0) or have the white pixel texture reside at gl.TEXTURE0 and have any other textures be bound at gl.TEXTURE1, updating the sampler unit with uniform1i (but then, when switching to the arbitrary texture, i'd still have to bind it)

//https://computergraphics.stackexchange.com/questions/37/what-is-the-cost-of-changing-state (explains why several small draw calls are bad)
//https://community.khronos.org/t/performance-question-switch-shaders-or-use-empty-texture/76304/6

//shader
//model
//material
//instance

//model holds count of textures, instances hold texture objects then, uhhhh, somehow i make that work (maybe instances hold ACTUAL material objects that hold the textures (and colors?))
//that boy said we don't do atlases for 3d. what do we do then? (google: using multiple textures in 3d)
//for textures, i could write another shader that handles multiple
//if you're going to use multiple textures the shader needs to know the amount, then it will generate a shader with that many uniform sampler2D s

//for a minecraft cube i could have each instance hold their own texIds so when drawing i update the model's buffer with bufferSubData
//then i could actually draw a grass and dirt block (but uhh... no instancing...)

//Example use: see enginetest.html
/*
debugger;
//...
Renderer.init(gl);
const defaultLitShader = new Shader(gl, false, false, false);
const cubeModel = new ModelHolder([
  //x    y     z
    1.0, -1.0, 1.0, // front
    -1.0, 1.0, 1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
]);
cubeModel.defaultShader = defaultLitShader;
const planeModel = new ModelHolder([
    1.0, 0.0, 1.0,
    -1.0, 0.0, -1.0,
    -1.0, 0.0, 1.0,
    -1.0, 0.0, -1.0,
    1.0, 0.0, 1.0,
    1.0, 0.0, -1.0,
]).singleUsePerShader(); //i promise
planeModel.defaultShader = defaultLitShader;

const cube1 = new ModelInstance(cubeModel);
const cube2 = new ModelInstance(cubeModel);
const plane = new ModelInstance(plane);

function animate(t) {
    draw(gl, t, camera);
    requestAnimationFrame(animate);
}
animate();
*/

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
        throw Error("Program link failed!");
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
    shader;
    model;
    instances;
    perInstanceColor;
}

//instances array could belong to a world to manage different scenes or something if i needed that lol
const instances = [];
let drawingCommands = [];

class Shader {
    // _wireframe; //idk if the material should handle wireframe...
    unlit;
    useCubemap;
    useTextureArray;
    usesMultipleTextures; // not the same as texture array as this will use more samplers in glsl
    maxTextures;
    program;
    uniformLocations = {};
    instancedProgram = undefined; //only created when needed
    instancedUniformLocations = {};
    mode;

    _customInstancedProgramCallback; // => [vertexShader, fragmentShader]

    //instancesPerModel = new Map();
    static instancesPerShader = new Map(); // {shader: {model: {instances: [instance, instance], position: i}}}
    static transparentInstancesPerShader = new Map(); // {[Shader] => {[Model] => {instances: [instance, instance], position: i}}}

    constructor(gl, unlit, useCubemap, useTextureArray, maxTextures = 1, customProgram = undefined, customInstancedProgramCallback = undefined) {
        this.mode = gl.TRIANGLES;
        this.unlit = unlit;
        this.useCubemap = useCubemap;
        this.useTextureArray = useTextureArray;
        this.maxTextures = maxTextures;
        this.usesMultipleTextures = maxTextures > 1;
        Shader.instancesPerShader.set(this, new Map());
        Shader.transparentInstancesPerShader.set(this, new Map());
        if(customProgram) {
            this.program = customProgram;
        }else {
            //this.program = ...; //create program based on properties
            throw Error("Unfinished");
        }
        this._customInstancedProgramCallback = customInstancedProgramCallback;
        this.uniformLocations["u_worldMatrix"] = gl.getUniformLocation(this.program, "u_worldMatrix");
        if(this.uniformLocations["u_worldMatrix"] == null) {
            console.warn("u_worldMatrix was not found in this shader's program!");
        }
        this.uniformLocations["u_viewProjectionMatrix"] = gl.getUniformLocation(this.program, "u_viewProjectionMatrix");
        if(this.uniformLocations["u_viewProjectionMatrix"] == null) {
            console.warn("u_viewProjectionMatrix was not found in this shader's program!");
        }
        this.uniformLocations["u_color"] = gl.getUniformLocation(this.program, "u_color");
        if(this.uniformLocations["u_color"] == null) {
            console.warn("u_color was not found in this shader's program!");
        }
        this.uniformLocations["u_texture"] = gl.getUniformLocation(this.program, "u_texture");
        if(this.uniformLocations["u_texture"] == null) {
            console.warn("u_texture was not found in this shader's program!");
        }
        if(this.usesMultipleTextures) {
            for(let i = 1; i < this.maxTextures; i++) {
                this.uniformLocations["u_texture" + i] = gl.getUniformLocation(this.program, "u_texture" + i);
                if(this.uniformLocations["u_texture" + i] == null) {
                    console.warn("u_texture"+i+" was not found in this shader's program!");
                }
            }
        }
        if(!this.unlit) {
            //... (should i do point lights or direction or should i do both and how do i do multiple point lights?)
        }
    }

    static custom(gl, program, maxTextureCount, customInstancedProgramCallback) {
        return new Shader(gl, undefined, undefined, undefined, maxTextureCount, program, customInstancedProgramCallback);
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
                instancesPerModel = Shader.transparentInstancesPerShader.get(this);
            //}
        }else {
            //if (!Material.instancesPerMaterial.has(this)) {
            //    instancesPerModel = new Map();
            //} else {
                instancesPerModel = Shader.instancesPerShader.get(this);
            //}
        }
        let metadata;
        if (!instancesPerModel.has(instance.model)) {
            metadata = {instances: [], position: undefined, perTexture: new Map()}; //uhh metadata could also be the same kind of map as perTexture lol (actually having like this makes it easier to check if any instances have textures that use this uhhh shader)
            //oops, forgot to set it in instancesPerModel lol! we can do this right now since we'll have a reference to metadata
            instancesPerModel.set(instance.model, metadata); //+1
        }else {
            metadata = instancesPerModel.get(instance.model);
        }
        if(instance._textures.length) {
            let parent = metadata;
            for(const texture of instance._textures) {
                if(!parent.perTexture.has(texture)) {
                    //const temp = new Map();
                    //temp.set("instances", []);
                    //temp.set("position", undefined); //uhh metadata could also be the same kind of map as perTexture lol (actually having like this makes it easier to check if any instances have textures that use this uhhh shader)
                    //parent.set(texture, temp);
                    
                    const temp = {instances: [], position: undefined, perTexture: new Map()};
                    parent.perTexture.set(texture, temp);

                    parent = temp;
                }else {
                    parent = parent.perTexture.get(texture);
                }
            }
            //parent.get("instances").push(instance);
            parent.instances.push(instance);
        }else {
            metadata.instances.push(instance);
        }
    }

    subRef(instance) {
        let instancesPerModel;
        if(instance._color[3] != 1.0) {
            //transparent!
            instancesPerModel = Shader.transparentInstancesPerShader.get(this);
        }else {
            instancesPerModel = Shader.instancesPerShader.get(this);
        }
        const metadata = instancesPerModel.get(instance.model);
        //uhhh, i assume it'll be the same as it was when we added it? (so if it had a texture when it was added it'll still have it when we remove it (for looking it up in our map purposes of course))
        if(instance._textures.length) {
            //we gotta traverse the tree
            let ourTextureMap = metadata;
            let parents = [];
            for(const texture of instance._textures) { // [texture1, texture2], parents = [metadata, {instances: [], position: ..., perTexture: {...}}]
                parents.push(ourTextureMap);
                ourTextureMap = ourTextureMap.perTexture.get(texture);
            }
            if(ourTextureMap.instances.length == 1) {
                //do a lot of work to figure out if this was the last instance in this whole tree...
                //let total = 0;
                //for(const textureMaps of metadata.perTexture.values()) {
                //    if(textureMaps.get())
                //}
                if(ourTextureMap.perTexture.size == 0) { // if our perTexture map has keys let's assume i wrote this part correctly and they still have instances there otherwise see the inside of the if statement
                    // parents.at(-1).perTexture.delete(instance._textures.at(-1)); //the last parent has the perTexture map we're inside! we're deleting this texture key

                    //ok now do work to check if this entire branch can be deleted
                    for(let i = instance._textures.length-1; i >= 0; i--) {
                        
                    }
                }
            }else {
                let index;
                if((index = ourTextureMap.instances.findIndex(v=>v==instance)) == -1) throw Error("big boy error");
                ourTextureMap.instances.splice(index, 1);
            }
        }else {
            if(metadata.instances.length == 1 && metadata.perTexture.size == 0) {
                instancesPerModel.delete(instance.model);
            }else {
                let index;
                if((index = metadata.instances.findIndex(v=>v==instance)) == -1) throw Error("big boy error");
                metadata.instances.splice(index, 1);
            }
        }
        //we don't have to set it again because it's a reference :)
    }

    static generateDrawCommandsPerTexture(shader, metadata) {
        // for(const [texture, submetadata] of metadata.perTexture.entries()) {
        for(const submetadata of metadata.perTexture.values()) {
            //for each texture combination unfortunately we'll have to make separate drawing commands!
            if(submetadata.instances.length) {
                const tempcommand2 = new DrawCall;
                tempcommand2.shader = shader;
                tempcommand2.model = submetadata.instances[0].model; //lol
                tempcommand2.instances = submetadata.instances;
                // tempcommand2.perInstanceColor = // o fuk. (it was at this moment)
                tempcommand2.perInstanceColor = false;

                if(tempcommand2.instances.length > 1) {
                    let firstColor = tempcommand2.instances[0]._color;

                    instanceLoop: //apparently you can only reference a label within the scope of the labeled statement (so i can have two labels named instanceLoop in the same file)
                    for(const instance of tempcommand2.instances) {
                        for(let i = 0; i < instance._color.length; i++) {
                            const c = instance._color[i];
                            if(c != firstColor[i]) {
                                tempcommand2.perInstanceColor = true;
                                break instanceLoop;
                            }
                        }
                    }
                }

                submetadata.position = drawingCommands.push(tempcommand2)-1; //ok bro
            }

            if(submetadata.perTexture.size) {
                Shader.generateDrawCommandsPerTexture(shader, submetadata);
            }
        }
    }

    //call this function to translate the instance per material maps into "drawing commands"
    //typically called when an object's material changes
    static compileDrawingCommands() {
        drawingCommands = [];

        for (const shader of Shader.instancesPerShader.keys()) {
            const instancesUsing = Shader.instancesPerShader.get(shader);
            for (const metadata of instancesUsing.values()) {
                if(metadata.instances.length) { // we could have no instances here because they could all have textures
                    const arr = metadata.instances;
                    const model = arr[0].model;
                    const temp = new DrawCall;
                    temp.shader = shader;
                    temp.model = model;
                    temp.instances = [];
                    temp.perInstanceColor = false;
                    //let texturedInstances = []; // we can't instance objects with different textures so we'll put them in here and sort them (and see if we can instance the textured ones together)
                    //const uniqueTextureCombinations = new Map(); //{Texture => {Texture => {...}, "instances" => []}} (what a complicated map...)
                    let firstColor = arr[0]._color;
                    if (arr.length > 1) {
                        if(shader.instancedProgram == undefined) {
                            //well shit
                            shader.createInstancedProgram();
                        }
                        for (const instance of arr) {
                            //for of ^ 3
                            //if(instance._textures.length != 0) { //oh boy
                            //    let parent = uniqueTextureCombinations;
                            //    for(const texture of instance._textures) {
                            //        if(!parent.has(texture)) {
                            //            const temp = new Map();
                            //            temp.set("instances", []);
                            //            parent.set(texture, temp);
                            //
                            //            parent = temp;
                            //        }else {
                            //            parent = parent.get(texture);
                            //        }
                            //    }
                            //    parent.get("instances").push(instance); //at the end of the tree put this instance into the list ;)
                            //}else {
                                //FUCK we'll have to calculate perInstanceColor separately for textured objects!!
                                //Shader.calculatePerInstanceColorSoIDontHaveToRewriteTheSameThing(temp);
                                if(!temp.perInstanceColor) {
                                    for(let i = 0; i < instance._color.length; i++) {
                                        const c = instance._color[i];
                                        if(c != firstColor[i]) {
                                            temp.perInstanceColor = true;
                                            break;
                                        }
                                    }
                                }
                                temp.instances.push(instance);
                            //}
                        }
                        //well now we have to process the texture combinations
                        // if(model.textureCount) {
                        // for(const [texture, map] of uniqueTextureCombinations.entries()) {
                        // Shader.generateDrawCommandsPerTexture(metadata);
                        // }
                        // }
                    }else { //if length is 1 don't bother checking color just add it straight to the instances list
                        temp.instances.push(arr[0]);
                    }
                    metadata.position = drawingCommands.push(temp)-1; //ok bro
                }

                if(metadata.perTexture.size) {
                    Shader.generateDrawCommandsPerTexture(shader, metadata);
                }
            }
        }

        let tempdrawingcommands = drawingCommands;
        drawingCommands = []; //lol i didn't really have to do this but since drawingCommands is global i'd have to refactor generateDrawCommandsPerTexture

        //ok here's the part where i try to minimize program state changes by sorting them
        //for each Shader we could hit a max of 2 program changes by sorting the individual objects to come before the instanced ones (or vice versa)
        const shaderSortMap = new Map();
        for(const command of tempdrawingcommands) {
            if(!shaderSortMap.has(command.shader)) {
                shaderSortMap.set(command.shader, []);
            }
            shaderSortMap.get(command.shader).push(command);
        }
        for(const callsPerShader of shaderSortMap.values()) {
            callsPerShader.sort((a, b) => a.instances.length-b.instances.length); // commands that have only one instance use the normal program and commands with more use the instanced program. by sorting it this way, we can make sure we only change programs twice for all objects using this shader!
            for(const call of callsPerShader) {
                drawingCommands.push(call); //i would slice here but for of is faster by like 0.005 ms or something (micro optimization god)
            }
        }
    }

    //couldn't i do this in subref and addref
    checkColorForInstancingOptimization(instance) {
        let metadata;
        if(instance._color[3] != 1.0) {
            //transparent!
            metadata = Shader.transparentInstancesPerShader.get(this).get(instance.model);
        }else {
            metadata = Shader.instancesPerShader.get(this).get(instance.model);
        }
        if(instance._textures.length) {
            //we gotta traverse the tree
            for(const texture of instance._textures) { // [texture1, texture2], parents = [metadata, {instances: [], position: ..., perTexture: {...}}]
                metadata = metadata.perTexture.get(texture);
            }
        }
        const drawcall = drawingCommands[metadata.position]; //reference
        drawcall.perInstanceColor = false;
        if(metadata.instances.length != 1) { //actually bother doing the loop
            let firstColor = metadata.instances[0]._color;
            instanceLoop: //probably the third ever time i've used a label in javascript (cool)
            for(const instance of metadata.instances) {
                for(let i = 0; i < instance._color.length; i++) {
                    const c = instance._color[i];
                    if(c != firstColor[i]) {
                        drawcall.perInstanceColor = true;
                        break instanceLoop;
                    }
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
        console.warn("creating instanced program! if this is a custom shader and one has not been specified through customInstancedProgramCallback this function may fail!");
        if(this._customInstancedProgramCallback) {
            const result = this._customInstancedProgramCallback();
            if(!(result instanceof Array)) {
                throw Error("customInstancedProgramCallback didn't return an Array!");
            }
            this.instancedProgram = createProgramSimple(result[0], result[1]);
        }else {
            //lookup a vertex+fragment shader combo that has instanced attributes for the matrix, etc.
            //...
            throw Error("Unfinished");
        }
        this.instancedUniformLocations["u_viewProjectionMatrix"] = gl.getUniformLocation(this.instancedProgram, "u_viewProjectionMatrix");
        if(this.instancedUniformLocations["u_viewProjectionMatrix"] == null) {
            console.warn("u_viewProjectionMatrix was not found in this shader's instanced program!");
        }
        this.instancedUniformLocations["u_texture"] = gl.getUniformLocation(this.instancedProgram, "u_texture");
        if(this.instancedUniformLocations["u_texture"] == null) {
            console.warn("u_texture was not found in this shader's instanced program!");
        }
    }

    destroy() {
        gl.deleteProgram(this.program);
        if (this.instancedProgram) {
            gl.deleteProgram(this.instancedProgram);
        }
        //if (Shader.instancesPerShader.has(this)) { // this will always be true because i set it in the constructor lol
            const moogcity2 = Shader.instancesPerShader.get(this); //{Model => {metadata}}
            if(moogcity2.size) {
                console.warn("Shader destroyed yet there are instances that use it!", moogcity2);
            }
            Shader.instancesPerShader.delete(this);
        //}
        //if (Shader.transparentInstancesPerShader.has(this)) { // this will always be true because i set it in the constructor lol
            const whatcourtemancheseffortsoundslike = Shader.transparentInstancesPerShader.get(this);
            if(whatcourtemancheseffortsoundslike.size) {
                console.warn("Shader destroyed yet there are (transparent) instances that use it!", whatcourtemancheseffortsoundslike);
            }
            Shader.transparentInstancesPerShader.delete(this);
        //}
    }
}

//i gotta rename to ModelHolder since glwrapperex.js already has a Model class (yet should it actually be called Model in glwrapperex?)
class ModelHolder {
    //_billboard; (maybe this should be in ModelInstance)
    VAO;

    _vertices;
    _normals;
    _texCoords; //optional

    vertexBuffer;
    normalBuffer;
    texCoordBuffer; //optional
    texIdBuffer; //optional, for texture array shaders
    customBuffers = {}; //for whatever else you need...

    instancedColorBuffer; //optional but unless you promise to only use this object once (singleUsePerShader), it'll be created
    instancedColorBufferLen; //for sub optimization
    instancedMatrixBuffer; //optional but unless you promise to only use this object once (singleUsePerShader), it'll be created
    instancedMatrixBufferLen; //for bufferSubData optimization

    //vertexCount;

    wireframe;

    _defaultShader;

    _textureCount;

    //id;

    //instances; //instances sorted by material, we'll use actual instancing if there's more than one for the same material (but then i'd have to use a different shader)

    //pass an empty array for normals if they're not needed (using an unlit shader)
    constructor(vertices, normals = undefined, texCoords = undefined, texIds = undefined, textureCount = 0, singleUse = false) {
        if (vertices.length % 9 != 0) throw Error("Model::Model can only use triangulated vertices! Use wireframe for gl.LINES, otherwise fuck you!");
        if (!normals) {
            normals = Model.calculateNormals(vertices);
        }
        this._vertices = vertices;
        this._normals = normals;
        this._texCoords = texCoords;

        this.VAO = glPolyfill.createVertexArray(gl);
        glPolyfill.bindVertexArray(gl, this.VAO);

        //apparently i actually should interleave my data for better memory cache efficiency or whatever

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); //a_position
        gl.enableVertexAttribArray(0); //a_position

        if(normals.length) {
            this.normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0); //a_normal
            gl.enableVertexAttribArray(1); //a_normal
        }else {
            console.warn("Creating model with no normal data, you are probably using an unlit shader for this one.");
        }

        if (texCoords) {
            this.texCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0); //a_texCoord
            gl.enableVertexAttribArray(2); //a_texCoord
        }else {
            //0.5 to sample in the middle of the texture (the 1x1 white pixel)
            gl.vertexAttrib2f(2, 0.5, 0.5); //a_texCoord
            //huh apparently you don't enable the attrib if you're not using vertexAttribPointer
            // gl.enableVertexAttribArray(2); //a_texCoord
        }

        if(texIds) {
            this.texIdBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texIdBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texIds), gl.STATIC_DRAW);
            gl.vertexAttribPointer(8, 1, gl.FLOAT, false, 0, 0); //a_texId
            gl.enableVertexAttribArray(8); //a_texId
        }else {
            gl.vertexAttrib1f(8, 0);
        }

        if(!singleUse) {
            this.instancedColorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.instancedColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 1.0, 1.0, 1.0]), gl.DYNAMIC_DRAW);
            this.instancedColorBufferLen = 4;
            // gl.vertexAttrib4f(3, 1.0, 1.0, 1.0, 1.0); //ai_color
            gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
            glPolyfill.vertexAttribDivisor(gl, 3, 1); 
            gl.enableVertexAttribArray(3); //ai_color

            this.instancedMatrixBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.instancedMatrixBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, m4.identity(), gl.DYNAMIC_DRAW);
            this.instancedMatrixBufferLen = 16;
            //gl.vertexAttrib4f(4, 1.0, 0.0, 0.0, 0.0); //ai_matrix
            //gl.vertexAttrib4f(4+1, 0.0, 1.0, 0.0, 0.0); //ai_matrix
            //gl.vertexAttrib4f(4+2, 0.0, 0.0, 1.0, 0.0); //ai_matrix
            //gl.vertexAttrib4f(4+3, 0.0, 0.0, 0.0, 0.0); //ai_matrix
            gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16*4, 0); //aw fuck my offsets were wrong
            gl.vertexAttribPointer(4+1, 4, gl.FLOAT, false, 16*4, 16);
            gl.vertexAttribPointer(4+2, 4, gl.FLOAT, false, 16*4, 32);
            gl.vertexAttribPointer(4+3, 4, gl.FLOAT, false, 16*4, 48);
            glPolyfill.vertexAttribDivisor(gl, 4, 1);
            glPolyfill.vertexAttribDivisor(gl, 4+1, 1);
            glPolyfill.vertexAttribDivisor(gl, 4+2, 1);
            glPolyfill.vertexAttribDivisor(gl, 4+3, 1);
            gl.enableVertexAttribArray(4); //ai_matrix
            gl.enableVertexAttribArray(4+1); //ai_matrix+1
            gl.enableVertexAttribArray(4+2); //ai_matrix+2
            gl.enableVertexAttribArray(4+3); //ai_matrix+3
        }

        this._textureCount = textureCount;

        //this.vertexCount = vertices.length;

        //this.id = Math.floor(Math.random() * 1000000);
    }

    //adds a new buffer object to this.customBuffers with the property being the specified name
    customBuffer(name, attribLocation, size, data, usage) {
        glPolyfill.bindVertexArray(gl, this.VAO);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), usage);
        gl.vertexAttribPointer(attribLocation, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocation);

        this.customBuffers[name] = buffer;
    }

    //iPromiseNotToUseThisModelMoreThanOnceWithTheSameShader
    //this is inherited by wireframeCopy!
    singleUsePerShader() {
        glPolyfill.bindVertexArray(gl, this.VAO);

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

    textureCount(n) {
        this.textureCount = n;
        return this;
    }

    set defaultShader(newValue) {
        if(newValue instanceof Shader) {
            if(this._textureCount > 1 && newValue.usesMultipleTextures == false) {
                throw Error("ModelHolder's default shader was set to one that doesn't use multiple textures (this model needs them)!");
            }
            if(this.texIdBuffer && newValue.useTextureArray == false) {
                throw Error("ModelHolder's default shader was set to one that doesn't use texture arrays, yet this model has a texId buffer!");
            }
        }else if(newValue != undefined) {
            //catastrophic failure man, go back
            alert("Goodbye cruel world!");
            window.history.back();
        }
        this._defaultShader = newValue;
    }

    /*Model*/ wireframeCopy() {
        console.warn("lowkey i didn't make wireframeCopy copy the texIds");
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

class TransformableObject {
    _position;
    _rotation;
    _scale;

    _matrix;

    constructor(position = [0.0, 0.0, 0.0], rotation = [0.0, 0.0, 0.0], scale = [1.0, 1.0, 1.0]) {
        this._position = position;
        this._rotation = rotation;
        this._scale = scale;
        this._matrix = new Float32Array(16); //preallocating for le compose func
        this.compose();
    }

    position(x, y, z) {
        this._position = [x, y, z];
        this.compose();
    }
    //probably would be wise to use quaternions but FAWK that
    //in degrees
    rotation(pitch, yaw, roll) {
        this._rotation = [pitch, yaw, roll];
        this.compose();
    }
    scale(x, y, z) {
        this._scale = [x, y, z];
        this.compose();
    }
    scaleBy(scalar) {
        this._scale = [this._scale[0]*scalar, this._scale[1]*scalar, this._scale[2]*scalar];
        this.compose();
    }
    compose() /*const*/ {
        //m4.translation(this._position[0], this._position[1], this._position[2], this._matrix);
        const pitch = this._rotation[0]*Math.PI/180;
        const yaw = this._rotation[1]*Math.PI/180 /*+*/ - Math.PI/2; //lol, default direction is facing positive x but it should be positive z! (uh that's weird why when it faces towards the camera does it point the wrong direction?)
        const roll = this._rotation[2]*Math.PI/180;
        const forward = [
            Math.cos(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            Math.sin(yaw) * Math.cos(pitch),
        ];
        const zdirection = [
            -Math.sin(roll), 
            Math.cos(roll),
            0.0,
        ];
        m4.lookAt(this._position, m4.addVectors(this._position, forward), zdirection, this._matrix); //uhh we'll use this fake up vector and see what happens
        m4.scale(this._matrix, this._scale[0], this._scale[1], this._scale[2], this._matrix);
        return this._matrix;
    }
}

//probably not gonna be called that
//ueah maybe i'll call it Actor but that's a little too unreal engine so maybe GameObject (but that's too unity)!

class ModelInstance extends TransformableObject {
    //_position = [0.0, 0.0, 0.0];
    //_matrix = m4.identity();
    _color = new Float32Array([1.0, 1.0, 1.0, 1.0]);
    _textures = [];
    _shader;
    billboard = false;
    visible = true;
    model;
    constructor(model, position, rotation, scale) {
        super(position, rotation, scale);
        this.model = model;
        this.shader = model._defaultShader;
        instances.push(this);
    }
    set shader(newValue) {
        //yeah i was having a laugh, passing undefined would trigger this!
        //if (!(newValue instanceof Shader)) {
        //    //catastrophic failure man, go back
        //    alert("Goodbye cruel world!");
        //    window.history.back();
        //}
        if (this._shader) {
            this._shader.subRef(this);
        }
        if(newValue instanceof Shader) {
            newValue.addRef(this);
        }else if(newValue != undefined) { //ahhh that's more like it
            //catastrophic failure man, go back
            alert("Goodbye cruel world!");
            window.history.back();
        }
        this._shader = newValue;
        Shader.compileDrawingCommands();
        //make sure this is a valid configuration
    }
    //setPosition(x, y, z) {
    //    this._position = [x, y, z];
    //    m4.translation(x, y, z, this._matrix);
    //}
    addTexture(glTextureObject) {
        this._shader.subRef(this); //calling subRef then changing the texture so it's sorted for compileDrawingCommands
        if(this.model._textureCount < this._textures.push(glTextureObject)) { //WRITE DUMB CODE
            console.warn(`adding texture to instance (now ${this._textures.length} texture${this._textures.length==1?'':'s'}) but current model only has ${this.model._textureCount}`);
        }
        this._shader.addRef(this);

        Shader.compileDrawingCommands(); //probably don't have to compile the whole thing here lol but if i wanted to sort to optimize texture state changes then yeag maybe
    }
    setTexture(index, glTextureObject) {
        this._shader.subRef(this); //calling subRef then changing the texture so it's sorted for compileDrawingCommands
        this._textures[index] = glTextureObject;
        if(this.model._textureCount < this._textures.length) {
            console.warn(`instance texture count exceeds model texture count!`);
        }
        this._shader.addRef(this);

        Shader.compileDrawingCommands();
    }
    color(r, g, b, a = 1.0) {
        const oldalpha = this._color[3];
        let dobother = false;
        if (oldalpha != a) {
            debugger; //lowkey was writing bullshit
            dobother = oldalpha == 1.0 || (oldalpha != 1.0 && a == 1.0);
            if(dobother) {
                this._shader.subRef(this);
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
            this._shader.addRef(this);
        }
        this._shader.checkColorForInstancingOptimization(this);
    }
    destroy() {
        this.model = undefined;
        this.shader = undefined; //by setting our shader to undefined we have the setter update our status to the shader thereby
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

//moved to Material*
//* and then that was renamed to Shader
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

class Renderer {
    static whitePixelTexture = undefined;

    static init(gl) {
        Renderer.whitePixelTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.whitePixelTexture);
        //i forgot the part that made it white
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    static draw(gl, t, camera, printDebugInfo = false) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(1.0, 0.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.cullFace(gl.BACK); // yeah yeah i know you don't have to call this lol
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.whitePixelTexture); //making sure our white pixel texture is always at gl.TEXTURE0

        const view = m4.inverse(camera.matrix);
        const viewProjectionMatrix = m4.multiply(m4.perspective(60*Math.PI/180, gl.canvas.width/gl.canvas.height, 1, 2000), view);
        let programSwitches = 0;
        let lastProgram = undefined; //apparently gl.getParameter (with it's actual gl function being glGetIntegerv) might be slightly slow so we'll just record the last program here lol
        //if it's that serious we could write the last active texture unit (the u_texture uniform1i value) for each program
        //debugger;
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
                //if(command.shader.usesMultipleTextures) throw Error("Unfinished");
                //if(command.textureCount > 1 || command.shader.useTextureArray) throw Error("Unfinished!");
                if(lastProgram != command.shader.program) {
                    gl.useProgram(command.shader.program);
                    lastProgram = command.shader.program;
                    programSwitches++;
                }
                if (instance.billboard) {
                    //maybe don't modify the matrix directly lol
                    instance._matrix = m4.lookAt(instance._position, m4.addVectors(instance._position, camera.forward), [0.0, 1.0, 0.0]);
                    m4.scale(instance._matrix, instance._scale[0], instance._scale[1], instance._scale[2], instance._matrix);
                }
                if(command.shader.usesMultipleTextures) {
                    for(let i = 0; i < command.model._textureCount; i++) {
                        const loc = command.shader.uniformLocations[`u_texture${i == 0 ? "" : i}`];
                        if(instance._textures[i] != undefined) {
                            gl.uniform1i(loc, 1);
                            gl.activeTexture(gl.TEXTURE1 + i);
                            gl.bindTexture(gl.TEXTURE_2D, instance._textures[i]);
                        }else {
                            gl.uniform1i(loc, 0);
                        }
                    }
                }else {
                    if(instance._textures[0] != undefined) {
                        gl.uniform1i(command.shader.uniformLocations["u_texture"], 1);
                        gl.activeTexture(gl.TEXTURE1);
                        if(command.shader.useTextureArray) {
                            gl.bindTexture(gl.TEXTURE_2D_ARRAY, instance._textures[0]);
                        }else {
                            gl.bindTexture(gl.TEXTURE_2D, instance._textures[0]);
                        }
                    }else {
                        gl.uniform1i(command.shader.uniformLocations["u_texture"], 0); //not saving the last set state because it's per program only! i could store data on our shader object though!
                    }
                }
                gl.uniformMatrix4fv(command.shader.uniformLocations["u_worldMatrix"], false, instance._matrix);
                gl.uniformMatrix4fv(command.shader.uniformLocations["u_viewProjectionMatrix"], false, viewProjectionMatrix); //oh if we've already seen this shader we won't have to set this again
                gl.uniform4fv(command.shader.uniformLocations["u_color"], instance._color);
                gl.drawArrays(command.shader.mode, 0, command.model._vertices.length);
            } else {
                //if(command.textureCount > 1 || command.shader.useTextureArray) throw Error("Unfinished!");
                if(lastProgram != command.shader.instancedProgram) {
                    gl.useProgram(command.shader.instancedProgram);
                    lastProgram = command.shader.instancedProgram;
                    programSwitches++;
                }

                gl.uniformMatrix4fv(command.shader.instancedUniformLocations["u_viewProjectionMatrix"], false, viewProjectionMatrix);

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
                        instance._matrix = m4.lookAt(instance._position, m4.addVectors(instance._position, camera.forward), [0.0, 1.0, 0.0]);
                        //uh, apply the scale lol
                        m4.scale(instance._matrix, instance._scale[0], instance._scale[1], instance._scale[2], instance._matrix);
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
                    matrixAttrib.set(instance._matrix, i*16);
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
                        gl.bufferSubData(gl.ARRAY_BUFFER, 0, command.instances[0]._color); //we can use bufferSubData >:]
                    }else {
                        command.model.instancedColorBufferLen = 4;
                        gl.bufferData(gl.ARRAY_BUFFER, command.instances[0]._color, gl.DYNAMIC_DRAW);
                    }
                    glPolyfill.vertexAttribDivisor(gl, 3, command.instances.length); //in theory this will keep using the first color value specified for all instances since the divisor is the amount of instances
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

                const firstInstance = command.instances[0];
                if(command.shader.usesMultipleTextures) {
                    for(let i = 0; i < command.model._textureCount; i++) {
                        const loc = command.shader.instancedUniformLocations[`u_texture${i == 0 ? "" : i}`];
                        if(firstInstance._textures[i] != undefined) {
                            gl.uniform1i(loc, 1);
                            gl.activeTexture(gl.TEXTURE1 + i);
                            gl.bindTexture(gl.TEXTURE_2D, firstInstance._textures[i]);
                        }else {
                            gl.uniform1i(loc, 0);
                        }
                    }
                }else {
                    if(firstInstance._textures[0] != undefined) {
                        gl.uniform1i(command.shader.instancedUniformLocations["u_texture"], 1);
                        gl.activeTexture(gl.TEXTURE1);
                        if(command.shader.useTextureArray) {
                            gl.bindTexture(gl.TEXTURE_2D_ARRAY, firstInstance._textures[0]); //we can rest assured this will be the same texture for every instance because addRef and compileDrawingCommands makes sure of that :)
                        }else {
                            gl.bindTexture(gl.TEXTURE_2D, firstInstance._textures[0]);
                        }
                    }else {
                        gl.uniform1i(command.shader.instancedUniformLocations["u_texture"], 0); //not saving the last set state because it's per program only! i could store data on our shader object though!
                    }
                }

                glPolyfill.drawArraysInstanced(gl, command.shader.mode, 0, command.model._vertices.length, command.instances.length);

                glPolyfill.vertexAttribDivisor(gl, 3, 1); //reset ts just in case all the colors were the same and we did that divisor trick
            }
        }

        if(printDebugInfo) {
            console.log(`Renderer reports: ${programSwitches} program switches, ${drawingCommands.length} draw calls!`);
        }
    }

    static destroy() {
        gl.deleteTexture(Renderer.whitePixelTexture);
    }
}