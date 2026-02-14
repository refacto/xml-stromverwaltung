import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import xpath from 'xpath';
import { validateXML } from 'xmllint-wasm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.ENER_CHECK_PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// ... existing code ...
app.use(express.text({ type: 'application/xml' }));
app.use(express.json());
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

// Main route
app.get('/', (req, res) => {
    res.set('Content-Type', 'application/xhtml+xml');
    res.sendFile(path.resolve(__dirname, 'public', 'pages', 'landing.xml'));
});

app.get('/lieferanten', (req, res) => {
    res.set('Content-Type', 'application/xhtml+xml');
    res.sendFile(path.resolve(__dirname, 'public', 'pages', 'lieferanten.xml'));
});

app.get('/kunden', (req, res) => {
    res.set('Content-Type', 'application/xhtml+xml');
    res.sendFile(path.resolve(__dirname, 'public', 'pages', 'kunden.xml'));
});

app.get('/forum', (req, res) => {
    res.set('Content-Type', 'application/xhtml+xml');
    res.sendFile(path.resolve(__dirname, 'public', 'pages', 'forum.xml'));
});

app.post('/convertToPdf', async (req, res) => {
    try {
        let foData = req.body;

        if (typeof foData === 'object' && foData !== null && Object.keys(foData).length > 0) {
            foData = foData.fo || Object.keys(foData)[0];
        }

        if (!foData || (typeof foData === 'string' && foData.trim() === '')) {
             return sendXmlResponse(res, 400, 'No FO data provided');
        }

        const response = await fetch('https://fop.xml.hslu-edu.ch/fop.php', {
            method: "POST",
            body: foData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return sendXmlResponse(res, response.status, `FOP service error: ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const tempPath = path.resolve(__dirname, 'temp.pdf');
        
        fs.writeFileSync(tempPath, buffer);
        res.sendFile(tempPath);
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

        const newId = snippetSupplier.getAttribute('id');
        if (!newId) {
            return sendXmlResponse(res, 400, 'Missing required attribute: id');
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

        const select = xpath.useNamespaces({});
        const existing = select(`//lieferant[@id="${newId}"]`, suppliersDoc);
        if (existing.length > 0) {
            return sendXmlResponse(res, 409, `Supplier with id="${newId}" already exists`);
        }

        // Clone into this doc context (no importNode dependency)
        const supplierToAppend = snippetSupplier.cloneNode(true);
        suppliersRoot.appendChild(supplierToAppend);

        const updatedXmlStr = new XMLSerializer().serializeToString(suppliersDoc);

        const validationResult = await validateXML({
            xml: [{ fileName: 'lieferanten.xml', content: updatedXmlStr }],
            schema: [xsdXmlStr]
        });

        if (!validationResult.valid) {
            return sendXmlResponse(res, 400, 'Validation failed', validationResult.errors.join('\n'));
        }

        fs.writeFileSync(suppliersPath, updatedXmlStr, 'utf-8');
        return sendXmlResponse(res, 200, 'Supplier saved');
    } catch (error) {
        console.error('Saving supplier failed:', error);
        return sendXmlResponse(res, 500, 'Internal Server Error');
    }
});

// Data update route with validation
app.post('/updateData', async (req, res) => {
    const { id, value, date } = req.body;
    const dbPath = path.resolve(__dirname, 'data', 'database.xml');
    const xsdPath = path.resolve(__dirname, 'data', 'database.xsd');

    try {
        const dbXmlStr = fs.readFileSync(dbPath, 'utf-8');
        const xsdXmlStr = fs.readFileSync(xsdPath, 'utf-8');
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(dbXmlStr, 'application/xml');

        // Logic to update node - assuming structure: //item[@id="..."]
        const select = xpath.useNamespaces({});
        const nodes = select(`//item[@id="${id}"]`, doc);
        
        if (nodes.length > 0) {
            const itemNode = nodes[0];
            const historyNode = itemNode.getElementsByTagName('history')[0];
            
            const entryNode = doc.createElement('entry');
            entryNode.setAttribute('date', date);
            entryNode.appendChild(doc.createTextNode(value));
            
            if (historyNode) {
                historyNode.appendChild(entryNode);
            } else {
                const newHistory = doc.createElement('history');
                newHistory.appendChild(entryNode);
                itemNode.appendChild(newHistory);
            }
        } else {
            return sendXmlResponse(res, 404, 'Item not found');
        }

        const updatedXmlStr = new XMLSerializer().serializeToString(doc);

        // Validate using xmllint-wasm
        const validationResult = await validateXML({
            xml: [{
                fileName: 'database.xml',
                content: updatedXmlStr
            }],
            schema: [xsdXmlStr]
        });

        if (validationResult.valid) {
            fs.writeFileSync(dbPath, updatedXmlStr, 'utf-8');
            sendXmlResponse(res, 200, 'Data updated successfully');
        } else {
            sendXmlResponse(res, 400, 'Validation failed', validationResult.errors.join('\n'));
        }
    } catch (error) {
        console.error('Update failed:', error);
        sendXmlResponse(res, 500, 'Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`EnerCheck running at http://localhost:${PORT}`);
});
