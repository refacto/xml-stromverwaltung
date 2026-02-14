<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <xsl:output method="xml" 
              encoding="UTF-8" 
              indent="yes"
              doctype-system="http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"
              doctype-public="-//W3C//DTD XHTML 1.1//EN" />

  <!-- Match the charts.xml root -->
  <xsl:template match="/xhtml:html">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="xhtml:head/xhtml:title" /></title>
        <link rel="stylesheet" href="css/style.css" />
        <style>
          .chart-container {
            margin-bottom: 50px;
            padding: 20px;
            border: 1px solid #ccc;
          }
          .bar {
            fill: steelblue;
          }
          .bar:hover {
            fill: brown;
          }
          .axis-text {
            font-family: sans-serif;
            font-size: 10px;
          }
          .chart-title {
            font-family: sans-serif;
            font-size: 16px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <header>
          <h1><xsl:value-of select="xhtml:head/xhtml:title" /></h1>
          <nav class="actions">
            <a href="index.xml" class="button-link">Zurück zum Dashboard</a>
          </nav>
        </header>
        <main>
          <!-- Load the database XML -->
          <xsl:apply-templates select="document('../../data/database.xml')/enercheck/region" />
        </main>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="region">
    <div class="chart-container" xmlns="http://www.w3.org/1999/xhtml">
      <h2 class="chart-title"><xsl:value-of select="name" /></h2>
      
      <xsl:variable name="chart-width" select="500" />
      <xsl:variable name="chart-height" select="200" />
      <xsl:variable name="bar-width" select="40" />
      <xsl:variable name="spacing" select="10" />
      
      <svg width="{$chart-width}" height="{$chart-height + 40}" viewBox="0 0 {$chart-width} {$chart-height + 40}" xmlns="http://www.w3.org/2000/svg">
        <xsl:for-each select="prices/price">
          <xsl:variable name="pos" select="position() - 1" />
          <xsl:variable name="x" select="$pos * ($bar-width + $spacing) + 50" />
          <!-- Scaling price to height: assuming max price is around 40 for simplicity -->
          <xsl:variable name="h" select=". * 5" /> 
          <xsl:variable name="y" select="$chart-height - $h" />
          
          <rect x="{$x}" y="{$y}" width="{$bar-width}" height="{$h}" class="bar" xmlns="http://www.w3.org/2000/svg">
             <title><xsl:value-of select="." /> Rp/kWh (<xsl:value-of select="@date" />)</title>
          </rect>
          
          <text x="{$x + $bar-width div 2}" y="{$chart-height + 15}" text-anchor="middle" class="axis-text" xmlns="http://www.w3.org/2000/svg">
            <xsl:value-of select="substring(@date, 6)" />
          </text>
          
          <text x="{$x + $bar-width div 2}" y="{$y - 5}" text-anchor="middle" class="axis-text" xmlns="http://www.w3.org/2000/svg">
            <xsl:value-of select="." />
          </text>
        </xsl:for-each>
        
        <!-- Y-Axis -->
        <line x1="45" y1="0" x2="45" y2="{$chart-height}" style="stroke:black;stroke-width:1" xmlns="http://www.w3.org/2000/svg" />
        <!-- X-Axis -->
        <line x1="45" y1="{$chart-height}" x2="{$chart-width}" y2="{$chart-height}" style="stroke:black;stroke-width:1" xmlns="http://www.w3.org/2000/svg" />
        
        <text x="10" y="{$chart-height div 2}" transform="rotate(-90 10,{$chart-height div 2})" class="axis-text" text-anchor="middle" xmlns="http://www.w3.org/2000/svg">
          Preis (Rp/kWh)
        </text>
      </svg>
    </div>
  </xsl:template>

</xsl:stylesheet>
