import './Hero.css';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame, useLoader, useThree} from 'react-three-fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
    BoxGeometry, Color, DoubleSide, InstancedBufferAttribute,
    InstancedMesh, Matrix4,
    Object3D, Raycaster,
    ShaderMaterial, SphereGeometry, Vector2,
    Vector3
} from "three";
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'
import {gsap} from 'gsap'

const colors = [
    new Color(0x8A2BE2), // BlueViolet
    new Color(0x9370DB), // MediumPurple
    new Color(0x7B68EE), // MediumSlateBlue
    new Color(0x6A5ACD), // SlateBlue
];
const color = [
    new Color(0x8A2BE2), // BlueViolet
    new Color(0x383838), // DarkGray
    new Color(0x545454), // Gray
    new Color(0x707070), // MediumGray
    new Color(0x8C8C8C), // Silver
    new Color(0xA8A8A8), // LightGray
    new Color(0xC4C4C4), // VeryLightGray
];





function RotatingBrain({modelDirectory, containerRef, size, depth}) {

    const instancedBrainRef = useRef();
    const gltf = useLoader(GLTFLoader, modelDirectory);
    const brain = gltf.scene.children[0];

    const [uniforms, setUniforms] = useState({uHover: 0});
    const [uMaxDepth, setUMaxDepth] = useState(depth + (1.0 - size));

    const {scene } = useThree();
    const [isHovered, setIsHovered] = useState(false);

    const point = new Vector3();

    const tl = gsap.timeline({paused: true});

    useEffect(() => {
        if (instancedBrainRef.current) {
            instancedBrainRef.current.scale.set(size, size, size);
            for (let i = 0; i < instancedBrainRef.current.count; i++) {
                instancedBrainRef.current.setUniformAt('uMaxDepth', i, depth + (1.0 - size)/3)
            }
        }
    }, [instancedBrainRef.current, size])

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
    vec2 ndc = clipSpacePosition.xy / clipSpacePosition.w;  // Convert to NDC
    
    float d = distance(uPointer.xy, ndc);  // We now measure the distance in NDC

    // Check if the depth exceeds the hardcoded maximum depth
    if (clipSpacePosition.z > uMaxDepth && clipSpacePosition.y > -0.5 - (` + String(depth) + `- uMaxDepth) * 1.5) {
      d = 4.5;  // Reset or reduce the influence, e.g., set distance to maximum
    }
    
  float c = smoothstep(0.10, 0.0, d);
  
   // Interpolate the color based on distance
    vColor = mix(uColor, vec3(0.61, 0.49, 0.96), c);

  float scale = uScale + c * 1.5 * uHover;
  vec3 pos = position;
  pos *= scale;
  pos.xz *= rotate(PI*c*uRotation + PI*uRotation*0.43);
  pos.xy *= rotate(PI*c*uRotation + PI*uRotation*0.71);

  mvPosition = instanceMatrix * vec4(pos, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * mvPosition;

}
    `,
            fragmentShader: `
uniform vec3 uColor;
varying vec3 vColor;
            
void main() {
    gl_FragColor = vec4(vColor, 0.1);
}

    `,
        wireframe: true,

        uniforms: {
            uPointer: { value: new Vector3(100, 100, 100) },
            uColor: { value: new Color() },
            uRotation: { value: 0 },
            uScale: { value: 0 },
            uHover: { value: uniforms.uHover },
            uMaxDepth: { value: uMaxDepth }
        }
        });


        const mesh = new InstancedUniformsMesh(geometry, material, brain.geometry.attributes.position.count);

        const scales = new Float32Array(mesh.count);  // Array to hold random scales
        const dummy = new Object3D()

        // Store the initial random/actual positions for each instance
        const randomPositions = [];
        mesh.userData.positions = mesh.userData.positions || [];

        for (let i = 0; i < mesh.count; i++) {

            const finalPosition = brain.geometry.attributes.position.array.slice(i * 3, (i * 3) + 3);

            mesh.userData.positions.push([finalPosition[0], finalPosition[1], finalPosition[2]]);

            const randomPosition = [
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                (Math.random() - 0.5),
            ];
            randomPositions.push([...randomPosition]);

            // Calculate a random scale between 0.001 and 0.005
            const scale = 5
            scales[i] = scale;  // Store the random scale

            // Set the random position of the dummy object
            dummy.position.set(randomPosition[0], randomPosition[1], randomPosition[2]);
            // Set the scale of the dummy object
            dummy.scale.set(scale, scale, scale);
            // Set the rotation of the dummy object
            dummy.rotation.set(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);

            dummy.updateMatrix()

            mesh.setMatrixAt(i, dummy.matrix)

            mesh.setUniformAt('uRotation', i , Math.random() * 2 - 1)

            mesh.setUniformAt('uScale', i, Math.random() + 1)

            const colorIndex = Math.floor( Math.random() * colors.length);
            mesh.setUniformAt('uColor', i , colors[colorIndex])

        }

        for (let i = 0; i < mesh.count; i++) {
            const targetPosition = mesh.userData.positions[i];
            const initialPosition = randomPositions[i];

            tl.fromTo(dummy.position, {
                x: initialPosition[0],
                y: initialPosition[1],
                z: initialPosition[2]
            }, {
                x: targetPosition[0],
                y: targetPosition[1],
                z: targetPosition[2],
                ease: 'power2.out',
                onUpdate: () => {
                    dummy.updateMatrix();
                    mesh.setMatrixAt(i, dummy.matrix);
                    mesh.instanceMatrix.needsUpdate = true;
                }
            });
        }

        scene.add(mesh);

        instancedBrainRef.current = mesh;  // Set the reference to mesh

        return () => {
            scene.remove(mesh);
        } // Cleanup on component unmount
    }, []); // Empty dependency array to run only once on mount and unmount

    function animateHoverUniform(value, instancedMesh) {
        gsap.to(uniforms, {
            uHover: value,
            duration: 0.25,
            onUpdate: () => {
                for (let i = 0; i < instancedMesh.count; i++) {
                    instancedMesh.setUniformAt('uHover', i, uniforms.uHover)
                }
            }
        })
    }

    const handleScroll = () => {
        const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        tl.progress((scrolled / totalScrollHeight));
    };

    useEffect(() => {

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleMouseMove = (event) => {

        // Calculate mouse position in normalized device coordinates
        const rect = containerRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 2 - 1;
        const y = -(event.clientY - rect.top) / rect.height * 2 + 1;


        if (isHovered) {
            setIsHovered(false)
            animateHoverUniform(0, instancedBrainRef.current)
        } else { // Mouseenter
            setIsHovered(true)
            animateHoverUniform(1, instancedBrainRef.current)
        }

        gsap.to(point, {
            x: () => x,
            y: () => y,
            z: 0,
            overwrite: true,
            duration: 0.3,
            onUpdate: () => {
                for (let i = 0; i < instancedBrainRef.current.count; i++) {
                    instancedBrainRef.current.setUniformAt('uPointer', i, point)
                }
            }
        })
    };


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
                <RotatingBrain modelDirectory={'/static/brain.glb'} containerRef={containerRef} size={size} depth={0.7}/>
            </Canvas>
        </div>
    );
}

export default HeroSection;
