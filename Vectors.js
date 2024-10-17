class Vector2 { //snatched from JBS3's iconboids.js
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    get magnitude() {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    set magnitude(value) {
        const old = this.magnitude;
        if(old != 0) {
            const ratio = value/old;
            this.x = this.x*ratio;
            this.y = this.y*ratio;    
        }
    }

    angle() { //heading
        return Math.atan2(this.y,this.x);
    }

    normalize() {
        this.magnitude = 1;
        return this;
    }

    //static Dot(v1, v2) { //yo dot, i gotchu!
    //    const v3 = new Vector2(v1.x-v2.x, v1.y-v2.y);
    //    const a = v1.magnitude;
    //    const b = v2.magnitude;
    //    const c = v3.magnitude;//Math.sqrt(a**2 + b**2); //a^2 + b^2 = c^2 (wait what the fuck you could say im getting the magnitude of these magnitudes) (nah for some reason this wont work (and shoot i still don't know why))
    //    const cTheta = Math.acos((a**2 + b**2 - c**2)/(2*a*b));
    //    return a*b*Math.cos(cTheta); //oh boy im hoping that's right
//
    //    //yo what the fuck p5js' implementation is 1000x simpler??/
    //}

    Dot(x, y) {
        if(x instanceof Vector2) {
            return this.Dot(x.x, x.y);
        }
        return this.x * (x || 0) + this.y * (y || 0); //yo what the fuck is this shit (joe reference) (im actually flabbergasted)
    }

    static setMagnitude(v, value) {
        const old = v.magnitude;
        const ratio = value/old;
        return new Vector2(v.x*ratio, v.y*ratio);
    }
}