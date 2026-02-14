<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                exclude-result-prefixes="xhtml">
  <xsl:output method="xml" 
              encoding="UTF-8" 
              indent="yes"
              doctype-system="http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"
              doctype-public="-//W3C//DTD XHTML 1.1//EN" />

  <xsl:template match="/xhtml:html">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="xhtml:head/xhtml:title" /></title>
        <link rel="stylesheet" href="css/style.css" />
      </head>
      <body>
        <header>
          <h1><xsl:value-of select="xhtml:head/xhtml:title" /></h1>
        </header>
        <main>
          <p><xsl:value-of select="xhtml:body/xhtml:div[@id='content']/xhtml:p[@id='description']" /></p>
          
          <div class="actions">
            <button onclick="createPdf()" class="button-link">PDF generieren</button>
            <a href="charts.xml" class="button-link">Preisdiagramme anzeigen</a>
          </div>

          <section id="data-preview">
            <h2>Inhalt der Datenbank</h2>
            <iframe src="../data/database.xml" width="100%" height="300px"/>
          </section>
        </main>

        <script src="js/app.js"/>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
