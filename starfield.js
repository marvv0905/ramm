const PI = Math.PI;

function randRange(range) {
    return Math.floor(Math.random() * range);
}

class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Vec4 {
    constructor(x = 0, y = 0, z = 0, w = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

class Star {
    constructor() {
        this.pos = new Vec3();
        this.colorHSL = [0, 0, 0];
        this.colorRGB = '';
    }
}

class Starfield {
    constructor(canvasId, nStars, color, backgroundColor, speed = 1, z = 0, defX = 0, defY = 0) {
        this.canvas = document.getElementById(canvasId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.nStars = nStars;
        this.color = color;
        this.backgroundColor = backgroundColor;
        this.speed = speed;
        this.z = z;
        this.defX = defX;
        this.defY = defY;
        this.stars = [];
        this.ctx = null;
        this.luminanceCoeff = 100;
        this.opacity = 0;
        this.fadeInDuration = 2000;
        this.fadeInStartTime = null;
    }

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.opacity = '0';

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        for (let i = 0; i < this.nStars; i++) {
            let star = new Star();
            this.createStar(star);
            this.stars.push(star);
        }
    }
	
	resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Reinitialize all stars with new dimensions
        this.stars = [];
        for (let i = 0; i < this.nStars; i++) {
            let star = new Star();
            this.createStar(star);
            this.stars.push(star);
        }
    }

    createStar(star) {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        star.pos.x = randRange(this.width) - halfWidth;
        star.pos.y = randRange(this.height) - halfHeight;
        star.pos.z = randRange(this.width);

        star.colorRGB = this.color;
    }

    updateColor(star, minBrightness, maxBrightness) {
        let brightness = 1 - (star.pos.z / this.width);
        brightness = Math.max(minBrightness / 100, Math.min(maxBrightness / 100, brightness));

        const rgb = this.hexToRgb(this.color);

        const r = Math.round(rgb.r * brightness);
        const g = Math.round(rgb.g * brightness);
        const b = Math.round(rgb.b * brightness);

        star.colorRGB = `rgb(${r}, ${g}, ${b})`;
    }

	// ye.
    update(currentTime) {
        if (this.fadeInStartTime === null) {
            this.fadeInStartTime = currentTime;
        }
        
        const fadeInProgress = Math.min((currentTime - this.fadeInStartTime) / this.fadeInDuration, 1);
        this.opacity = fadeInProgress;
        this.canvas.style.opacity = this.opacity.toString();

        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        const direction = new Vec4(3.0, 4.0, 0.0, PI / 2.0);
        const position = this.math(direction);

        for (let star of this.stars) {
            star.pos.z -= position.z * this.speed * 10;
            
            if (star.pos.z <= 0) {
                this.createStar(star);
                continue;
            }
    
            let screenX = (star.pos.x / star.pos.z) * this.width;
            let screenY = (star.pos.y / star.pos.z) * this.height;

            if (Math.abs(screenX) > this.width / 2 || Math.abs(screenY) > this.height / 2) {
                this.createStar(star);
                continue;
            }
    
            star.pos.x -= position.x * this.speed * 10;
            star.pos.y -= position.y * this.speed * 10;
    
            screenX += this.width / 2;
            screenY += this.height / 2;
    
            if (screenX < 0 || screenX > this.width || screenY < 0 || screenY > this.height) {
                continue;
            }
    
            this.updateColor(star, 10, 90);
    
            let starSize = (1 - star.pos.z / this.width) * 1.3;
            this.ctx.fillStyle = star.colorRGB;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, starSize, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

	// math jumpscare
    math(direction) {
        let angle = (performance.now() / 1000) % 360;
        let v = (angle % 360) * PI / 180;

        let deltaX = Math.cos(direction.z * v) * Math.cos(direction.x * v);
        let deltaY = Math.cos(direction.w * v) * Math.cos(direction.x * v);
        let deltaZ = Math.sin(direction.y * v);

        return new Vec3(0.1 * deltaX, 0.1 * deltaY, 0.2 + 0.1 * deltaZ);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); // uhhhhhhhhhhhhhhhhhhhhhhhhhhh don't mind me why i used reg[r]ex
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h * 360, s * 100, l * 100];
    }

    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}

// Add this to the end of your starfield.js file:
document.addEventListener('DOMContentLoaded', function() {
    const starfield = new Starfield(
        'starfield', // canvas ID
        1000,        // number of stars
        '#ffffff',   // star color
        '#000000',   // background color
        1            // speed
    );
    
    starfield.init();
    
    function animate(currentTime) {
        starfield.update(currentTime);
        requestAnimationFrame(animate);
    }
    
    requestAnimationFrame(animate);
});