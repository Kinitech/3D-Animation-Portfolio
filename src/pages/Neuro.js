import './Neuro.css'
import PDFDocument from "../components/PDFDocument";

function Neuro() {
    return (
        <>
            <div className='neuro-header'>
                <h1>Research Projects</h1>
            </div>
            <div className="document-grid">
                <div className="item1">
                    <PDFDocument filename={'./static/Byron - Pain Capacity 2023 Dissertation.pdf'}/>
                </div>
            </div>
        </>
    );
}

export default Neuro;
