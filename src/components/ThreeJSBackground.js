import './ThreeJSBackground.css';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useLoader, useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {Color, Object3D, ShaderMaterial, SphereGeometry, Vector3} from "three";
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

function timelineTransition(mesh, tl, propertiesFrom, propertiesTo, rotateFrom, rotateTo, time) {
    // Reset y rotation and pause yRotateTween after it's done
    tl.add(() => {
        createTransitionTween(mesh,
            propertiesFrom,
            () => {
                if (rotateFrom) {
                    rotateFrom.pause()
                }
                if (rotateTo) {
                    rotateTo.restart()
                    rotateTo.play()
                }
            })
    }, time)

    // Reset x rotation and pause xRotateTween after it's done
    tl.add(() => {
        createTransitionTween(mesh,
            propertiesTo,
            () => {
                if (rotateTo) {
                rotateTo.pause()
                }
                if (rotateFrom) {
                    rotateFrom.restart()
                    rotateFrom.play()
                }
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

function calculateBinaryPosition(i, numberOfColumns, thetaSpacing, ySpacing, cylinderRadius) {
    const column = i % numberOfColumns;
    const row = Math.floor(i / numberOfColumns);
    const theta = column * thetaSpacing;
    const y = cylinderRadius * Math.cos(theta);
    const x = row * ySpacing;
    const z = cylinderRadius * Math.sin(theta);
    return [x - 0.7, y, z];
}

function calculateSpherePosition(i, numSpheres) {
    // This assumes that you want to position `numSpheres` spheres on a larger sphere

    const scale = 0.8;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    // Calculate the inclination and azimuth for even distribution of points on a sphere
    const y = 1 - (i / (numSpheres - 1)) * 2; // y goes from 1 to -1
    const radius = Math.sqrt(1 - y * y); // radius at y position

    const phi = 2 * Math.PI * i / goldenRatio; // golden ratio distributes points evenly on a circle

    // Convert spherical coordinates to Cartesian coordinates
    const x = Math.cos(phi) * radius;
    const z = Math.sin(phi) * radius;

    return [x * scale, y * scale, z * scale];
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

    return [x, y - 0.5, z - 1.9];
}




function RotatingBrain({modelDirectory, containerRef, size}) {

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

        const dummies = [];
        for (let i = 0; i < mesh.count; i++) {

            const dummy = new Object3D()

            // - Position 1 : Store the initial random positions for each instance
            const randomPosition = [(Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5),];
            // - Setting up initial state of the mesh
            initialiseSphere(i, mesh, dummy, randomPosition)
            // Add the dummy object to the dummies array
            dummies.push(dummy);

            // - Position 2 : Store the brain positions for each instance
            const brainPosition = brain.geometry.attributes.position.array.slice(i * 3, (i * 3) + 3);
            position2_neuroPositions.push([...brainPosition]);

            // - Position 3 : Store the binary positions for each instance
            const binaryPosition = calculateBinaryPosition(i, numberOfColumns, thetaSpacing, ySpacing, cylinderRadius);
            position3_codePositions.push([...binaryPosition]);

            // - Position 4 : Store the sphere positions for each instance
            const spherePosition = calculateSpherePosition(i, mesh.count);
            position4_mlPositions.push([...spherePosition]);

            // - Position 5 : Store the data positions for each instance
            const dataPosition = calculateCircularPlanePosition(i, 40, 3);
            position5_dataPositions.push([...dataPosition]);

            // Set the color of the spheres
            const colorIndex = Math.floor( Math.random() * colors.length);
            mesh.setUniformAt('uColor', i , colors[colorIndex])

            // - Create tweens for each sphere

            // Start position -> Neuro position
            tl.add(createTween(i, mesh, dummy, position2_neuroPositions), 0.0)
            // Set the position of the dummy object to the brain position
            dummy.position.set(position2_neuroPositions[i][0], position2_neuroPositions[i][1], position2_neuroPositions[i][2]);

            // Neuro position -> Code position
            tl.add(createTween(i, mesh, dummy, position3_codePositions), 1.0)
            // Set the position of the dummy object to the binary position
            dummy.position.set(position3_codePositions[i][0], position3_codePositions[i][1], position3_codePositions[i][2]);

            // Code position -> ML position
            tl.add(createTween(i, mesh, dummy, position4_mlPositions), 2.0)
            // Set the position of the dummy object to the half brain position
            dummy.position.set(position4_mlPositions[i][0], position4_mlPositions[i][1], position4_mlPositions[i][2]);

            // ML position -> Data position
            tl.add(createTween(i, mesh, dummy, position5_dataPositions), 3.0)
            // Set the position of the dummy object to the data position
            dummy.position.set(position5_dataPositions[i][0], position5_dataPositions[i][1], position5_dataPositions[i][2]);

            // Data Visualization: Stretched out wave, spaced out spheres, almost like a 3d equalizer or something

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

        function updateWavePositions(mesh, dummies, basePositions, amplitude, frequency, time) {
            for (let i = 0; i < mesh.count; i++) {
                const dummy = dummies[i];
                const yWave = amplitude * Math.sin(frequency * i + time);
                const [x, y, z] = basePositions[i];
                dummy.position.set(x, y + yWave, z);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;
        }


        const waveTweenDuration = 20; // 2 seconds for a full wave cycle. Adjust as needed.
        const waveAmplitude = 5;  // Adjust to change the wave's height
        const waveFrequency = 0.05; // Adjust to change the wave's frequency

        let currentAmplitude = 0; // Starts at 0, representing no wave.

        const waveTween = gsap.to({}, {
            duration: waveTweenDuration,
            repeat: -1,
            ease: "none",
            paused: true,
            onStart: function() {
                // Create another tween to smoothly increase the wave amplitude.
                gsap.to({}, {
                    duration: 1.0,
                    ease: "sine.inOut",
                    onUpdate: function() {
                        currentAmplitude = waveAmplitude * this.progress();
                    }
                });
            },
            onUpdate: function() {
                updateWavePositions(
                    instancedBrainRef.current,
                    dummies,
                    position5_dataPositions,
                    currentAmplitude,
                    waveFrequency,
                    waveTweenDuration * 2 * Math.PI * this.progress()
                );
            },
        });



        // Change from y-axis rotation to x-axis rotation at 1.1 seconds
        timelineTransition(instancedBrainRef.current.rotation, tl,
            {'y': 0},
            {'x': 0},
            yRotateTween,
            xRotateTween,
            1.1
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

//            timelineTransition(instancedBrainRef.current, tl,
  //              {},
    //            {},
      //          null,
        //        waveTween,
          //      3.65
            //)


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
            waveTween.kill();
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
        <div ref={containerRef} className="threejs-background" style={{willChange:"contents"}}>
            <Canvas dpr={window.devicePixelRatio} camera={{position: [0, 0, 1.2], fov: 75, near: 0.1, far: 100}}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 10, 5]} />
                <RotatingBrain modelDirectory={'/static/brain.glb'} containerRef={containerRef} size={size}/>
            </Canvas>
        </div>
    );
}

export default ThreeJSBackground;
