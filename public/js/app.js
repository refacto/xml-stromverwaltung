async function createPdf() {
    console.log("PDF wird generiert...");
    try {
        const response = await fetch('/generatePdf');

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
    
    if (form) {
        const statusEl = document.getElementById('lieferanten-status');

        /* Removed real-time validation event listeners */
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const region = form.querySelector('[name="region"]').value.trim();
            const password = form.querySelector('[name="password"]').value.trim();
            const type = form.querySelector('[name="type"]').value.trim();
            const date = form.querySelector('[name="date"]').value.trim();
            const price = form.querySelector('[name="price"]').value.trim();

            if (!region || !password || !type || !date || !price) {
                if (statusEl) {
                    let missing = [];
                    if (!region) missing.push("Region");
                    if (!password) missing.push("Passwort");
                    if (!type) missing.push("Typ");
                    if (!date) missing.push("Datum");
                    if (!price) missing.push("Preis");
                    statusEl.textContent = 'Bitte füllen Sie folgende Felder aus: ' + missing.join(", ");
                    statusEl.style.color = 'red';
                }
                return;
            }

            const parts = [];
            parts.push(`<lieferant>`);
            parts.push(`<region>${escapeXmlText(region)}</region>`);
            parts.push(`<password>${escapeXmlText(password)}</password>`);
            parts.push(`<type>${escapeXmlText(type)}</type>`);
            parts.push(`<date>${escapeXmlText(date)}</date>`);
            parts.push(`<price>${escapeXmlText(price)}</price>`);
            parts.push(`</lieferant>`);

            const xml = parts.join('');

            if (statusEl) {
                statusEl.textContent = 'Saving...';
                statusEl.style.color = 'black';
            }

            try {
                const result = await submitSupplierXml(xml);
                if (result.ok) {
                    if (statusEl) {
                        statusEl.textContent = 'Saved successfully.';
                        statusEl.style.color = 'green';
                    }
                    form.reset();
                } else {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(result.text, "application/xml");
                    const message = xmlDoc.getElementsByTagName("message")[0]?.textContent || "Save failed";
                    const details = xmlDoc.getElementsByTagName("data")[0]?.textContent || "";
                    
                    if (statusEl) {
                        statusEl.textContent = `Save failed: ${message} ${details}`;
                        statusEl.style.color = 'red';
                    }
                    console.error('Supplier save failed:', result.text);
                }
            } catch (err) {
                if (statusEl) {
                    statusEl.textContent = 'Save failed. See console.';
                    statusEl.style.color = 'red';
                }
                console.error(err);
            }
        });
    }
}

function initKraftwerkePanel() {
    const panel = document.getElementById('daten-anzeige');
    if (!panel) return;

    let regions = null;

    async function ensureLoaded() {
        if (regions) return;
        const response = await fetch('/kraftwerke');
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'application/xhtml+xml');

        regions = {};
        doc.querySelectorAll('.region-detail').forEach(function(el) {
            regions[el.id] = el;
        });
    }

    window.addEventListener('message', async function(event) {
        if (typeof event.data !== 'string' || !event.data.startsWith('region-')) return;
        try {
            await ensureLoaded();
            const el = regions[event.data];
            if (!el) return;
            while (panel.firstChild) panel.removeChild(panel.firstChild);
            const clone = document.importNode(el, true);
            clone.style.display = 'block';
            panel.appendChild(clone);
        } catch (e) {
            console.error('Kraftwerke panel error:', e);
        }
    });
}

// Load the dashboard as soon as the page is ready
if (typeof window !== 'undefined' && window.document) {
    window.addEventListener('DOMContentLoaded', () => {
        initLieferantenForm();
        initKraftwerkePanel();
    });
}
