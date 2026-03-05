# EnerCheck

A Swiss electricity market transparency platform built with Node.js, XML, XSLT, and XSD validation. The application serves XML-based pages rendered via XSLT and exposes a REST API for managing electricity price data, suppliers, power plants, and a community forum.

## Requirements

- Node.js 18+

## Getting Started

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server runs on `http://localhost:3000` by default. Override the port with the `ENER_CHECK_PORT` environment variable.

## Project Structure

```
.
├── server.js              # Express server, routing, XSLT rendering, XML validation
├── data/                  # XML data files and their XSD schemas
│   ├── database.xml/.xsd  # Regional electricity price data
│   ├── lieferanten.xml/.xsd # Suppliers
│   ├── kraftwerke.xml/.xsd  # Power plants
│   └── forum.xml/.xsd     # Forum posts (created on first post)
└── public/                # Static assets served directly
    ├── index.xml          # Landing page (XHTML + XSL PI)
    ├── charts.xml         # Charts page
    ├── landkarte.svg      # Switzerland map
    ├── pages/             # Additional XHTML pages
    │   ├── forum.xml
    │   ├── kunden.xml
    │   └── lieferanten.xml
    ├── xsl/               # XSLT stylesheets
    │   ├── main.xsl       # Shared layout/shell
    │   ├── forum.xsl      # Forum page rendering
    │   ├── kraftwerke.xsl # Power plants page rendering
    │   ├── charts.xsl     # Charts rendering
    │   ├── dashboard.xsl  # Dashboard rendering
    │   └── fo.xsl         # XSL-FO stylesheet for PDF export
    ├── css/style.css
    ├── js/app.js
    └── img/
```

## Pages

| Route | Description |
|---|---|
| `GET /` | Landing page |
| `GET /lieferanten` | Suppliers overview |
| `GET /kunden` | Customers overview |
| `GET /kraftwerke` | Power plants (server-side XSLT) |
| `GET /charts` | Electricity price charts |
| `GET /forum` | Community forum (server-side XSLT) |
| `GET /generatePdf` | Generate a PDF report via an external FOP service |

## API Endpoints

All request/response bodies use XML.

### `POST /updateData`
Add a price entry for a Swiss region.

Request body (XML):
```xml
<update><id>CH01</id><value>25.5</value><date>2026-01-01</date></update>
```

### `POST /lieferanten`
Add a new supplier. Body must be a `<lieferant>` XML element validated against `data/lieferanten.xsd`.

### `POST /validateSuppliers`
Validate a `<lieferant>` XML snippet against the XSD without persisting it.

### `POST /forum`
Submit a forum post. Form fields: `name`, `title`, `message`.

## Data Files

XML data is stored in the `data/` directory and validated against XSD schemas on every write. Each file follows its corresponding schema:

- `database.xml` — regional electricity prices by date (`Rp/kWh`)
- `lieferanten.xml` — electricity suppliers
- `kraftwerke.xml` — power plants
- `forum.xml` — forum posts (auto-created if absent)

## PDF Export

`GET /generatePdf` transforms `data/database.xml` into XSL-FO using `public/xsl/fo.xsl`, then sends it to HSLU Apache FOP service to produce a PDF.
