//Problem: webgl is not explicit enough which allows for mistakes
//https://stackoverflow.com/a/35514204 (see also https://stackoverflow.com/questions/28604747/understanding-webgl-state)
//good pipeline description: https://www.lighthouse3d.com/tutorials/glsl-12-tutorial/pipeline-overview/
//another pipeline descritption: https://learnopengl.com/Getting-started/Hello-Triangle
//instancing: https://youtu.be/Ude1zZbf20s?t=442

function showError(message) {
	if(globalThis["document"]) {
		document.write(message);
	}else {
		print(message); //jbs3
	}
}

function createProgram(vertex, fragment) {
    let fshader = null;
    let program = null;
    const vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, vertex);
    gl.compileShader(vshader);
    if(!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
        // displayError(gl.getShaderInfoLog(vshader));
        showError(gl.getShaderInfoLog(vshader));
        gl.deleteShader(vshader);
        return {vshader, fshader, program};
    }

    fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, fragment);
    gl.compileShader(fshader);
    if(!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
        // displayError(gl.getShaderInfoLog(fshader));
        showError(gl.getShaderInfoLog(fshader));
        gl.deleteShader(vshader);
        gl.deleteShader(fshader);
        return {vshader, fshader, program};
    }

    program = gl.createProgram();
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        // displayError(gl.getProgramInfoLog(program));
        showError(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        gl.deleteShader(vshader);
        gl.deleteShader(fshader);
        return {vshader, fshader, program};
    }

    return {vshader, fshader, program};
}

class Model {
	//each function returns {vertices, indices, suggested_type}
	static loadObj(gl, text) {
		const lines = text.split("\n");
		let vertices = [];
		const indices = [];
		const normals = [];
		const texcoords = [];
		const tempfornormals = [];
		const tempfortexcoords = [];
		//https://www.scratchapixel.com/lessons/3d-basic-rendering/obj-file-format/obj-file-format.html
		//https://www.martinreddy.net/gfx/3d/OBJ.spec
		//https://paulbourke.net/dataformats/obj/
		for(const line of lines) {
			let type = "";
			let args = [];
			let temp = "";
			//let currentArg = "";
			for(const char of line) {
				if(char == "#") {
					break;
				}
				if(char == " ") {
					if(type == "") {
						type = temp;
					}else if(temp != "") {
						args.push(temp);
					}
					temp = "";
				}
				temp += char.trim();
				/*if(type == "") {
					type = char.trim();
				}else {
					if(char == " " && currentArg != "") {
						args.push(currentArg);
						currentArg = "";
					}else if(char.trim() == char) { //add it as long as it's not whitespace lol
						currentArg += char;
					}
				}*/
			}
			if(temp != "") {
				args.push(temp);
			}
			if(type != "") {
				//console.log(type, args);
				switch(type) {
					case "v":
						vertices.push(Number(args[0]));
						vertices.push(Number(args[1]));
						vertices.push(Number(args[2]));
						break;
					case "vn":
						tempfornormals.push([Number(args[0]), Number(args[1]), Number(args[2])]);
						break;
					case "vt":
						tempfortexcoords.push([Number(args[0]), Number(args[1])]);
						break;
					case "f":
						for(const arg of args) {
							//if(arg) == 21;
							//const v = Number(arg);
							let v, t, n;
							let slash = arg.indexOf("/");
							if(slash != -1) {
								//debugger;
								v = Number(arg.slice(0, slash));
								t = Number(arg.slice(slash+1, slash=arg.indexOf("/", slash+1)));
								n = Number(arg.slice(slash+1));
							}else {
								v = Number(arg);
							}
							if(v<0) {
								alert("obj faces using relative negative!");
								debugger;
							}
							indices.push(v-1); //indices are 1 indexed!
							if(t) {
								debugger;
								texcoords.push(...tempfortexcoords[t-1]);
							}
							if(n) {
								normals.push(...tempfornormals[n-1]);
							}
						}
						break;
				}
			}
		}
		let suggested_type;
		if(normals.length || texcoords.length) {
			//ouhhh we can't do no uhhhh indices buddy
			const temp = [];
			for(const index of indices) {
				let i = index*3;
				temp.push(vertices[i], vertices[i+1], vertices[i+2]);
			}
			vertices = temp;
			indices.length = 0; //clear the array (apparently)
		}else {
			const vertLen = vertices.length/3;
			console.log(vertLen);
			suggested_type = gl.UNSIGNED_BYTE;
			if(vertLen > 65535) {
				//alert("too many vertices, we should switch to Int32Array if we have OES_element_index_uint!");
				console.warn("too many vertices, we should switch to Int32Array if we have OES_element_index_uint!");
				suggested_type = gl.UNSIGNED_INT;
				debugger;
			}else if(vertLen > 255) {
				suggested_type = gl.UNSIGNED_SHORT;
			}
		}
		console.log(vertices, indices);
		return {vertices, indices, normals, texcoords, suggested_type};
	}
}

