import './ThreeJSBackground.css';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame, useLoader, useThree} from 'react-three-fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {Color, Euler, Object3D, Quaternion, ShaderMaterial, SphereGeometry, Vector3} from "three";
import {InstancedUniformsMesh} from 'three-instanced-uniforms-mesh'
import {gsap} from 'gsap'
import {throttle} from "lodash";

function createTween(i, mesh, dummy, targetPositions) {
    const currentPosition = [dummy.position.x, dummy.position.y, dummy.position.z];
    const targetPosition = targetPositions[i];


    return gsap.fromTo(dummy.position, {
        x: currentPosition[0],
        y: currentPosition[1],
        z: currentPosition[2]
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

function createRotationTween(rotationObject, axis, toValue, onComplete) {
    const properties = {};
    properties[axis] = toValue;

    return gsap.to(rotationObject, {
        ...properties,
        duration: 1.0,  // You can adjust the duration as needed
        ease: "power2.out",
        onComplete: () => {
            onComplete();
        }
    });
}

function timelineRotate(rotationObject, tl, axisFrom, axisTo, rotateFrom, rotateTo, time) {
    // Reset y rotation and pause yRotateTween after it's done
    tl.add(() => {
        createRotationTween(rotationObject,
            axisFrom,
            0,
            () => {
                rotateFrom.pause()
                rotateTo.restart()
                rotateTo.play()
            })
    }, time)

    // Reset x rotation and pause xRotateTween after it's done
    tl.add(() => {
        createRotationTween(rotationObject,
            axisTo,
            0,
            () => {
                rotateTo.pause()
                rotateFrom.restart()
                rotateFrom.play()
            })
    }, time - 0.00001);

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

function calculateHalfBrainPosition(brainPosition) {
    if (brainPosition[2] < 0) {
        brainPosition[2] = 0;
    }
    return brainPosition;
}

function calculateBinaryPosition(i, numberOfColumns, thetaSpacing, ySpacing, cylinderRadius) {
    const column = i % numberOfColumns;
    const row = Math.floor(i / numberOfColumns);
    const theta = column * thetaSpacing;
    const y = cylinderRadius * Math.cos(theta);
    const x = row * ySpacing;
    const z = cylinderRadius * Math.sin(theta);
    return [x - 0.7, y, z];
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
            vertexShader: require('../shaders/vertex.glsl.js').default,
            fragmentShader: require('../shaders/fragment.glsl.js').default,
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

        // Store the initial positions for each transition position
        const position2_neuroPositions = [];
        const position3_codePositions = [];
        const position4_mlPositions = [];
        const position5_dataPositions = [];

        // Position 3 Variables

        const numberOfColumns = 100;
        const cylinderRadius = 0.5;  // You can adjust this to increase or decrease the cylinder's radius.
        const thetaSpacing = (2 * Math.PI) / numberOfColumns;  // Angle spacing for the columns.
        const ySpacing = 0.05;  // Vertical spacing for the rows.

        for (let i = 0; i < mesh.count; i++) {

            const dummy = new Object3D()

            // - Position 1 : Store the initial random positions for each instance
            const randomPosition = [(Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5),];
            // - Setting up initial state of the mesh
            initialiseSphere(i, mesh, dummy, randomPosition)

            // - Position 2 : Store the brain positions for each instance
            const brainPosition = brain.geometry.attributes.position.array.slice(i * 3, (i * 3) + 3);
            position2_neuroPositions.push([...brainPosition]);

            // - Position 3 : Store the binary positions for each instance
            const binaryPosition = calculateBinaryPosition(i, numberOfColumns, thetaSpacing, ySpacing, cylinderRadius);
            position3_codePositions.push([...binaryPosition]);

            // - Position 4 : Store the half brain positions for each instance
            const halfBrainPosition = calculateHalfBrainPosition(brainPosition);
            position4_mlPositions.push([...halfBrainPosition]);

            // Set the color of the spheres
            const colorIndex = Math.floor( Math.random() * colors.length);
            mesh.setUniformAt('uColor', i , colors[colorIndex])

            // - Create tweens for each sphere

            // Random position -> Brain position
            tl.add(createTween(i, mesh, dummy, position2_neuroPositions, 'y'), 0.0)
            // Set the position of the dummy object to the brain position
            dummy.position.set(position2_neuroPositions[i][0], position2_neuroPositions[i][1], position2_neuroPositions[i][2]);

            // Brain position -> Binary position
            tl.add(createTween(i, mesh, dummy, position3_codePositions, 'x'), 1.0)
            // Set the position of the dummy object to the binary position
            dummy.position.set(position3_codePositions[i][0], position3_codePositions[i][1], position3_codePositions[i][2]);

            // Binary position -> Half brain position
            tl.add(createTween(i, mesh, dummy, position4_mlPositions, 'y'), 2.0)
            // Set the position of the dummy object to the half brain position
            dummy.position.set(position4_mlPositions[i][0], position4_mlPositions[i][1], position4_mlPositions[i][2]);

            // Data Visualization: Stretched out wave, spaced out spheres, almost like a 3d equalizer or something

        }

        // Add the mesh to the scene
        scene.add(mesh);
        // Set the reference to mesh
        instancedBrainRef.current = mesh;  // Set the reference to mesh

        // Y-Axis rotation during "Random position -> Brain position"
        const yRotateTween = gsap.to(instancedBrainRef.current.rotation, {
            y: "+=6.28319",  // This adds a full rotation in radians (360 degrees) on the y-axis
            repeat: -1,      // Repeat indefinitely
            duration: 20,     // Duration of one complete rotation;
            ease: "none",    // Linear rotation without any easing
        });

        // X-Axis rotation during "Brain position -> Binary position"
        const xRotateTween = gsap.to(instancedBrainRef.current.rotation, {
            x: "+=6.28319",  // This adds a full rotation in radians (360 degrees) on the x-axis
            repeat: -1,      // Repeat indefinitely
            duration: 20,     // Duration of one complete rotation;
            ease: "none",    // Linear rotation without any easing
            paused: true,    // Pause the tween until the yRotateTween is done
        });

        // Timeline rotation
        timelineRotate(instancedBrainRef.current.rotation, tl,
            'y',
            'x',
            yRotateTween,
            xRotateTween,
            1.65
        )
        timelineRotate(instancedBrainRef.current.rotation, tl,
            'x',
            'y',
            xRotateTween,
            yRotateTween,
            2.65
        )

        // Preload the GSAP timeline
        tl.progress(1).progress(0)

        // Updates GSAP timeline to wherever the user is scrolled to
        handleScroll();

        // Cleanup
        return () => {
            scene.remove(mesh);
            tl.kill();
            yRotateTween.kill();
            xRotateTween.kill();
        };
    }, []); // Empty dependency array to run only once on mount and unmount

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

    return null;
}

function ThreeJSBackground() {
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
        <div ref={containerRef} className="threejs-background">
            <Canvas camera={{position: [0, 0, 1.2], fov: 75, near: 0.1, far: 100}}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 10, 5]} />
                <RotatingBrain modelDirectory={'/static/brain.glb'} containerRef={containerRef} size={size}/>
            </Canvas>
        </div>
    );
}

export default ThreeJSBackground;
