import './ThreeJSMesh.css';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useLoader, useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {Color, Object3D, ShaderMaterial, SphereGeometry, Vector3} from "three";
import {InstancedUniformsMesh} from 'three-instanced-uniforms-mesh'
import {gsap} from 'gsap'
import {throttle} from "lodash";
import WireframeBackground from "./WireframeBackground";

function createTween(i, mesh, dummy, targetPosition, properties={duration:1.0}) {
    return gsap.fromTo(dummy.position, {
        x: dummy.position.x,
        y: dummy.position.y,
        z: dummy.position.z,
    }, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        ...properties,
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
    const brainScale = 1.3;
    return new Vector3(brainPosition[0] * brainScale, brainPosition[1] * brainScale, brainPosition[2] * brainScale);
}

function calculateCylinderPosition(i, numberOfColumns, thetaSpacing, ySpacing, cylinderRadius) {
    const column = i % numberOfColumns;
    const row = Math.floor(i / numberOfColumns);
    const theta = column * (thetaSpacing);
    const y = cylinderRadius * Math.cos(theta);
    const x = row * ySpacing;
    const z = cylinderRadius * Math.sin(theta);
    return new Vector3(x - 2.105, y, z);
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

function calculateCircleOfSpheres(i, numPoints) {
    const numOfSpheres = 5; // The total number of spheres in the circle
    const numOfPointsPerSphere = numPoints / numOfSpheres; // Points per sphere
    const sphereIndex = Math.floor(i / numOfPointsPerSphere); // Current sphere index
    const positionInSphere = i % numOfPointsPerSphere; // Position index within the sphere

    // Assuming we want to place these spheres in a circle with a given radius
    const circleRadius = 1;
    const thetaSpacing = (2 * Math.PI) / numOfSpheres; // Full circle divided by the number of spheres
    const theta = sphereIndex * thetaSpacing; // The angle for this sphere on the circle

    // Calculate center position of each sphere on the circle
    const centerX = Math.cos(theta) * circleRadius;
    const centerZ = Math.sin(theta) * circleRadius;

    // Now calculate the position of this point on the sphere using calculateSpherePosition
    const sphereScale = 0.5; // Scale of each individual sphere
    const spherePoint = calculateSpherePosition(positionInSphere, numOfPointsPerSphere, sphereScale);

    // Adjust the spherePoint by the position of the sphere center to place it correctly
    spherePoint.x += centerX;
    // spherePoint.y is the same, as we are creating a horizontal circle of spheres
    spherePoint.z += centerZ

    return spherePoint;
}

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
    const point = useMemo(() => new Vector3(), []);
    const tl = useMemo(() => gsap.timeline({paused: true}), []);

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

        // Position 3 Variables

        const numberOfColumns = 100;
        const cylinderRadius = 0.8  // You can adjust this to increase or decrease the cylinder's radius.
        const thetaSpacing = (2 * Math.PI) / numberOfColumns;  // Angle spacing for the columns.
        const ySpacing = 0.15;  // Vertical spacing for the rows.

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
            // Start position -> Neuro position
            tl.add(createTween(i, mesh, dummy, brainPosition), 0.0)
            // Set the position of the dummy object to the brain position
            setDummy(dummy, brainPosition);


            // - Position 3 : Store the binary positions for each instance
            const cylinderPosition = calculateCylinderPosition(i, numberOfColumns, thetaSpacing, ySpacing, cylinderRadius);
            // Neuro position -> Code position
            tl.add(createTween(i, mesh, dummy, cylinderPosition), 1.0)
            // Set the position of the dummy object to the binary position
            setDummy(dummy, cylinderPosition);


            // - Position 4 : Store the sphere positions for each instance
            const spherePosition = calculateSpherePosition(i, mesh.count, 0.8);
            // Code position -> ML position
            tl.add(createTween(i, mesh, dummy, spherePosition), 2.0)
            // Set the position of the dummy object to the half brain position
            setDummy(dummy, spherePosition);


            // - Position 5 : Store the data positions for each instance
            const dataPosition = calculateCircleOfSpheres(i, mesh.count);
            // ML position -> Data position
            tl.add(createTween(i, mesh, dummy, dataPosition), 3.0)
            // Set the position of the dummy object to the data position
            setDummy(dummy, dataPosition);


            // Set the color of the spheres
            const colorIndex = Math.floor( Math.random() * colors.length);
            mesh.setUniformAt('uColor', i , colors[colorIndex])

        }

        // Add the mesh to the scene
        scene.add(mesh);
        // Set the reference to mesh
        instancedBrainRef.current = mesh;  // Set the reference to mesh
        // Set the scale of the mesh on mount
        mesh.scale.set(size, size, size);

        // Y-Axis rotation during "Random position -> Brain position"
        const yRotateTween = gsap.to(mesh.rotation, {
            y: "+=6.28319",  // This adds a full rotation in radians (360 degrees) on the y-axis
            repeat: -1,      // Repeat indefinitely
            duration: 40,     // Duration of one complete rotation;
            ease: "none",    // Linear rotation without any easing
        });

        // X-Axis rotation during "Brain position -> Binary position"
        const xRotateTween = gsap.to(mesh.rotation, {
            x: "+=6.28319",  // This adds a full rotation in radians (360 degrees) on the x-axis
            repeat: -1,      // Repeat indefinitely
            duration: 40,     // Duration of one complete rotation;
            ease: "none",    // Linear rotation without any easing
            paused: true,    // Pause the tween until the yRotateTween is done
        });



        // Change from y-axis rotation to x-axis rotation at 1.1 seconds
        timelineTransition(mesh.rotation, tl,
            {'y': 0},
            {'x': 0},
            yRotateTween,
            xRotateTween,
            1.5
        )
        // Change from x-axis rotation to y-axis rotation at 2.65 seconds
        timelineTransition(mesh.rotation, tl,
            {'x': 0},
            {'y': 0},
            xRotateTween,
            yRotateTween,
            2.65
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array to run only once on mount and unmount

    const handleScroll = useCallback(() => {
        const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        tl.progress((scrolled / totalScrollHeight));
    }, [tl]);

    useEffect(() => {
        const throttledHandleScroll = throttle(handleScroll, 5);
        window.addEventListener('scroll', throttledHandleScroll);
        return () => {
            window.removeEventListener('scroll', throttledHandleScroll);
        };
    }, [handleScroll]);

    const animateHoverUniform = useCallback((value) => {
        gsap.to(uniforms, {
            uHover: value,
            duration: 0.25,
            onUpdate: () => {
                for (let i = 0; i < instancedBrainRef.current.count; i++) {
                    instancedBrainRef.current.setUniformAt('uHover', i, uniforms.uHover)
                }
            }
        });
    }, [uniforms, instancedBrainRef]); // Include all dependencies that are used inside the callback

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
    }, [point, isHovered, containerRef, animateHoverUniform]);



    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove, {passive: true});

        // Cleanup
        return () => {
            document.removeEventListener('mousemove', handleMouseMove, {passive: true})
        };
    }, [handleMouseMove]);

    return null;
}

function ThreeJSMesh({setLoaded}) {
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
    const minSize = 0.55;
    const minSizeWidth = 450;
    const handleResize = () => {
        const newSize = minSize * window.innerWidth / minSizeWidth
        if (newSize < minSize) {
            setSize(minSize);
        } else if (newSize < maxSize) {
            setSize(newSize);
        } else {
            setSize(maxSize);
        }
    };

    const cameraFov = 75;

    return (
        <div ref={containerRef} className="threejs-background">
            <Canvas dpr={window.devicePixelRatio} camera={{position: [0, 0, 1.2], fov: cameraFov, near: 0.1, far: 100}}>
                <WireframeBackground cameraFov={cameraFov} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 10, 5]} />
                <RotatingMesh modelDirectory={'./static/brain.glb'} containerRef={containerRef} size={size} setLoaded={setLoaded}/>
            </Canvas>
        </div>
    );
}

export default ThreeJSMesh;