class IHasBinding {
    gl;
    constructor(gl) {
        this.gl = gl;
    }
    makeCurrent() {}; // = 0;
}

class TextureBinding extends IHasBinding {
	unit;
	target;
	texture;
	constructor(gl, unit, target, texture) {
		super(gl);
		this.unit = unit;
		this.target = target;
		this.texture = texture;
	}
	makeCurrent() {
		if(this.target in glTexture.textureMap) {
			const obj = glTexture.textureMap[this.target].get(this.texture);
			if(obj) {
				obj.makeCurrent();
				return;
			}
		}
		this.gl.activeTexture(this.unit);
		this.gl.bindTexture(this.target, this.texture);
	}
}

class GL {
	static textureBindings = {};
	static framebufferBindings = [];
	static programs = [];
	static pushTextureBinding(gl, target) {
		let tparam;
		if(target == gl.TEXTURE_2D) {
			tparam = gl.TEXTURE_BINDING_2D;
		}else {
			throw Error("ts.");
		}
		const binding = new TextureBinding(gl, gl.getParameter(gl.ACTIVE_TEXTURE), target, gl.getParameter(gl.TEXTURE_BINDING_2D));
		if(!(target in GL.textureBindings)) {
			GL.textureBindings[target] = [];
		}
		GL.textureBindings[target].push(binding);
	}
	static popTextureBinding(target) {
		const value = GL.textureBindings[target].pop();
		value.makeCurrent();
	}
	static pushFramebufferBinding(gl, target) {
		GL.framebufferBindings.push(gl.getParameter(gl.FRAMEBUFFER_BINDING));
	}
	static popFramebufferBinding(gl, target) {
		const value = GL.framebufferBindings.pop();
		if(value != null) {
			const obj = glFramebuffer.framebufferMap.get(value); //is a Map object lookup expensive because i'm pretty sure it's definitely more than a regular property lookup (but typing that made me realize it doesn't have to do any prototype fancy stuff so maybe it could get a speed boost from that?)
			if(obj) {
				obj.makeCurrent();	
				return;
			}
		}
		gl.bindFramebuffer(target, value);
	}
	static pushProgram(gl) {
		GL.programs.push(gl.getParameter(gl.CURRENT_PROGRAM));
	}
	static popProgram(gl) {
		const old = GL.programs.pop();
		if(old != null) {
			const obj = glProgram.programs.get(old);
			obj.makeCurrent();
			return;
		}
		gl.useProgram(old);
	}
}

