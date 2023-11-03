import {BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial} from 'three';
import {useRef} from "react";
import {useFrame} from "@react-three/fiber";

function createSphereWireframe(radius, segments) {
    const vertices = [];

    // Latitude lines
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI; // range from 0 to PI
        const y = radius * Math.cos(theta);
        for (let j = 0; j <= segments; j++) {
            const phi = (j / segments) * 2 * Math.PI; // range from 0 to 2PI
            const x = radius * Math.sin(theta) * Math.cos(phi);
            const z = radius * Math.sin(theta) * Math.sin(phi);
            vertices.push(x, y, z);
        }
    }

    // Longitude lines
    for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * 2 * Math.PI;
        for (let j = 0; j <= segments; j++) {
            const theta = (j / segments) * Math.PI; // range from 0 to PI
            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.cos(theta);
            const z = radius * Math.sin(theta) * Math.sin(phi);
            vertices.push(x, y, z);
        }
    }

    const indices = [];

    // Connect vertices to create latitude lines
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            const start = i * (segments + 1) + j;
            const end = start + 1;
            indices.push(start, end);
        }
    }

    // Connect vertices to create longitude lines
    const offset = (segments + 1) * (segments + 1);
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < segments; j++) {
            const start = offset + i * (segments + 1) + j;
            const end = start + 1;
            indices.push(start, end);
        }
    }

    const geometry = new BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

    return geometry;
}

function WireframeBackground() {
    const radius = 1;
    const segments = 100;

    const geometry = createSphereWireframe(radius, segments);

    const uniforms = {
        baseColor: { value: new Color('#4a2b79') }
    };

    const material = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
        fragmentShader: `
        precision highp float;
        uniform vec3 baseColor;
        varying vec3 vPosition;
        void main() {
            float normalisedX = (vPosition.x + 1.0) * 0.5;
            float wave = 0.05 * sin(normalisedX * 8.0);
            float r = baseColor.r + wave;
            float g = baseColor.g;
            float b = baseColor.b;
            gl_FragColor = vec4(vec3(r, g, b), 1.0);
        }
    `
    });

    const meshRef = useRef();


    useFrame((state) => {
        meshRef.current.rotation.y += 0.0001;
    });
    return (
        <lineSegments ref={meshRef} geometry={geometry} material={material} position={[0, 0, 0.7]} />
    );
}


export default WireframeBackground;
