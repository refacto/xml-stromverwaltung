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
        <link rel="stylesheet" href="/css/style.css" />
      </head>
      <body>
        <div class="header">
          <h1><xsl:value-of select="xhtml:head/xhtml:title" /></h1>
          <div class="nav">
            <a href="/">Home</a>
            <a href="/lieferanten">Lieferanten</a>
            <a href="/kunden">Kunden</a>
            <a href="/forum">Forum</a>
            <a href="/charts">Preisdiagramme</a>
          </div>
        </div>

        <div class="main">
          <xsl:copy-of select="xhtml:body/xhtml:div[@class='main']/*" />
          <xsl:copy-of select="xhtml:body/xhtml:div[@id='content']/*" />

          <p><xsl:value-of select="xhtml:body/xhtml:div[@id='content']/xhtml:p[@id='description']" /></p>
          
          <div class="actions">
            <xsl:if test="//xhtml:div[@class='main']/xhtml:h2 = 'Lieferanten' or //xhtml:div[@class='main']/xhtml:h2 = 'Kunden'">
              <button onclick="createPdf()" class="button-link">PDF generieren</button>
            </xsl:if>
          </div>


          <xsl:if test="//xhtml:div[@class='main']/xhtml:h2 = 'Lieferanten'">
            <div id="kraftwerke-integration" style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;">
              <h2 style="font-family: sans-serif; color: #333; text-align: center;">Regionale Kraftwerks-Analyse</h2>

              <div id="stats-container" style="display: flex; gap: 20px; align-items: flex-start;">

                <div style="flex: 1; background: #fdfdfd; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <h3 style="font-family: sans-serif;">Region auswählen</h3>

                  <div class="map-wrapper" style="position: relative; width: 100%; border: 1px solid #ccc;">
<img src="/img/Landkartexsd.png" style="width: 100%; display: block;" alt="Hintergrundkarte" />                    <object data="/landkarte.svg" type="image/svg+xml"
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.4; pointer-events: auto;">
                    </object>
                  </div>
                </div>
                <div style="flex: 1; background: #fdfdfd; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <h3 style="font-family: sans-serif;">Kraftwerks-Details</h3>
                  <div id="daten-anzeige" style="width: 100%; min-height: 500px; border: 1pt solid #ccc; margin-top: 10px; overflow-y: auto; padding: 10px; box-sizing: border-box;">
                    <p>Wählen Sie eine Region aus der Karte.</p>
                  </div>
                </div>
              </div>
            </div>
          </xsl:if>
        </div>

        <script type="text/javascript" src="/js/app.js"></script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>