
function PDFDocument({filename}) {
    const url = 'https://byron.page/' + filename.split('./')[1]
    const source = `https://docs.google.com/gview?url=${url}&embedded=true`
    return (
            <iframe title={filename} src={source} width="100%" height="100%"/>
    );
}

export default PDFDocument;
