<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns="http://www.w3.org/1999/xhtml">

    <xsl:output method="xml" encoding="UTF-8" indent="yes"/>

    <!-- Transform the database XML into an XHTML fragment -->
    <xsl:template match="/enercheck">
        <section id="dashboard">
            <h2>Current Database State</h2>

            <xsl:choose>
                <xsl:when test="count(item) = 0">
                    <p>No items found.</p>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:for-each select="item">
                        <article class="item">
                            <h3>
                                <xsl:value-of select="name"/>
                                <xsl:text> </xsl:text>
                                <small>(ID: <xsl:value-of select="@id"/>)</small>
                            </h3>

                            <xsl:choose>
                                <xsl:when test="count(history/entry) = 0">
                                    <p>No history entries yet.</p>
                                </xsl:when>
                                <xsl:otherwise>
                                    <table class="history">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Entry</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <xsl:for-each select="history/entry">
                                                <tr>
                                                    <td><xsl:value-of select="@date"/></td>
                                                    <td><xsl:value-of select="."/></td>
                                                </tr>
                                            </xsl:for-each>
                                        </tbody>
                                    </table>
                                </xsl:otherwise>
                            </xsl:choose>
                        </article>
                    </xsl:for-each>
                </xsl:otherwise>
            </xsl:choose>
        </section>
    </xsl:template>

</xsl:stylesheet>