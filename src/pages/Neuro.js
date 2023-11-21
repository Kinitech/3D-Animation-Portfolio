import React, { useState } from 'react';
import './Neuro.css';
import PDFDocument from "../components/PDFDocument";

function Neuro() {
    // State to track which document is currently active
    const [activeDocument, setActiveDocument] = useState(1);

    return (
        <>
            <div className='neuro-header'>
                <h1>Research Projects</h1>
            </div>
            <div className="document-grid">
                <div className={`item1 ${activeDocument === 1 ? 'active' : ''}`}>
                    <PDFDocument filename={'./static/Jarrett - Pain Capacity 2023 Dissertation.pdf'}/>
                </div>
                <div className={`item2 ${activeDocument === 2 ? 'active' : ''}`}>
                    <PDFDocument filename={"./static/Jarrett - Huntington's Therapies 2023 Dissertation.pdf"}/>
                </div>
            </div>
            <div className="buttons">
                <button className="button" onClick={() => setActiveDocument(1)}>1</button>
                <button className="button" onClick={() => setActiveDocument(2)}>2</button>
            </div>
        </>
    );
}

export default Neuro;
