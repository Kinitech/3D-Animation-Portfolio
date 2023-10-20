import './Hero.css';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame, useLoader, useThree} from 'react-three-fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
    BoxGeometry, Color, CylinderGeometry, DoubleSide, InstancedBufferAttribute,
    InstancedMesh, Matrix4,
    Object3D, Raycaster,
    ShaderMaterial, SphereGeometry, Vector2,
    Vector3
} from "three";
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'
import {gsap} from 'gsap'
import {throttle} from "lodash";

function createTween(i, mesh, dummy, initialPositions, targetPositions) {
    const initialPosition = initialPositions[i];
    const targetPosition = targetPositions[i];

    return gsap.fromTo(dummy.position, {
        x: initialPosition[0],
        y: initialPosition[1],
        z: initialPosition[2]
    }, {
        x: targetPosition[0],
        y: targetPosition[1],
        z: targetPosition[2],
        duration: 1.0,
        onUpdate: () => {
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            mesh.instanceMatrix.needsUpdate = true;
        }
    });
}

function initialiseSphere(i, mesh, dummy, initialPosition) {

    // Set the random position of the dummy object
    dummy.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
    // Set the scale of the dummy object
    const scale = 5 * Math.random() + 6;
    dummy.scale.set(scale, scale, scale);
    // Set the rotation of the dummy object
    const rotation = [Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI]
    dummy.rotation.set(rotation[0], rotation[1], rotation[2]);

    // Update the matrix of the dummy object
    dummy.updateMatrix()
    // Set the sphere matrix to the matrix of the dummy object
    mesh.setMatrixAt(i, dummy.matrix)

}


