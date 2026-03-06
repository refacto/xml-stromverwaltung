import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import xpath from 'xpath';
import { validateXML } from 'xmllint-wasm';
import { Xslt, XmlParser } from 'xslt-processor';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.ENER_CHECK_PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

app.use(express.text({ type: ['application/xml', 'text/plain', 'text/xml'], limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

const sendXmlResponse = (res, status, message, data = null) => {
    res.set('Content-Type', 'application/xml');
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  <status>${status}</status>\n  <message>${message}</message>`;
    if (data) {
        xml += `\n  <data>${data}</data>`;
    }
    xml += '\n</response>';
    res.status(status).send(xml);
};

const parseValidationErrors = (validationResult) => {
    let errorMsg = 'Validation failed';
    const errors = validationResult.errors;

    if (errors.some(e => e.message.includes('password') && (e.message.includes('length') || e.message.includes('facet')))) {
        errorMsg = 'Passwort inkorrekt';
    } else if (errors.some(e => e.message.includes('is not a valid value of the atomic type'))) {
         const fieldMatch = errors.find(e => e.message.includes('is not a valid value of the atomic type'));
         if (fieldMatch) {
             errorMsg = `Validation failed: ${fieldMatch.message}`;
         }
    } else if (errors.some(e => e.message.includes('is missing'))) {
         const fieldMatch = errors.find(e => e.message.includes('is missing'));
         errorMsg = fieldMatch ? fieldMatch.message : 'Field missing';
    }

    const errorDetails = errors.map(e => e.rawMessage || e.message || 'Unknown error').join('\n');
    return { errorMsg, errorDetails };
};

// Main route
app.get('/', (req, res) => {
    res.set('Content-Type', 'application/xhtml+xml');
    res.sendFile(path.resolve(__dirname, 'public', 'index.xml'));
});

app.get('/lieferanten', (req, res) => {
    res.set('Content-Type', 'application/xhtml+xml');
    res.sendFile(path.resolve(__dirname, 'public', 'pages', 'lieferanten.xml'));
});

app.get('/kunden', (req, res) => {
    res.set('Content-Type', 'application/xhtml+xml');
    res.sendFile(path.resolve(__dirname, 'public', 'pages', 'kunden.xml'));
});

app.get('/forum', async (req, res) => {
    try {
        const forumPath = path.resolve(__dirname, 'data', 'forum.xml');
        const xslPath = path.resolve(__dirname, 'public', 'xsl', 'forum.xsl');

        let forumXmlStr = fs.existsSync(forumPath)
            ? fs.readFileSync(forumPath, 'utf-8')
            : '<?xml version="1.0" encoding="UTF-8"?><forum/>';

        if (req.query.status) {
            const parser = new DOMParser();
            const forumDoc = parser.parseFromString(forumXmlStr, 'application/xml');
            const root = forumDoc.documentElement;
            const statusEl = forumDoc.createElement('pageStatus');
            statusEl.appendChild(forumDoc.createTextNode(req.query.status));
            root.insertBefore(statusEl, root.firstChild);
            if (req.query.msg) {
                const msgEl = forumDoc.createElement('pageMessage');
                msgEl.appendChild(forumDoc.createTextNode(req.query.msg));
                root.insertBefore(msgEl, root.childNodes[1] || null);
            }
            forumXmlStr = new XMLSerializer().serializeToString(forumDoc);
        }

        const xslStr = fs.readFileSync(xslPath, 'utf-8');
        const xslt = new Xslt();
        const xmlParser = new XmlParser();
        const result = await xslt.xsltProcess(
            xmlParser.xmlParse(forumXmlStr),
            xmlParser.xmlParse(xslStr)
        );
        res.set('Content-Type', 'text/html');
        res.send(result);
    } catch (error) {
        console.error('Forum rendering failed:', error);
        sendXmlResponse(res, 500, 'Error rendering forum page');
    }
});

app.post('/forum', async (req, res) => {
    const { name, title, message } = req.body;
    const forumPath = path.resolve(__dirname, 'data', 'forum.xml');
    const xsdPath = path.resolve(__dirname, 'data', 'forum.xsd');

    try {
        const missing = [];
        if (!name || !name.trim()) missing.push('Name');
        if (!title || !title.trim()) missing.push('Betreff');
        if (!message || !message.trim()) missing.push('Nachricht');

        if (missing.length > 0) {
            return res.redirect(`/forum?status=error&msg=${encodeURIComponent('Pflichtfelder fehlen: ' + missing.join(', '))}`);
        }

        if (name.trim().length > 50 || title.trim().length > 100 || message.trim().length > 500) {
            return res.redirect(`/forum?status=error&msg=${encodeURIComponent('Feldlänge überschritten')}`);
        }

        const escapeXml = (str) => String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

        const today = new Date().toISOString().slice(0, 10);
        const parser = new DOMParser();

        if (!fs.existsSync(forumPath)) {
            fs.writeFileSync(forumPath, '<?xml version="1.0" encoding="UTF-8"?><forum/>', 'utf-8');
        }

        const forumXmlStr = fs.readFileSync(forumPath, 'utf-8');
        const xsdXmlStr = fs.readFileSync(xsdPath, 'utf-8');

        const snippetDoc = parser.parseFromString(
            `<?xml version="1.0" encoding="UTF-8"?><forum><post><name>${escapeXml(name.trim())}</name><title>${escapeXml(title.trim())}</title><message>${escapeXml(message.trim())}</message><date>${today}</date></post></forum>`,
            'application/xml'
        );
        const snippetPost = snippetDoc.getElementsByTagName('post')[0];

        const forumDoc = parser.parseFromString(forumXmlStr, 'application/xml');
        forumDoc.documentElement.appendChild(forumDoc.importNode(snippetPost, true));

        const updatedXmlStr = new XMLSerializer().serializeToString(forumDoc);

        const validationResult = await validateXML({
            xml: [{ fileName: 'forum.xml', contents: String(updatedXmlStr) }],
            schema: [String(xsdXmlStr)]
        });

        if (!validationResult.valid) {
            const { errorMsg } = parseValidationErrors(validationResult);
            return res.redirect(`/forum?status=error&msg=${encodeURIComponent(errorMsg)}`);
        }

        fs.writeFileSync(forumPath, updatedXmlStr, 'utf-8');
        return res.redirect('/forum?status=ok');
    } catch (error) {
        console.error('Saving forum post failed:', error);
        return res.redirect(`/forum?status=error&msg=${encodeURIComponent('Interner Fehler')}`);
    }
});

app.get('/charts', (req, res) => {
    res.set('Content-Type', 'application/xhtml+xml');
    res.sendFile(path.resolve(__dirname, 'public', 'charts.xml'));
});

app.get('/kraftwerke', async (req, res) => {
    try {
        const xmlPath = path.resolve(__dirname, 'data', 'kraftwerke.xml');
        const xslPath = path.resolve(__dirname, 'public', 'xsl', 'kraftwerke.xsl');
        const xmlStr = fs.readFileSync(xmlPath, 'utf-8');
        const xslStr = fs.readFileSync(xslPath, 'utf-8');
        const xslt = new Xslt();
        const xmlParser = new XmlParser();
        const result = await xslt.xsltProcess(
            xmlParser.xmlParse(xmlStr),
            xmlParser.xmlParse(xslStr)
        );
        res.set('Content-Type', 'text/html');
        res.send(result);
    } catch (error) {
        console.error('Kraftwerke rendering failed:', error);
        sendXmlResponse(res, 500, 'Error rendering kraftwerke page');
    }
});

app.get('/generatePdf', async (req, res) => {
    try {
        const dbPath = path.resolve(__dirname, 'data', 'database.xml');
        const xslPath = path.resolve(__dirname, 'public', 'xsl', 'fo.xsl');

        if (!fs.existsSync(dbPath)) {
            return sendXmlResponse(res, 404, 'Database file not found');
        }

        if (!fs.existsSync(xslPath)) {
            return sendXmlResponse(res, 404, 'XSL stylesheet not found');
        }

        const dbXmlStr = fs.readFileSync(dbPath, 'utf-8');
        const xslStr = fs.readFileSync(xslPath, 'utf-8');

        // Transform XML to FO using server-side XSLT
        const xslt = new Xslt();
        const xmlParser = new XmlParser();
        const foString = await xslt.xsltProcess(
            xmlParser.xmlParse(dbXmlStr),
            xmlParser.xmlParse(xslStr)
        );

        // Send FO to PDF converter
        const response = await fetch('https://fop.xml.hslu-edu.ch/fop.php', {
            method: "POST",
            body: foString,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return sendXmlResponse(res, response.status, `FOP service error: ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const tempPath = path.resolve(__dirname, 'temp.pdf');

        try {
            fs.writeFileSync(tempPath, buffer);
            res.sendFile(tempPath, (err) => {
                fs.unlink(tempPath, (unlinkErr) => {
                    if (unlinkErr) console.error('Failed to delete temp.pdf:', unlinkErr);
                });
                if (err) console.error('Failed to send PDF:', err);
            });
        } catch (writeErr) {
            fs.unlink(tempPath, () => {});
            throw writeErr;
        }
    } catch (error) {
        console.error('PDF conversion failed:', error);
        sendXmlResponse(res, 500, 'Error generating PDF');
    }
});

app.post('/lieferanten', async (req, res) => {
    const xmlSnippet = req.body; // expected: <lieferant ...>...</lieferant>
    const suppliersPath = path.resolve(__dirname, 'data', 'lieferanten.xml');
    const xsdPath = path.resolve(__dirname, 'data', 'lieferanten.xsd');

    try {
        if (!xmlSnippet || xmlSnippet.trim() === '') {
            return sendXmlResponse(res, 400, 'No XML provided');
        }

        const parser = new DOMParser();

        // Parse snippet safely by wrapping it
        const wrappedSnippetDoc = parser.parseFromString(
            `<?xml version="1.0" encoding="UTF-8"?><lieferanten>${xmlSnippet}</lieferanten>`,
            'application/xml'
        );

        const snippetSupplier = wrappedSnippetDoc.getElementsByTagName('lieferant')[0];
        if (!snippetSupplier) {
            return sendXmlResponse(res, 400, 'Must provide a <lieferant> element');
        }

        if (!fs.existsSync(suppliersPath)) {
            fs.writeFileSync(suppliersPath, `<?xml version="1.0" encoding="UTF-8"?><lieferanten/>`, 'utf-8');
        }

        const suppliersXmlStr = fs.readFileSync(suppliersPath, 'utf-8');
        const xsdXmlStr = fs.readFileSync(xsdPath, 'utf-8');

        const suppliersDoc = parser.parseFromString(suppliersXmlStr, 'application/xml');
        const suppliersRoot = suppliersDoc.documentElement;

        if (!suppliersRoot || suppliersRoot.nodeName !== 'lieferanten') {
            return sendXmlResponse(res, 500, 'Invalid suppliers storage file (expected <lieferanten>)');
        }

        // Correctly import the node into the target document
        const supplierToAppend = suppliersDoc.importNode(snippetSupplier, true);
        suppliersRoot.appendChild(supplierToAppend);

        const updatedXmlStr = new XMLSerializer().serializeToString(suppliersDoc);

        const validationResult = await validateXML({
            xml: [{ fileName: 'lieferanten.xml', contents: String(updatedXmlStr) }],
            schema: [String(xsdXmlStr)]
        });

        if (!validationResult.valid) {
            const { errorMsg, errorDetails } = parseValidationErrors(validationResult);
            return sendXmlResponse(res, 400, errorMsg, errorDetails);
        }

        fs.writeFileSync(suppliersPath, updatedXmlStr, 'utf-8');
        return sendXmlResponse(res, 200, 'Supplier saved');
    } catch (error) {
        console.error('Saving supplier failed:', error);
        return sendXmlResponse(res, 500, 'Internal Server Error', error.message);
    }
});

app.post('/validateSuppliers', async (req, res) => {
    const xmlSnippet = req.body;
    const xsdPath = path.resolve(__dirname, 'data', 'lieferanten.xsd');

    try {
        if (!xmlSnippet || xmlSnippet.trim() === '') {
            return sendXmlResponse(res, 400, 'No XML provided');
        }

        const xsdXmlStr = fs.readFileSync(xsdPath, 'utf-8');
        
        // Wrap snippet in root element for validation if it's just a <lieferant>
        let xmlToValidate = xmlSnippet;
        if (xmlSnippet.includes('<lieferant') && !xmlSnippet.includes('<lieferanten')) {
            xmlToValidate = `<?xml version="1.0" encoding="UTF-8"?><lieferanten>${xmlSnippet}</lieferanten>`;
        }

        const validationResult = await validateXML({
            xml: [{ fileName: 'validate.xml', contents: String(xmlToValidate) }],
            schema: [String(xsdXmlStr)]
        });

        if (!validationResult.valid) {
            const { errorMsg, errorDetails } = parseValidationErrors(validationResult);
            return sendXmlResponse(res, 400, errorMsg, errorDetails);
        }

        return sendXmlResponse(res, 200, 'XML is valid against XSD');
    } catch (error) {
        console.error('Validation failed:', error);
        return sendXmlResponse(res, 500, 'Internal Server Error', error.message);
    }
});

// Data update route with validation
app.post('/updateData', async (req, res) => {
    const xmlBody = req.body;
    const dbPath = path.resolve(__dirname, 'data', 'database.xml');
    const xsdPath = path.resolve(__dirname, 'data', 'database.xsd');

    try {
        if (!xmlBody || xmlBody.trim() === '') {
            return sendXmlResponse(res, 400, 'No XML provided');
        }

        const parser = new DOMParser();
        const bodyDoc = parser.parseFromString(xmlBody, 'application/xml');
        const id = bodyDoc.getElementsByTagName('id')[0]?.textContent?.trim();
        const value = bodyDoc.getElementsByTagName('value')[0]?.textContent?.trim();
        const date = bodyDoc.getElementsByTagName('date')[0]?.textContent?.trim();

        const dbXmlStr = fs.readFileSync(dbPath, 'utf-8');
        const xsdXmlStr = fs.readFileSync(xsdPath, 'utf-8');

        const doc = parser.parseFromString(dbXmlStr, 'application/xml');

        // Logic to update node - assuming structure: //region[@id="..."]
        if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
            return sendXmlResponse(res, 400, 'Invalid region id');
        }
        const select = xpath.useNamespaces({});
        const nodes = select(`//region[@id="${id}"]`, doc);
        
        if (nodes.length > 0) {
            const regionNode = nodes[0];
            const pricesNode = regionNode.getElementsByTagName('prices')[0];
            
            const priceNode = doc.createElement('price');
            priceNode.setAttribute('date', date);
            priceNode.setAttribute('unit', 'Rp/kWh');
            priceNode.appendChild(doc.createTextNode(value));
            
            if (pricesNode) {
                pricesNode.appendChild(priceNode);
            } else {
                const newPrices = doc.createElement('prices');
                newPrices.appendChild(priceNode);
                regionNode.appendChild(newPrices);
            }
        } else {
            return sendXmlResponse(res, 404, 'Region not found');
        }

        const updatedXmlStr = new XMLSerializer().serializeToString(doc);

        // Validate using xmllint-wasm
        const validationResult = await validateXML({
            xml: [{
                fileName: 'database.xml',
                contents: updatedXmlStr
            }],
            schema: [xsdXmlStr]
        });

        if (validationResult.valid) {
            fs.writeFileSync(dbPath, updatedXmlStr, 'utf-8');
            sendXmlResponse(res, 200, 'Data updated successfully');
        } else {
            const errorDetails = validationResult.errors.map(e => e.rawMessage).join('\n');
            sendXmlResponse(res, 400, 'Validation failed', errorDetails);
        }
    } catch (error) {
        console.error('Update failed:', error);
        sendXmlResponse(res, 500, 'Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`EnerCheck running at http://localhost:${PORT}`);
});
