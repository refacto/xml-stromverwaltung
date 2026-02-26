async function loadXMLDoc(filename) {
    const response = await fetch(filename);
    const text = await response.text();
    return new DOMParser().parseFromString(text, "application/xml");
}

async function createPdf() {
    console.log("PDF wird generiert...");
    try {
        const dbXml = await loadXMLDoc('../data/database.xml');
        const xslFo = await loadXMLDoc('xsl/fo.xsl');
        const xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xslFo);
        const resultDoc = xsltProcessor.transformToDocument(dbXml);
        const foString = new XMLSerializer().serializeToString(resultDoc);

        const response = await fetch('/convertToPdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
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

function initLieferantenForm() {
    const form = document.getElementById('lieferanten-form');
    if (!form) return;
    const statusEl = document.getElementById('lieferanten-status');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (statusEl) { statusEl.textContent = 'Saving...'; statusEl.style.color = 'black'; }
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new URLSearchParams(new FormData(form))
            });
            const xml = new DOMParser().parseFromString(await response.text(), "application/xml");
            const message = xml.getElementsByTagName("message")[0]?.textContent || "Save failed";
            if (response.ok) {
                if (statusEl) { statusEl.textContent = 'Saved successfully.'; statusEl.style.color = 'green'; }
                form.reset();
            } else if (statusEl) {
                statusEl.textContent = `Save failed: ${message}`;
                statusEl.style.color = 'red';
            }
        } catch (err) {
            if (statusEl) { statusEl.textContent = 'Save failed. See console.'; statusEl.style.color = 'red'; }
            console.error(err);
        }
    });
}

window.addEventListener('DOMContentLoaded', initLieferantenForm);
