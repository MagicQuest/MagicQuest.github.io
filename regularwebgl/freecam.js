class Camera {
	matrix;

	position;
	xRot; //pitch
	yRot; //yaw
	//zRot; //roll (not yet bro.)
	forward;
	right;
	up;
	speed;

	constructor(position = [0.0, 0.0, 0.0], xRot = 0, yRot = -90, zRot = 0, speed = 0.1) {
		this.position = position;
		this.xRot = xRot;
		this.yRot = yRot;
		this.zRot = zRot;
		this.speed = speed;
		this.build();
	}

	build() {
		//debugger;
		const xRad = this.xRot*Math.PI/180;
		const yRad = this.yRot*Math.PI/180;
		const zRad = this.zRot*Math.PI/180;

		//yaw
		/*this.forward = [
			Math.cos(yRad),
			0,
			Math.sin(yRad),
		];*/

		//pitch
		/*this.forward = [
			0,
			Math.sin(xRad),
			Math.cos(xRad),
		];*/

		//pitch + yaw
		this.forward = [
			Math.cos(yRad) * Math.cos(xRad),
			Math.sin(xRad),
			Math.sin(yRad) * Math.cos(xRad),
		];
		this.forward = m4.normalize(this.forward);
		this.right = m4.normalize(m4.cross(this.forward, [0.0, 1.0, 0.0]));
		this.up = m4.normalize(m4.cross(this.right, this.forward));
		//const tempPos = m4.addVectors(this.position, [0.0, 0.0, Math.PI/2]);
		const tempPos = this.position;
		this.matrix = m4.lookAt(tempPos, m4.addVectors(tempPos, this.forward), this.up);
		this.matrix = m4.translate(this.matrix, 0.0, 0.0, Math.PI/2); //?
		return this.matrix;
	}

	handleMouseMovement(deltaX, deltaY) {
		this.xRot += -deltaY;
		this.yRot += deltaX;
		this.build();
	}

	handleKeyboardInput(event) {
		let redraw = false;
		const key = event.key.toLowerCase();
		const sspeed = event.shiftKey ? this.speed*5.0 : this.speed;
		if(key == "w") {
			this.position = m4.addVectors(this.position, m4.scaleVector(this.forward, sspeed));
			redraw = true;
		}else if(key == "s") {
			this.position = m4.subtractVectors(this.position, m4.scaleVector(this.forward, sspeed));
			redraw = true;
		}else if(key == "d") {
			this.position = m4.addVectors(this.position, m4.scaleVector(this.right, sspeed));
			redraw = true;
		}else if(key == "a") {
			this.position = m4.subtractVectors(this.position, m4.scaleVector(this.right, sspeed));
			redraw = true;
		}else if(key == " ") {
			//this.position[1] += sspeed;
			this.position = [this.position[0], this.position[1]+sspeed, this.position[2]];
			redraw = true;
		}else if(key == "shift") {
			//this.position[1] -= sspeed;
			this.position = [this.position[0], this.position[1]-sspeed, this.position[2]];
			redraw = true;
		}

		if(redraw) {
			camera.build();
			return redraw;
		}
	}
}
