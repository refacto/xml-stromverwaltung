async function loadXMLDoc(filename) {
    const response = await fetch(filename);
    const text = await response.text();
    return new DOMParser().parseFromString(text, "application/xml");
}

// Render the database XML into XHTML using XSLT and inject into the page
async function renderDashboard() {
    try {
        const dbXml = await loadXMLDoc('/data/database.xml');
        const xsl = await loadXMLDoc('xsl/dashboard.xsl');

        const xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xsl);

        const fragment = xsltProcessor.transformToFragment(dbXml, document);

        const mount = document.getElementById('dashboard-mount');
        if (!mount) {
            console.warn('No #dashboard-mount element found.');
            return;
        }

        mount.innerHTML = '';
        mount.appendChild(fragment);
    } catch (error) {
        console.error('Error rendering dashboard:', error);
        const mount = document.getElementById('dashboard-mount');
        if (mount) mount.textContent = 'Failed to render dashboard. See console.';
    }
}

async function createPdf() {
    console.log("Generating PDF...");
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
            console.error('Failed to generate PDF', await response.text());
            alert('PDF generation failed. See console for details.');
        }
    } catch (error) {
        console.error('Error during PDF creation:', error);
        alert('An error occurred during PDF creation.');
    }
}

// Load the dashboard as soon as the page is ready
window.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
});
