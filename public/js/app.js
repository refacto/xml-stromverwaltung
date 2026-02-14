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

async function submitSupplierXml(xmlString) {
    const response = await fetch('/lieferanten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlString
    });

    const text = await response.text();
    return { ok: response.ok, status: response.status, text };
}

function escapeXmlText(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

function initLieferantenForm() {
    const form = document.getElementById('lieferanten-form');
    if (!form) return;

    const statusEl = document.getElementById('lieferanten-status');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = form.querySelector('[name="id"]').value.trim();
        const name = form.querySelector('[name="name"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const phone = form.querySelector('[name="phone"]').value.trim();
        const type = form.querySelector('[name="type"]').value.trim();

        const parts = [];
        parts.push(`<lieferant id="${escapeXmlText(id)}">`);
        parts.push(`<name>${escapeXmlText(name)}</name>`);
        if (email) parts.push(`<email>${escapeXmlText(email)}</email>`);
        if (phone) parts.push(`<phone>${escapeXmlText(phone)}</phone>`);
        if (type) parts.push(`<type>${escapeXmlText(type)}</type>`);
        parts.push(`</lieferant>`);

        const xml = parts.join('');

        if (statusEl) statusEl.textContent = 'Saving...';

        try {
            const result = await submitSupplierXml(xml);
            if (result.ok) {
                if (statusEl) statusEl.textContent = 'Saved successfully.';
                form.reset();
            } else {
                if (statusEl) statusEl.textContent = `Save failed (${result.status}). See console.`;
                console.error('Supplier save failed:', result.text);
            }
        } catch (err) {
            if (statusEl) statusEl.textContent = 'Save failed. See console.';
            console.error(err);
        }
    });
}

// Load the dashboard as soon as the page is ready
window.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    initLieferantenForm();
});
