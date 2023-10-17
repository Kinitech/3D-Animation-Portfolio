import React, { useState, useEffect } from 'react';
import Sketch from 'react-p5';

const colorMax = 280;
function getRandomArbitrary(min, max) {return Math.random() * (max - min) + min;}

class Particle {

    constructor(p5) {
        const velo = 5
        this.p5 = p5;
        this.location = p5.createVector(getRandomArbitrary(0, p5.width), getRandomArbitrary(0, p5.windowHeight));
        this.velocity = p5.createVector(getRandomArbitrary(-velo, velo), getRandomArbitrary(-velo, velo));
        this.acceleration = p5.createVector(-0.01, 0.01);
        this.topspeed = 13;
        this.color = null;
    }

    update() {
        const midpoint = this.p5.createVector(this.p5.width / 2, document.documentElement.scrollTop + this.p5.windowHeight / 2);
        const dir = midpoint.sub(this.location);
        dir.normalize();
        dir.mult(0.5);
        this.acceleration = dir;

        this.velocity.add(this.acceleration);
        this.velocity.limit(this.topspeed);

        this.location.add(this.velocity);
    }
}

const SketchBackground = () => {
    const [p5, setP5] = useState();
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        window.addEventListener('resize', windowResized);
        return () => {
            window.removeEventListener('resize', windowResized);
        };
    }, [p5]);

    const setup = (p5Instance, canvasParentRef) => {
        setP5(p5Instance);
        p5Instance.pixelDensity(1);
        p5Instance.colorMode(p5Instance.HSB);
        const canvas = p5Instance.createCanvas(p5Instance.windowWidth, document.body.scrollHeight).parent(canvasParentRef);
        canvas.position(0, 0);
        canvas.style('z-index', '-1');
        p5Instance.disableFriendlyErrors = true;

        p5Instance.fill(0, 0, 0, 0);
        const newParticles = [];
        const noOfParticles = 50
        let col = colorMax;
        for (let i = 0; i < noOfParticles; i++) {
            col -= 1
            const particle = new Particle(p5Instance);
            particle.color = p5Instance.color(col, 50, 48, 0.1);
            newParticles.push(particle);
        }
        setParticles(newParticles);

        p5Instance.frameRate(20)
    };

    const draw = (p5Instance) => {
        p5Instance.background(0, 0, 9);
        particles.forEach((particle, i) => {
            particle.update();

            p5Instance.stroke(particle.color);
            p5Instance.fill(particle.color);

            p5Instance.circle(particle.location.x, particle.location.y, 400)

            p5Instance.noStroke();
            p5Instance.fill(0, 0.018);
            p5Instance.rect(0, 0, p5Instance.width, p5Instance.height);
        });

    };

    const windowResized = () => {
        if (p5) {
            p5.resizeCanvas(p5.windowWidth, document.body.scrollHeight);
        }
    };

    return <Sketch setup={setup} draw={draw}/>;
};

export default SketchBackground;