class glPolyfill {
	static extensions = {};
	static getExtension(gl, name) {
		if(!(name in glPolyfill.extensions)) {
			const value = gl.getExtension(name);
			glPolyfill.extensions[name] = value;
			if(value == null) {
				throw Error(`Extension '${name}' was null!`);
			}
			return value;
		}
		return glPolyfill.extensions[name];
	}
	static callGenericMethod(gl, methodname, extension, ...extra) {
		let methodparent = gl;
		if(!(methodname in gl)) {
			methodparent = glPolyfill.getExtension(gl, extension);
			methodname += extension.substring(0, extension.indexOf("_"));
		}
		return methodparent[methodname](...extra);
	}
	//OES_vertex_array_object
	static createVertexArray(gl) {
		let methodparent = gl;
		let methodname = "createVertexArray";
		if(!(methodname in gl)) {
			methodparent = glPolyfill.getExtension(gl, "OES_vertex_array_object");
			methodname += "OES";
		}
		return methodparent[methodname]();
	}
	static bindVertexArray(gl, arrayObject) {
		return glPolyfill.callGenericMethod(gl, "bindVertexArray", "OES_vertex_array_object", arrayObject);
	}
	static deleteVertexArray(gl, arrayObject) {
		return glPolyfill.callGenericMethod(gl, "deleteVertexArray", "OES_vertex_array_object", arrayObject);
	}
	static isVertexArray(gl, arrayObject) {
		return glPolyfill.callGenericMethod(gl, "isVertexArray", "OES_vertex_array_object", arrayObject);
	}
	//ANGLE_instanced_arrays
	static vertexAttribDivisor(gl, loc, divisor) {
		return glPolyfill.callGenericMethod(gl, "vertexAttribDivisor", "ANGLE_instanced_arrays", loc, divisor);
	}
	static drawArraysInstanced(gl, mode, first, count, instanceCount) {
		return glPolyfill.callGenericMethod(gl, "drawArraysInstanced", "ANGLE_instanced_arrays", mode, first, count, instanceCount);
	}
	static drawElementsInstanced(gl, mode, count, type, offset, instanceCount) {
		return glPolyfill.callGenericMethod(gl, "drawElementsInstanced", "ANGLE_instanced_arrays", mode, count, type, offset, instanceCount);
	}

}

class glUniform {
    location;
    type;
    value;
    constructor(location, type, value) {
        this.location = location;
        this.type = type;
        this.value = value;
    }
	//transpose is optional, only used with glProgram.setUniformMatrix!
    set(program, value, transpose) {
		// debugger;
		GL.pushProgram(gl);
		program.makeCurrent(false);
		/*if(old != program.get()) {
			// alert("make sure nothing retarded happens here.");
			debugger;
			program.makeCurrent();
		}*/
		if(this.type.startsWith("Matrix")) {
			//console.warn(`hardcoding false for transpose property for gl.uniform${this.type}`);
			if(transpose === undefined) {
				throw Error("glUniform::set called but transpose argument is undefined! (perhaps you called setUniform and not setUniformMatrix...)");
			}
			program.gl[`uniform${this.type}`](this.location, transpose, value);
		}else {
			program.gl[`uniform${this.type}`](this.location, value);
		}
        this.value = value;
		/*if(old != program.get()) {
			if(old != null) {
				glProgram.programs.get(old).makeCurrent();
			}else {
				program.gl.useProgram(old);
			}
		}*/
		GL.popProgram(gl);
    }
}

class glBuffer extends IHasBinding {
    _buffer;
    target;
	length;
	usage;
    constructor(gl, target) {
        super(gl);
        this.target = target;
        this._buffer = gl.createBuffer();
		this.length = 0;
		this.usage = undefined;
    }
    makeCurrent() {
        this.gl.bindBuffer(this.target, this._buffer);
    }
    set(data, usage) {
		if(this.length == data.length && this.usage == usage) {
			console.warn("Optimization, using setSub instead of set!");
			return this.setSub(0, data);
		}
		if(usage == undefined) {
			throw Error("glBuffer::set called with no usage!");
		}
        this.makeCurrent();
		//@Bound(this._buffer)
        this.gl.bufferData(this.target, data, usage);
		this.length = data.length;
		this.usage = usage;
    }
	setSub(offset, data) {
		this.makeCurrent();
		//@Bound(this._buffer)
		this.gl.bufferSubData(this.target, offset, data);
	}
	destroy() {
		this.gl.deleteBuffer(this._buffer);
	}
}