function RotatingBrain({modelDirectory, containerRef, size}) {

    const instancedBrainRef = useRef();
    const gltf = useLoader(GLTFLoader, modelDirectory);
    const brain = gltf.scene.children[0];

    const [uniforms, setUniforms] = useState({uHover: 0});

    const {scene } = useThree();
    const [isHovered, setIsHovered] = useState(false);
    const colors = useMemo( () => [
        new Color(0x8A2BE2), // BlueViolet
        new Color(0x9370DB), // MediumPurple
        new Color(0x7B68EE), // MediumSlateBlue
        new Color(0x6A5ACD), // SlateBlue
    ], []);
    const point = new Vector3();

    const tl = gsap.timeline({paused: true});

    useEffect(() => {
        if (instancedBrainRef.current) {
            instancedBrainRef.current.scale.set(size, size, size);
        }
    }, [instancedBrainRef.current, size]);

    useEffect(() => {
        const geometry = new SphereGeometry(0.002, 1, 1)
        const material = new ShaderMaterial({
            vertexShader: `   
uniform vec3 uPointer;
uniform vec3 uColor;
uniform float uRotation;
uniform float uScale;
uniform float uHover;
uniform float uMaxDepth;
varying vec3 vColor;

#define PI 3.14159265359

mat2 rotate(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat2(c, -s, s, c);
}
         
void main() {
  vec4 mvPosition = vec4(position, 1.0);
    mvPosition = instanceMatrix * mvPosition;
    
    vec4 clipSpacePosition = projectionMatrix * modelViewMatrix * mvPosition;
    vec3 ndc = clipSpacePosition.xyz / clipSpacePosition.w;  // Convert to NDC
    
    float d = distance(uPointer, ndc);  // We now measure the distance in NDC
    
    float c = smoothstep(0.5, 0.15, d);
    
    // Interpolate the color based on distance
    vColor = mix(uColor, vec3(0.61, 0.49, 0.96), c * 1.5);
    
    float scale = uScale + c * 3.0 * uHover;
    vec3 pos = position;
    pos *= scale;
    pos.xz *= rotate(PI * c * uRotation + PI * uRotation * 0.43);
    pos.xy *= rotate(PI * c * uRotation + PI * uRotation * 0.71);

    mvPosition = instanceMatrix * vec4(pos, 1.0);

    gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
}
    `,
            fragmentShader: `
varying vec3 vColor;
            
void main() {
    gl_FragColor = vec4(vColor, 0.1);
}

    `,
        wireframe: true,

        uniforms: {
            uPointer: { value: new Vector3(100, 100, 100) },
            uColor: { value: new Color() },
            uRotation: { value: Math.random() * Math.PI },
            uScale: { value: 1 },
            uHover: { value: uniforms.uHover },
        }
        });


        const mesh = new InstancedUniformsMesh(geometry, material, brain.geometry.attributes.position.count);


        // Store the initial random/actual positions for each instance
        const position1_randomPositions = [];
        const position2_brainPositions = [];
        const position3_binaryPositions = [];


        for (let i = 0; i < mesh.count; i++) {

            const dummy = new Object3D()

            // - Position 1 : Store the initial random positions for each instance
            const randomPosition = [
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                (Math.random() - 0.5),
            ];
            position1_randomPositions.push([...randomPosition]);

            // - Position 2 : Store the brain positions for each instance
            const brainPositions = brain.geometry.attributes.position.array.slice(i * 3, (i * 3) + 3);
            position2_brainPositions.push([...brainPositions]);


            // - Setting up initial state of the mesh
            initialiseSphere(i, mesh, dummy, randomPosition)

            // Set the color of the sphere
            const colorIndex = Math.floor( Math.random() * colors.length);
            mesh.setUniformAt('uColor', i , colors[colorIndex])

            // - Create tweens for each sphere

            // Random position -> Brain position
            tl.add(createTween(i, mesh, dummy, position1_randomPositions, position2_brainPositions), 0.0)

            // Brain position -> Binary position
            tl.add(createTween(i, mesh, dummy, position2_brainPositions, position1_randomPositions), 1.0)


            // Data Visualization: Stretched out wave, spaced out spheres, almost like a 3d equalizer or something

        }

        // Preload the GSAP timeline
        tl.progress(1).progress(0)


        // Add the mesh to the scene
        scene.add(mesh);
        // Set the reference to mesh
        instancedBrainRef.current = mesh;  // Set the reference to mesh

        return () => {
            scene.remove(mesh);
        } // Cleanup on component unmount
    }, []); // Empty dependency array to run only once on mount and unmount

    function animateHoverUniform(value) {
        gsap.to(uniforms, {
            uHover: value,
            duration: 0.25,
            onUpdate: () => {
                for (let i = 0; i < instancedBrainRef.current.count; i++) {
                    instancedBrainRef.current.setUniformAt('uHover', i, uniforms.uHover)
                }
            }
        })
    }

    const handleScroll = useCallback(() => {
        const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        tl.progress((scrolled / totalScrollHeight));
    }, []);

    useEffect(() => {
        const throttledHandleScroll = throttle(handleScroll, 5);
        window.addEventListener('scroll', throttledHandleScroll);
        return () => {
            window.removeEventListener('scroll', throttledHandleScroll);
        };
    }, [handleScroll]);



// Modify your handleMouseMove function like this
    const handleMouseMove = useCallback((event) => {
        // Calculate mouse position in normalized device coordinates
        const rect = containerRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 2 - 1;
        const y = -(event.clientY - rect.top) / rect.height * 2 + 1;

        // Update the picking ray with the camera and mouse position
        if (isHovered) {
            setIsHovered(false)
            animateHoverUniform(0)
        } else { // Mouseenter
            setIsHovered(true)
            animateHoverUniform(1)
        }

        gsap.to(point, {
            x: () => x,
            y: () => y,
            z: 0.39,
            overwrite: true,
            duration: 0.3,
            onUpdate: () => {
                // Only animate the spheres in animatedSpheres
                for (let i = 0; i < instancedBrainRef.current.count; i++) {
                    instancedBrainRef.current.setUniformAt('uPointer', i, point)
                }
            }
        })
    }, []);



    useEffect(() => {
        const container = containerRef.current;
        container.addEventListener('mousemove', handleMouseMove, {passive: true});

        // Cleanup
        return () => {
            container.removeEventListener('mousemove', handleMouseMove, {passive: true})
        };
    }, []);


    useFrame(() => {
        if (instancedBrainRef.current && brain) {
            instancedBrainRef.current.rotation.y += 0.002;
        }
    });

    return null;
}

function HeroSection() {
    const containerRef = useRef();
    const [size, setSize] = useState(1.2);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, []); // Empty dependency array to run only once on mount and unmount

    const handleResize = () => {
        if (window.innerWidth < 500) {
            setSize(0.6);
        } else if (window.innerWidth < 800) {
            setSize(0.8);
        } else {
            setSize(1);
        }
    };

    return (
        <div ref={containerRef} className="hero-section">
            <Canvas camera={{position: [0, 0, 1.2], fov: 75, near: 0.1, far: 100}}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 10, 5]} />
                <RotatingBrain modelDirectory={'/static/brain.glb'} containerRef={containerRef} size={size}/>
            </Canvas>
        </div>
    );
}

export default HeroSection;
