<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" encoding="UTF-8" indent="yes"
                doctype-public="-//W3C//DTD XHTML 1.1//EN"
                doctype-system="http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"/>

    <xsl:template match="/forum">
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
            <title>EnerCheck</title>
            <link rel="stylesheet" href="/css/style.css"/>
        </head>
        <body>
            <div class="header">
                <h1>EnerCheck</h1>
                <div class="nav">
                    <a href="/">Home</a>
                    <a href="/lieferanten">Lieferanten</a>
                    <a href="/kunden">Kunden</a>
                    <a href="/forum">Forum</a>
                    <a href="/charts">Preisdiagramme</a>
                </div>
            </div>
            <div class="main">
                <h2>Forum</h2>
                <p>
                    Willkommen beim Forum!<br/>
                    Wollen Sie wissen, woher die Daten auf Ihrer Übersicht kommen?<br/>
                    Haben Sie Probleme mit der Filterung oder mit dem Export?<br/>
                    Oder möchten Sie wissen, wie die Plattform bedient wird?<br/>
                    Für diese und viele weitere Fragen ist das Forum da.
                    Teilen Sie Ihre Unklarheiten im Forum oder durchstöbern Sie die Fragen anderer.
                </p>

                <xsl:if test="pageStatus = 'ok'">
                    <p style="color: green; font-weight: bold;">Beitrag erfolgreich gesendet.</p>
                </xsl:if>
                <xsl:if test="pageStatus = 'error'">
                    <p style="color: red; font-weight: bold;"><xsl:value-of select="pageMessage"/></p>
                </xsl:if>

                <h3>Frage stellen</h3>
                <form action="/forum" method="post">
                    <div>
                        <label for="forum-name">Name</label><br/>
                        <input id="forum-name" name="name" type="text" maxlength="50"/>
                        <br/><br/>
                    </div>
                    <div>
                        <label for="forum-title">Betreff</label><br/>
                        <input id="forum-title" name="title" type="text" maxlength="100"/>
                        <br/><br/>
                    </div>
                    <div>
                        <label for="forum-message">Nachricht</label><br/>
                        <textarea id="forum-message" name="message" maxlength="500" rows="4" cols="50"><xsl:text> </xsl:text></textarea>
                        <br/><br/>
                    </div>
                    <div class="actions">
                        <button type="submit">Beitrag senden</button>
                    </div>
                </form>

                <h3>Beiträge</h3>
                <xsl:choose>
                    <xsl:when test="post">
                        <xsl:for-each select="post">
                            <xsl:sort select="date" order="descending"/>
                            <div style="border: 1px solid #ccc; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                                <strong><xsl:value-of select="title"/></strong>
                                <span style="font-size: 0.85em; color: #666; margin-left: 8px;">
                                    &#8212; <xsl:value-of select="name"/>, <xsl:value-of select="date"/>
                                </span>
                                <p><xsl:value-of select="message"/></p>
                            </div>
                        </xsl:for-each>
                    </xsl:when>
                    <xsl:otherwise>
                        <p>Noch keine Beiträge vorhanden.</p>
                    </xsl:otherwise>
                </xsl:choose>
            </div>
            <script type="text/javascript" src="/js/app.js"><xsl:text> </xsl:text></script>
        </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
