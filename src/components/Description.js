import React, { useEffect, useState } from 'react';
import { Carousel } from './Carousel';
import { motion } from "framer-motion"
import Tilt from 'react-parallax-tilt';
import './Description.css';

function Circle({i, onFinish, focus, setClickedIndex, color, circleRef}) {

    useEffect(() => {
        const circle = circleRef.current;
        if (circle) {
            // Set initial circle color
            circle.style.setProperty('--focus-color', `rgba${color}, 0.5)`);

            // Define event handlers
            const handleInteractionStart = () => {
                circle.style.setProperty('--focus-color', `rgba${color}, 1)`);
            };

            const handleInteractionEnd = () => {
                circle.style.setProperty('--focus-color', `rgba${color}, 0.5)`);
            };

            // Attach event listeners for mouse and touch
            circle.addEventListener('mouseenter', handleInteractionStart);
            circle.addEventListener('mouseleave', handleInteractionEnd);
            circle.addEventListener('touchstart', handleInteractionStart);
            circle.addEventListener('touchend', handleInteractionEnd);

            // Cleanup event listeners on component unmount or if circleRef changes
            return () => {
                circle.removeEventListener('mouseenter', handleInteractionStart);
                circle.removeEventListener('mouseleave', handleInteractionEnd);
                circle.removeEventListener('touchstart', handleInteractionStart);
                circle.removeEventListener('touchend', handleInteractionEnd);
            };
        }
    }, [i, color, circleRef]);

    const handleClick = () => {
        circleRef.current.style.setProperty('--focus-color', `rgb${color})`);
        circleRef.current.style.transform = 'scale(100)';
        circleRef.current.style.fontSize = '0px';
        circleRef.current.classList.add('expand')
        setTimeout(() => {
            onFinish(i + 2);
        }, 1000);  // Duration should match with CSS transition time
        setClickedIndex(i); // set clicked index
    }


    return (
        <div onClick={handleClick}
             className="focus-circle"
             ref={circleRef}>
            <Carousel lines={focus}/>
        </div>
    );
}

function Description(props) {
    let gyro = false;
    if (window.innerWidth < 500) {
        gyro = true;
    }

    const [clickedIndex, setClickedIndex] = useState(null);

    useEffect(() => {
        if (props.page === 1) {
            setClickedIndex(null)
        }
    }, [props.page])

    return (
        <div className="description-column">
            {props.descriptions.map((description, index) => (
                <motion.div key={index}
                            initial="hidden"
                            animate={clickedIndex === null ? "visible" : clickedIndex === index ? "visible" : "hidden"}
                            custom={index}>
                        <Tilt glareBorderRadius={'10px'} tiltEnable={!gyro} glarePosition={'all'} glareEnable={true} glareMaxOpacity={0.2} tiltMaxAngleX={10} tiltMaxAngleY={3} scale={1.03}>
                            <div className="description-item">
                                {(index !== 3)?
                                    <div className="dotted-line-p1">
                                        {(index % 2 === 0)? <div className="dotted-line-p2">
                                            <div className="dotted-line-p3"/>
                                        </div>: <div className="dotted-line-p2-reverse">
                                            <div className="dotted-line-p3-reverse"/>
                                        </div>}
                                    </div>: <div className="dotted-line-p1">
                                        <div className="circle-end"/>
                                    </div>}
                                {(index === 0)? <div className="dotted-line-p1-reverse">
                                    <div className="circle-start"/>
                                </div> : null}
                                <div className="description-text">
                                    <h3>{description.title}</h3>
                                    {description.subDescription.map((line, index) => (
                                        <p key={index}>{line}</p>
                                    ))}
                                </div>
                                <Circle i={index} onFinish={props.onFinish} focus={description.focus} color={props.colors[index]} setClickedIndex={setClickedIndex} circleRef={props.circleRefs[index]}/>
                            </div>
                        </Tilt>
                </motion.div>
            ))}
        </div>
    );
}

export default Description;
