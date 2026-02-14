async function loadXMLDoc(filename) {
    const response = await fetch(filename);
    const text = await response.text();
    return new DOMParser().parseFromString(text, "application/xml");
}

async function createPdf() {
    console.log("PDF wird generiert...");
    try {
        // Load data and stylesheet
        const dbXml = await loadXMLDoc('../data/database.xml');
        const xslFo = await loadXMLDoc('xsl/fo.xsl');

        // Initialize XSLT Processor
        const xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xslFo);

        // Transform database XML to FO (which is also XML)
        const resultDoc = xsltProcessor.transformToDocument(dbXml);
        const serializer = new XMLSerializer();
        const foString = serializer.serializeToString(resultDoc);

        // Send FO string to server
        const response = await fetch('/convertToPdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml'
            },
            body: foString
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
            link.href = url;
            link.download = 'EnerCheck_Report.pdf';
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } else {
            console.error('PDF konnte nicht generiert werden: ', await response.text());
            alert('Das PDF konnte nicht generiert werden, siehe Konsole für Details. Sind sie mit dem HSLU-Netz verbunden?');
        }
    } catch (error) {
        console.error('Fehler während der PDF-Generation: ', error);
        alert('Ein Fehler entstand während der Generation des PDFs.');
    }
}
