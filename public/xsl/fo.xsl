<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:fo="http://www.w3.org/1999/XSL/Format">
  <xsl:template match="/">
    <fo:root>
      <fo:layout-master-set>
        <fo:simple-page-master master-name="A4" page-height="29.7cm" page-width="21cm" margin="2cm">
          <fo:region-body />
        </fo:simple-page-master>
      </fo:layout-master-set>
      <fo:page-sequence master-reference="A4">
        <fo:flow flow-name="xsl-region-body">
          <fo:block font-size="24pt" font-weight="bold" space-after="1cm">Enegiepreise der Regionen</fo:block>
          <xsl:apply-templates select="//region" />
        </fo:flow>
      </fo:page-sequence>
    </fo:root>
  </xsl:template>

  <xsl:template match="region">
    <fo:block font-size="14pt" font-weight="bold" space-before="0.5cm">
      Region: <xsl:value-of select="name" /> (ID: <xsl:value-of select="@id" />)
    </fo:block>
    <fo:table table-layout="fixed" width="100%" border-bottom="1pt solid black">
      <fo:table-column column-width="30%"/>
      <fo:table-column column-width="40%"/>
      <fo:table-column column-width="30%"/>
      <fo:table-header>
        <fo:table-row font-weight="bold" background-color="#f0f0f0">
          <fo:table-cell border="1pt solid black"><fo:block padding="2pt">Datum</fo:block></fo:table-cell>
          <fo:table-cell border="1pt solid black"><fo:block padding="2pt">Preis</fo:block></fo:table-cell>
          <fo:table-cell border="1pt solid black"><fo:block padding="2pt">Einheit</fo:block></fo:table-cell>
        </fo:table-row>
      </fo:table-header>
      <fo:table-body>
        <xsl:apply-templates select="prices/price" />
      </fo:table-body>
    </fo:table>
  </xsl:template>

  <xsl:template match="price">
    <fo:table-row>
      <fo:table-cell border="1pt solid black"><fo:block padding="2pt"><xsl:value-of select="@date" /></fo:block></fo:table-cell>
      <fo:table-cell border="1pt solid black"><fo:block padding="2pt" text-align="right"><xsl:value-of select="." /></fo:block></fo:table-cell>
      <fo:table-cell border="1pt solid black"><fo:block padding="2pt"><xsl:value-of select="@unit" /></fo:block></fo:table-cell>
    </fo:table-row>
  </xsl:template>
</xsl:stylesheet>