class glAttribute {
    gl;
    location;
    buffer;
    enabled;
	layout;
	//ownsBuffer;
    constructor(gl, location, buffer) {
		let ourbuffer = buffer == undefined;
		//this.ownsBuffer = ourbuffer;
		if(ourbuffer) {
			//buffer = new glBuffer(gl, gl.ARRAY_BUFFER);
			throw Error("glAttribute constructor called with no buffer, a buffer must be provided!");
		}
		
        //super(gl);
        this.gl = gl;
        this.location = location;
        this.buffer = buffer; // = new glBuffer(gl, gl.ARRAY_BUFFER);
    }
    /*inline*/ getBuffer() {
        return this.buffer;
    }
    enable() {
        this.enabled = true;
		//@Bound(VAO)
        this.gl.enableVertexAttribArray(this.location);
    }
    disable() {
        this.enabled = false;
		//@Bound(VAO)
        this.gl.disableVertexAttribArray(this.location);
    }
	reactivate() {
		//@Bound(VAO)
		this.gl.enableVertexAttribArray(this.location);
		if(this.layout) {
			this.describeLayout(this.layout.size, this.layout.type, this.layout.normalized, this.layout.stride, this.layout.offset, false);
		}
	}
	set(bufferData, usage) {
		this.buffer.set(bufferData, usage);
	}
	describeLayout(size, type, normalized, stride, offset, remember) {
		this.buffer.makeCurrent();
		//@Bound(buffer)
		//@Bound(VAO)
		this.gl.vertexAttribPointer(this.location, size, type, normalized, stride, offset);
		if(remember) {
			this.layout = {size, type, normalized, stride, offset};
		}
	}
	setDivisor(divisor) {
		//this.buffer.makeCurrent();
		//@Bound(buffer)
		//this.gl.vertexAttribDivisor(this.location, divisor);
		
		//uhh actually, i don't think it's bound because the specification doesn't say it may cause an error if there's nothing bound to the gl.ARRAY_BUFFER target.
		glPolyfill.vertexAttribDivisor(gl, this.location, divisor);
	}
}

function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

class glTexture extends IHasBinding {
	static textureMap = {};
	
	_texture;
	target;
	unit;
	constructor(gl, unit, target, do_default_params = true) {
		super(gl);
		this.target = target;
		this.unit = unit;
		this._texture = gl.createTexture();
		if(do_default_params) { //textures must be "texture complete" !
			// debugger;
			GL.pushTextureBinding(gl, gl.TEXTURE_2D);
			this.makeCurrent();

			//@Bound(this._texture)
			gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			//@Bound(this._texture)
			gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			//@Bound(this._texture)
			gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

			GL.popTextureBinding(gl.TEXTURE_2D);
		}
		if(!(target in glTexture.textureMap)) {
			glTexture.textureMap[target] = new Map;
		}
		glTexture.textureMap[target].set(this._texture, this);
	}
	makeCurrent(unit = this.unit) { // https://webglfundamentals.org/webgl/lessons/webgl-texture-units.html
		this.gl.activeTexture(unit);
		//@Bound(unit)
		this.gl.bindTexture(this.target, this._texture);
	}
	//friend class glFramebuffer
	/*inline*/ get() {
		return this._texture;
	}
	fromImage(src, format, type, callback, do_pixel_flip = true) {
		const element = new Image;
		element.onload = (event) => { //almost used function here but according to that js thing i was reading the arrow should use this from the outside scope
			this.makeCurrent();
			// const $event = {preventDefault: ()=>{texparams=false;}, texture: this, image: element};
			// callback($event);
			
			//@Bound(this._texture)
			this.gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, do_pixel_flip);
			//@Bound(this._texture)

			//fucking suddenly i have to set the width and height or else svgs won't load? (now hold on, i didn't have to do this on chrome and this only seems to be a problem on edge!!)
			element.width = element.naturalWidth;
			element.height = element.naturalHeight;
			this.gl.texImage2D(this.target, 0, format, format, type, element);
			if(isPowerOf2(element.width) && isPowerOf2(element.height)) {
				console.log(`oh wow ${src} is a power of two!`);
				//@Bound(this._texture)
				this.gl.generateMipmap(this.target);
			}
			callback(event);
		};
		element.src = src;
	}
	setPixelStorei(pname, param) {
		this.makeCurrent();
		//@Bound(this._texture)
		this.gl.pixelStorei(pname, param);
	}
	setParameteri(pname, param) {
		this.makeCurrent();
		//@Bound(this._texture)
		this.gl.texParameteri(this.target, pname, param);
	}
	setTexImage2DWithData(level, format, width, height, border, type, srcData) {
		this.makeCurrent();
		//@Bound(this._texture)
		this.gl.texImage2D(this.target, level, format, width, height, border, format, type, srcData);
	}
	setTexImage2DWithImage(level, format, type, source) {
		this.makeCurrent();
		//@Bound(this._texture)
		this.gl.texImage2D(this.target, level, format, format, type, source);
	}
	setTexSubImage2DWithData(level, xoffset, yoffset, width, height, format, type, srcData) {
		this.makeCurrent();
		//@Bound(this._texture)
		this.gl.texSubImage2D(this.target, level, xoffset, yoffset, width, height, format, type, srcData);
	}
	setTexSubImage2DWithImage(level, xoffset, yoffset, format, type, src) {
		this.makeCurrent();
		//@Bound(this._texture)
		this.gl.texSubImage2D(this.target, level, xoffset, yoffset, format, type, src);
	}
	copyTexImage2D(level, format, x, y, width, height, border) {
		this.makeCurrent();
		//copies from current framebuffer
		//@Bound(this._texture)
		this.gl.copyTexImage2D(this.target, level, format, x, y, width, height, border);
	}
	copyTexSubImage2D(level, xoffset, yoffset, x, y, width, height) {
		this.makeCurrent();
		//copies from current framebuffer
		//@Bound(this._texture)
		this.gl.copyTexSubImage2D(this.target, level, xoffset, yoffset, x, y, width, height);
	}
	destroy() {
		this.gl.deleteTexture(this._texture);
	}
}
/*class glSampler extends IHasBinding {
	_sampler;
	constructor(gl) {
		super(gl);
		this._sampler = gl.createSampler();
	}
	makeCurrent() {
		this.gl.bindSampler(this._sampler);
	}
	destroy() {
		this.gl.deleteSampler(this._sampler);
	}
}*/
//perhaps an important detail in the future https://www.vectorstorm.com.au/2015/05/06/opengl-framebuffer-objects-cant-be-shared-between-rendering-contexts/ 
class glFramebuffer extends IHasBinding {
	static framebufferMap = new Map;
	
