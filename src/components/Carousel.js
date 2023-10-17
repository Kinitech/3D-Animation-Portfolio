import React, { useState, useEffect } from 'react';

export const Carousel = ({ lines }) => {
    const [angle, setAngle] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setAngle(prevAngle => prevAngle + 0.5);
        }, 20);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="carousel"
            style={{ transform: `rotate(${angle}deg)` }}
        >
            {lines.map((line, index) => {
                const lineAngle = index * (360 / lines.length);
                return (
                    <div
                        key={index}
                        style={{
                            transform: `
                                rotate(${lineAngle}deg)
                                translate(3em)
                                rotate(${-angle - lineAngle}deg)
                            `
                        }}
                    >
                        {line}
                    </div>
                );
            })}
        </div>
    );
}
