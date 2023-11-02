import './ThreeJSBackground.css';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useLoader, useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {Color, Object3D, ShaderMaterial, SphereGeometry, Vector3} from "three";
import {InstancedUniformsMesh} from 'three-instanced-uniforms-mesh'
import {gsap} from 'gsap'
import {throttle} from "lodash";

function createTween(i, mesh, dummy, targetPosition, duration=1.0, paused=false) {
    return gsap.fromTo(dummy.position, {
        x: dummy.position.x,
        y: dummy.position.y,
        z: dummy.position.z,
    }, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: duration,
        paused: paused,
        onUpdate: () => {
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            mesh.instanceMatrix.needsUpdate = true;
        }
    });
}

function createTransitionTween(mesh, properties, onComplete) {
    return gsap.to(mesh, {
        ...properties,
        duration: 1.0,  // You can adjust the duration as needed
        ease: "sine.inOut",
        onComplete: () => {
            onComplete();
        }
    });
}

function timelineTransition(mesh, tl, propertiesFrom, propertiesTo, tweenFrom, tweenTo, time) {
    // Reset y rotation and pause yRotateTween after it's done
    tl.add(() => {
        createTransitionTween(mesh,
            propertiesFrom,
            () => {
                if (tweenFrom) {
                    tweenFrom.pause()
                }
                if (tweenTo) {
                    tweenTo.restart()
                    tweenTo.play()
                }
            })
    }, time)

    // Reset x rotation and pause xRotateTween after it's done
    tl.add(() => {
        createTransitionTween(mesh,
            propertiesTo,
            () => {
                if (tweenTo) {
                    tweenTo.pause()
                }
                if (tweenFrom) {
                    tweenFrom.restart()
                    tweenFrom.play()
                }
            })
    }, time - 0.00001);

}