	_framebuffer;
	target;
	constructor(gl, target) {
		super(gl);
		this.target = target;
		this._framebuffer = gl.createFramebuffer();
		glFramebuffer.framebufferMap.set(this._framebuffer, this);
	}
	makeCurrent() {
		this.gl.bindFramebuffer(this.target, this._framebuffer);
	}
	get() {
		return this._framebuffer;
	}
	setTexture(textureObj, attachment, level) {
		GL.pushFramebufferBinding(this.gl, this.target);
		this.makeCurrent();
		textureObj.makeCurrent(); //wait do you have to bind the texture? (uhhhh let's do it just in case lol)
		//@Bound(textureObj)
		this.gl.framebufferTexture2D(this.target, attachment, textureObj.target, textureObj.get(), level);
		GL.popFramebufferBinding(this.gl, this.target);
	}
	setRenderbuffer(renderBufferObj, attachment, renderBufferTarget) { //i guess i don't need the renderBufferTarget parameter since the obj stores it anyways
		GL.pushFramebufferBinding(this.gl, this.target);
		this.makeCurrent();
		renderBufferObj.makeCurrent();
		//@Bound(renderBufferobj)
		this.gl.framebufferRenderbuffer(this.target, attachment, renderBufferTarget, renderBufferObj.get());
		GL.popFramebufferBinding(this.gl, this.target);
	}
	destroy() {
		this.gl.deleteFramebuffer(this._framebuffer);
	}
}

class glRenderbuffer extends IHasBinding {
	_renderbuffer;
	target;
	constructor(gl, target) {
		super(gl);
		this._renderbuffer = gl.createRenderbuffer();
		this.target = target;
	}
	setStorage(internalFormat, width, height) {
		this.makeCurrent();
		//@Bound(this._renderbuffer)
		this.gl.renderbufferStorage(this.target, internalFormat, width, height);
	}
	setStorageMultisample(samples, internalFormat, width, height) {
		this.makeCurrent();
		//@Bound(this._renderbuffer)
		this.gl.renderbufferStorageMultisample(this.target, samples, internalFormat, width, height);
	}
	makeCurrent() {
		this.gl.bindRenderbuffer(this.target, this._renderbuffer);
	}
	get() {
		return this._renderbuffer;
	}
	destroy() {
		this.gl.deleteRenderbuffer(this._renderbuffer);
	}
}

