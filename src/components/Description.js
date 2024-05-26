import React, {useEffect, useState} from 'react';
import { Carousel } from './Carousel';
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

const TiltCard = ({index, props, description, setClickedIndex, mobile}) => {
    return (
        <Tilt className='description-item' glareBorderRadius={'10px'} tiltEnable={!mobile} glarePosition={'all'} glareEnable={true} glareMaxOpacity={0.2} tiltMaxAngleX={10} tiltMaxAngleY={3} scale={1.03}>
            {index % 2 !== 0 && <Circle i={index} onFinish={props.onFinish} focus={description.focus} color={props.colors[index]} setClickedIndex={setClickedIndex} circleRef={props.circleRefs[index]}/>}
            <div className="description-text">
                    <h3>{description.title}</h3>
                    {description.subDescription.map((line, index) => (
                        <p key={index}>{line}</p>
                    ))}
                </div>
            {index % 2 === 0 && <Circle i={index} onFinish={props.onFinish} focus={description.focus} color={props.colors[index]} setClickedIndex={setClickedIndex} circleRef={props.circleRefs[index]}/>}
        </Tilt>
        )
}

const ContactCard = ({index, title, subtitle, mobile}) => {
    return (
        <a className='contact-link' href="mailto:byronjarrett14@gmail.com">
            <Tilt className='description-item description-end' glareBorderRadius={'10px'} tiltEnable={!mobile} glarePosition={'all'} glareEnable={true} glareMaxOpacity={0.2} tiltMaxAngleX={10} tiltMaxAngleY={3} scale={1.03}>
                    <div className="description-text">
                        <p>{title}</p>
                        <p key={index}>{subtitle}</p>
                    </div>
            </Tilt>
        </a>
    )
}

const DottedLineTrail = ({index, children, clickedIndex}) => {

    return (
    <>
        {index === 0 &&
            <div className="dotted-line">
                <div className="circle-start"/>
                <div className="dotted-line-p1"/>
            </div>}

        <div style={{opacity:clickedIndex !== index && clickedIndex !== null ? 0 : 1, transition: `opacity ${clickedIndex !== index && clickedIndex !== null ? '0.25s' : '2s'} ease-in-out`}}>
            {children}
            <div style={{opacity: clickedIndex !== null ? 0 : 1, transition: `opacity ${clickedIndex !== null ? '0.25s' : '2s'} ease-in-out`}}>
            {(index !== 3)?
                <div className="dotted-line">
                    <div className="dotted-line-p1"/>
                    {(index % 2 === 0)? <div className="dotted-line-p2"/>: <div className="dotted-line-p2-reverse"/>}
                    <div className="dotted-line-p1"/>
                </div>
                :
                <div className="dotted-line">
                    <div className="dotted-line-p1"/>
                </div>
            }
            </div>
        </div>
    </>
    )
}

function Description(props) {
    let mobile = false;
    if (window.innerWidth < 500) {
        mobile = true;
    }

    const [clickedIndex, setClickedIndex] = useState(null);

    useEffect(() => {
        console.log('clicked circle', clickedIndex)
    }, [clickedIndex])

    useEffect(() => {
        console.log('page', props.page)
        if (props.page === 1) {
            setClickedIndex(null);
        }
    }, [props.page])

    return (
        <div className="description-column">
            {props.descriptions.map((description, index) => (
                <DottedLineTrail key={index} index={index} clickedIndex={clickedIndex}>
                    <TiltCard index={index} props={props} description={description} setClickedIndex={setClickedIndex} mobile={mobile}/>
                </DottedLineTrail>

            ))}
            <ContactCard title='Contact me'/>
            <div className="dotted-line">
                <div className="dotted-line-p1"/>
                <div className="circle-start"/>
            </div>
            <div className="blank-space"/>
        </div>
    );
}

export default Description;