function initialiseSphere(i, mesh, dummy, initialPosition) {
    // Set the random position of the dummy object
    dummy.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
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

function calculateCubePosition(i, edgeLength, numPointsPerEdge) {
    // Calculate the spacing between nodes based on the edge length and number of points per edge
    const spacing = edgeLength / (numPointsPerEdge - 1);

    // Determine the x, y, z position based on the index i
    const zLayer = Math.floor(i / (numPointsPerEdge * numPointsPerEdge));
    const remaining = i - zLayer * numPointsPerEdge * numPointsPerEdge;
    const yRow = Math.floor(remaining / numPointsPerEdge);
    const xColumn = remaining % numPointsPerEdge;

    const x = xColumn * spacing;
    const y = yRow * spacing;
    const z = zLayer * spacing;

    // Center the cube around the origin for better visualization
    const offset = edgeLength / 2;

    return new Vector3(x - offset, y - offset, z - offset);
}

function calculateBrainPosition(i, brain) {
    const brainPosition = brain.geometry.attributes.position.array.slice(i * 3, (i * 3) + 3);
    const brainScale = 1.20;
    return new Vector3(brainPosition[0] * brainScale, brainPosition[1] * brainScale, brainPosition[2] * brainScale);
}

function calculateBinaryPosition(i, numberOfColumns, thetaSpacing, ySpacing, cylinderRadius) {
    const column = i % numberOfColumns;
    const row = Math.floor(i / numberOfColumns);
    const theta = column * thetaSpacing;
    const y = cylinderRadius * Math.cos(theta);
    const x = row * ySpacing;
    const z = cylinderRadius * Math.sin(theta);
    return new Vector3(x - 0.7, y, z);
}

function calculateSpherePosition(i, numPoints, scale) {
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    // Calculate the inclination and azimuth for even distribution of points on a sphere
    const y = 1 - (i / (numPoints - 1)) * 2; // y goes from 1 to -1
    const radius = Math.sqrt(1 - y * y); // radius at y position
    const phi = 2 * Math.PI * i / goldenRatio; // golden ratio distributes points evenly on a circle
    // Convert spherical coordinates to Cartesian coordinates
    const x = Math.cos(phi) * radius;
    const z = Math.sin(phi) * radius;
    return new Vector3(x * scale, y * scale, z * scale);
}

function calculateCircularPlanePosition(i, maxRings, radius) {
    let totalPoints = 0;
    let ring = 0;
    let pointsOnThisRing = 0;

    // Calculate which ring the point should be on
    for (let r = 1; r <= maxRings; r++) {
        const pointsOnRing = Math.floor(2 * Math.PI * r);
        if (i < totalPoints + pointsOnRing) {
            ring = r;
            pointsOnThisRing = pointsOnRing;
            break;
        }
        totalPoints += pointsOnRing;
    }

    const angleIncrement = 2 * Math.PI / pointsOnThisRing;
    const angle = (i - totalPoints) * angleIncrement;
    const x = ring * (radius / maxRings) * Math.cos(angle);
    const z = ring * (radius / maxRings) * Math.sin(angle);

    const y = 0;

    return new Vector3(x, y - 0.5, z - 1.9);
}

/*
function calculateGradientYOffset(point, centerPoint, maxRise, radius) {
    const dx = point.x - centerPoint.x;
    const dz = point.z - centerPoint.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // This is the parabolic function to create a dome shape
    const yOffset = maxRise * (1 - (distance / radius) ** 2);

    return yOffset > 0 ? yOffset : 0; // Ensure it doesn't go negative
}

function calculateGradient(point, randomPoint) {

    const yOffset = calculateGradientYOffset(point, randomPoint, 0.5, 1);
    point.y += yOffset;

    return point;
}
*/

function setDummy(dummy, position) {
    dummy.position.set(position.x, position.y, position.z);
}

function calculateRandomPosition() {
    let randomAxis = Math.floor(Math.random() * 3); // 0 for x, 1 for y, 2 for z
    let randomPosition = new Vector3();

    for (let j = 0; j < 3; j++) {
        if (j === randomAxis) {
            randomPosition.setComponent(j,
                (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 0.5 + 0.5)
            );
        } else {
            randomPosition.setComponent(j, Math.random() * 2 - 1);
        }
    }
    return randomPosition;
}

function RotatingMesh({modelDirectory, containerRef, size, setLoaded}) {

    const instancedBrainRef = useRef();
    const gltf = useLoader(GLTFLoader, modelDirectory);
    const brain = gltf.scene.children[0];

    const [uniforms] = useState({uHover: 0});

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
    }, [size]);

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

            // - Position 1 : Store the initial positions for each instance (cube or random)
            if (i < 14 * 14 * 14) {
                const cubePosition = calculateCubePosition(i, 1, 14);
                initialiseSphere(i, mesh, dummy, cubePosition);
            } else {
                const randomPosition = calculateRandomPosition();
                initialiseSphere(i, mesh, dummy, randomPosition);
            }

            // - Position 2 : Store the brain positions for each instance
            const brainPosition = calculateBrainPosition(i, brain);
            position2_neuroPositions.push(brainPosition);

            // - Position 3 : Store the binary positions for each instance
            const binaryPosition = calculateBinaryPosition(i, numberOfColumns, thetaSpacing, ySpacing, cylinderRadius);
            position3_codePositions.push(binaryPosition);

            // - Position 4 : Store the sphere positions for each instance
            const spherePosition = calculateSpherePosition(i, mesh.count, 0.8);
            position4_mlPositions.push(spherePosition);

            // - Position 5 : Store the data positions for each instance
            const dataPosition = calculateCircularPlanePosition(i, 40, 3);
            position5_dataPositions.push(dataPosition);

            // Set the color of the spheres
            const colorIndex = Math.floor( Math.random() * colors.length);
            mesh.setUniformAt('uColor', i , colors[colorIndex])

            // - Create tween for each instance

            // Start position -> Neuro position
            tl.add(createTween(i, mesh, dummy, position2_neuroPositions[i]), 0.0)
            // Set the position of the dummy object to the brain position
            setDummy(dummy, position2_neuroPositions[i]);

            // Neuro position -> Code position
            tl.add(createTween(i, mesh, dummy, position3_codePositions[i]), 1.0)
            // Set the position of the dummy object to the binary position
            setDummy(dummy, position3_codePositions[i]);

            // Code position -> ML position
            tl.add(createTween(i, mesh, dummy, position4_mlPositions[i]), 2.0)
            // Set the position of the dummy object to the half brain position
            setDummy(dummy, position4_mlPositions[i]);

            // ML position -> Data position
            tl.add(createTween(i, mesh, dummy, position5_dataPositions[i]), 3.0)

        }

        // Add the mesh to the scene
        scene.add(mesh);
        // Set the reference to mesh
        instancedBrainRef.current = mesh;  // Set the reference to mesh
        // Set the scale of the mesh on mount
        instancedBrainRef.current.scale.set(size, size, size);

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

        let frequency = 2;
        let amplitude = 0.5;
        let waveSpeed = 1.0;

        const updateRippleEffect = () => {
            const timeElapsed = (performance.now() / 1000);

            for (let i = 0; i < instancedBrainRef.current.count; i++) {
                const dummy = new Object3D()
                instancedBrainRef.current.getMatrixAt(i, dummy.matrix);
                const position = new Vector3().setFromMatrixPosition(dummy.matrix);
                initialiseSphere(i, mesh, dummy, position)
                // Calculate a sine wave based on the position of the instance
                const yOffset = Math.sin(position.x * frequency + timeElapsed * waveSpeed) * amplitude;
                position.y += yOffset;
                dummy.matrix.setPosition(position);
                instancedBrainRef.current.setMatrixAt(i, dummy.matrix);
            }

            instancedBrainRef.current.instanceMatrix.needsUpdate = true;
        };


        const newTween = gsap.to(instancedBrainRef.current, {
            paused:true,
            duration: 5, // Adjust this for the ripple effect's duration
            repeat: -1, // Keep the ripple effect repeating indefinitely
            yoyo: true, // Make the animation play forwards and then backwards, creating a seamless loop
            ease: "sine.inOut", // A sine-based ease will make the ripple more water-like
            onUpdate: function() {
                updateRippleEffect()
            }
        });

        // Change from y-axis rotation to x-axis rotation at 1.1 seconds
        timelineTransition(instancedBrainRef.current.rotation, tl,
            {'y': 0},
            {'x': 0},
            yRotateTween,
            xRotateTween,
            1.5
        )
        // Change from x-axis rotation to y-axis rotation at 2.65 seconds
        timelineTransition(instancedBrainRef.current.rotation, tl,
            {'x': 0},
            {'y': 0},
            xRotateTween,
            yRotateTween,
            2.65
        )
        // Change from y-axis rotation to no rotation at 3.65 seconds
        timelineTransition(instancedBrainRef.current.rotation, tl,
            {'y': 0},
            {'x': 0},
            yRotateTween,
            null,
            3.65
        )

        // Preload the GSAP timeline
        tl.progress(1).progress(0)

        // Updates GSAP timeline to wherever the user is scrolled to
        handleScroll();

        // Set loaded to true
        setLoaded(true);

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
        document.addEventListener('mousemove', handleMouseMove, {passive: true});

        // Cleanup
        return () => {
            document.removeEventListener('mousemove', handleMouseMove, {passive: true})
        };
    }, []);

    return null;
}

function ThreeJSBackground({setLoaded}) {
    const containerRef = useRef();
    const [size, setSize] = useState(1.2);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, []); // Empty dependency array to run only once on mount and unmount

    const maxSize = 0.9;
    const minSize = 0.65;
    const minSizeWidth = 600;
    const handleResize = () => {
        const newSize = minSize * window.innerWidth / minSizeWidth
        if (newSize < maxSize) {
            setSize(newSize);
        } else {
            setSize(maxSize);
        }
    };

    return (
        <div ref={containerRef} className="threejs-background" style={{willChange:"contents"}}>
            <Canvas dpr={window.devicePixelRatio} camera={{position: [0, 0, 1.2], fov: 75, near: 0.1, far: 100}}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 10, 5]} />
                <RotatingMesh modelDirectory={'/static/brain.glb'} containerRef={containerRef} size={size} setLoaded={setLoaded}/>
            </Canvas>
        </div>
    );
}

export default ThreeJSBackground;