class glProgram {
    gl;
	_program;
    uniforms = {};
    attribs = {};
	manual_attrib_rebind;

	static programs = new Map;

    static fromShaders(vertex_text, fragment_text, free_shaders = true, manual_or_using_vao = false) {
        const {vshader, fshader, program} = createProgram(vertex_text, fragment_text);
        if(!program) {
            throw Error("Failed to create program!");
        }
        if(free_shaders) {
            gl.detachShader(program, vshader);
            gl.detachShader(program, fshader);

            gl.deleteShader(vshader);
            gl.deleteShader(fshader);
        }
        return new glProgram(gl, program, manual_or_using_vao);
    }

    constructor(gl, realprogram, manual_or_using_vao) {
        this.gl = gl;
        this._program = realprogram;
		this.manual_attrib_rebind = manual_or_using_vao;
		glProgram.programs.set(this._program, this);
    }

    /*inline*/ get() {
        return this._program;
    }

    makeCurrent(enable_vertex_attribs_if_not_manual = true) {
		// debugger;
		if(gl.getParameter(gl.CURRENT_PROGRAM) == this.get()) return; //don't bother

        this.gl.useProgram(this.get());
		if(enable_vertex_attribs_if_not_manual && !this.manual_attrib_rebind) {
			//TODO: use them fancy VAOs so i don't have to do this kthxbai
	        for(const prop in this.attribs) {
    	        const attrib = this.attribs[prop];
        	    if(attrib.enabled) {
	                // attrib.enable(); //oh my god i actually need to call vertexAttribPointer again to set them...
					attrib.reactivate();
    	        }
	        }
		}
    }

	//framebuffers aren't bound to the current program! it makes no sense to put this here.
	/*defaultFramebuffer() {
		this.gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}*/

    registerUniform(name, type, initialValue = undefined) {
        const loc = this.gl.getUniformLocation(this.get(), name);
		if(loc == null) console.warn(`uniform '${name}' could not be found!`); //throw Error(`uniform '${name}' could not be found!`);
        const obj = new glUniform(loc, type, initialValue);
        this.uniforms[name] = obj;
		if(initialValue != undefined) {
			if(type.startsWith("Matrix")) {
				throw Error(`glProgram::registerUniform called with initialValue but type is ${type}! Call glProgram::registerUniform with no initialValue, then call glProgram::setUniformMatrix!`);
			}
			obj.set(this, initialValue);
		}
        return obj;
        //this.gl[`uniform${type}`](loc, initialValue);
    }

    setUniform(name, value) {
        this.uniforms[name].set(this, value);
    }

	setUniformMatrix(name, transpose, value) {
		if(value == undefined) console.warn("glProgram::setUniformMatrix value parameter was undefined?");
		this.uniforms[name].set(this, value, transpose);
	}

    registerAttrib(name, buffer = undefined) {
        const loc = this.gl.getAttribLocation(this.get(), name);
		if(loc == -1/*null*/) throw Error(`attribute '${name}' could not be found!`);
		//yo so why the FUCK does getAttribLocation return -1 if it failed instead of null like getUniformLocation

        const obj = new glAttribute(this.gl, loc, buffer);
        this.attribs[name] = obj;
        return obj;
    }

    enableAttrib(name) {
        this.attribs[name].enable();
    }

	disableAttrib(name) {
		this.attribs[name].disable();
	}

    setAttribData(name, bufferData, usage) {
		this.attribs[name].set(bufferData, usage);
    }
	
	describeAttribLayout(name, size, type, normalized, stride, offset, remember) {
		this.attribs[name].describeLayout(size, type, normalized, stride, offset, remember);
	}

	setAttribDivisor(name, divisor) {
		this.attribs[name].setDivisor(divisor);
	}

	destroy() {
		this.gl.deleteProgram(this._program);
	}
}

//for jbs lol
if(!globalThis["window"]) {
	globalThis.Model = Model;
	globalThis.glUniform = glUniform;
	globalThis.glBuffer = glBuffer;
	globalThis.glAttribute = glAttribute;
	globalThis.glTexture = glTexture;
	globalThis.glFramebuffer = glFramebuffer;
	globalThis.glRenderbuffer = glRenderbuffer;
	globalThis.glProgram = glProgram;
}
