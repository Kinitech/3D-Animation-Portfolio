import React, { useState } from 'react';
import './Neuro.css';
import { Worker } from '@react-pdf-viewer/core';
// Import the main component
import { Viewer } from '@react-pdf-viewer/core';
// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css';

function Neuro() {
    const [activeDocument, setActiveDocument] = useState(1);

    const renderButtonContent = (docNumber) => {
        return activeDocument === docNumber ? <b>{docNumber}</b> : docNumber;
    };

    return (
        <>
            <div className='neuro-header'>
                <h1>Research Projects</h1>
            </div>
            <div className="document-grid">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                    <div className={`item1 ${activeDocument === 1 ? 'active' : ''}`}>
                        <Viewer fileUrl={'./static/Jarrett - Pain Capacity 2023 Dissertation.pdf'}/>
                    </div>
                    <div className={`item2 ${activeDocument === 2 ? 'active' : ''}`}>
                        <Viewer fileUrl={"./static/Jarrett - Huntington's Therapies 2023 Dissertation.pdf"}/>
                    </div>
                </Worker>
            </div>
            <div className="buttons">
                <div className="button" onClick={() => setActiveDocument(1)}>
                    {renderButtonContent(1)}
                </div>
                <div className="button" onClick={() => setActiveDocument(2)}>
                    {renderButtonContent(2)}
                </div>
            </div>
        </>
    );
}

export default Neuro;
