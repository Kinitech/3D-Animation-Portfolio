import React from 'react';
import { motion } from "framer-motion"
import './Page.css';

function Page({i, color, onBack, children}) {
    const variants = {
        initial: {
            opacity: 0,
        },
        enter: {
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "easeIn",
                type: "spring",
                stiffness: 100
            },
        }
    }

    return (
        <div className="page" style={{backgroundColor: `rgb${color})`}}>
            <motion.div initial="initial"
                        animate="enter"
                        variants={variants}>
                {children}
            </motion.div>
            <button className="page-exit-button" onClick={() => {onBack(i)}}>
                &#9166;
            </button>
        </div>
    );
}

export default Page;
