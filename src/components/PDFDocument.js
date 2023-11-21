
function PDFDocument({filename}) {
    return (
            <iframe title={filename} src={filename} width="100%" height="100%"/>
    );
}

export default PDFDocument;
