<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                exclude-result-prefixes="xhtml">
  <xsl:output method="xml" encoding="UTF-8" indent="yes"
              doctype-system="http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"
              doctype-public="-//W3C//DTD XHTML 1.1//EN" />

  <xsl:template match="/xhtml:html">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="xhtml:head/xhtml:title" /></title>
        <link rel="stylesheet" href="/css/style.css" />
      </head>
      <body>
        <header>
          <h1><xsl:value-of select="xhtml:head/xhtml:title" /></h1>
          <nav class="nav">
            <a href="/">Home</a>
            <a href="/lieferanten">Lieferanten</a>
            <a href="/kunden">Kunden</a>
            <a href="/forum">Forum</a>
          </nav>
        </header>

        <main>
          <xsl:copy-of select="xhtml:body/xhtml:div[@class='main']/*" />
          
          <div class="actions">
            <button onclick="createPdf()" class="button-link">PDF generieren</button>
            <a href="charts.xml" class="button-link">Preisdiagramme anzeigen</a>
          </div>

          <xsl:if test="not(//xhtml:div[@class='main']/xhtml:h1 = 'Welcome to EnerCheck')">
            <section id="kraftwerke-integration" style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;">
              <h2 style="text-align: center; color: #333;">Regionale Kraftwerks-Analyse</h2>
              
              <div id="stats-container" style="display: flex; gap: 20px; align-items: flex-start;">
                
                <div style="flex: 1; background: #fdfdfd; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <h3 style="font-size: 1.1em; margin-bottom: 10px;">Region auswählen</h3>
                  <div class="map-wrapper" style="position: relative; width: 100%; border: 1px solid #ccc; line-height: 0;">
                    <img src="/img/Landkartexsd.png" style="width: 100%; height: auto;" alt="Karte" />
                    
                    <svg viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg" 
                         style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                        
                        <a href="#region-1">
                            <polygon points="143,214 140,218 135,222 132,226 128,226 127,219 122,218 117,218 114,218 113,214 118,211 120,208 116,208 111,207 111,202 110,198 113,197 115,196 119,192 122,187 122,183 124,179 125,175 118,179 114,180 111,180 108,177 106,172 106,167 105,163 104,158 98,160 94,163 85,165 81,168 78,169 76,174 77,181 75,182 70,185 65,188 60,192 55,197 50,204 46,205 47,211 45,215 42,219 40,226 39,229 46,234 48,238 44,243 43,247 43,251 39,253 35,255 31,257 28,260 29,262 29,266 33,268 38,267 43,267 47,266 49,263 55,258 58,256 61,254 57,250 57,245 60,239 68,234 77,231 84,229 93,227 101,228 107,228 114,230 115,233 111,236 111,240 115,245 118,248 115,254 112,260 111,264 111,268 116,269 122,270 120,276 119,281 123,281 129,285 132,290 135,295 139,303 143,308 146,305 151,307 154,305 157,302 160,300 165,301 170,302 175,299 180,295 185,293 187,290 191,293 196,292 198,295 202,298 206,298 213,299 217,298 219,293 223,289 229,288 232,284 233,280 235,275 240,272 243,270 246,265 244,261 242,256 238,253 242,248 250,244 255,241 259,236 260,230 265,226 269,223 271,218 273,214 271,209 270,205 269,199 266,197 265,203 263,206 257,212 246,214 240,213 234,209 228,209 227,212 227,216 222,218 217,221 207,226 204,229 201,230 193,225 192,228 189,229 186,232 184,235 181,235 176,236 170,237 164,241 162,239 161,234 158,237 157,241 153,242 150,234 150,230 153,226 155,224 155,220 156,216 153,213 149,213" class="region-shape" />
                        </a>

                        <a href="#region-2">
                            <polygon points="117,218 111,202 124,187 109,176 102,158 81,168 78,157 122,119 137,98 122,97 133,79 150,80 155,88 178,80 178,94 189,88 193,80 200,81 193,93 195,96 202,99 207,101 213,95 217,91 226,88 230,94 229,99 219,102 212,108 211,112 212,117 218,128 216,137 219,144 220,147 224,152 218,157 214,168 225,177 255,181 271,180 274,191 257,213 230,211 202,230 188,229 182,235 171,237 162,241 151,242 154,223 155,211 148,215 138,221 132,225" class="region-shape" />
                        </a>

                        <a href="#region-3">
                            <polygon points="199,66 195,65 188,67 182,70 181,75 184,76 184,82 178,86 176,92 192,87 193,79 198,79 195,95 207,101 214,95 224,85 230,97 218,103 213,113 223,115 247,116 255,109 266,131 269,109 264,82 266,68 250,62 229,71 219,67 203,72 196,72" class="region-shape" />
                        </a>

                        <a href="#region-4">
                            <polygon points="276,59 271,69 262,80 266,97 269,115 281,118 287,122 293,123 296,119 304,117 309,113 315,111 320,106 323,103 320,94 316,88 316,83 314,75 309,69 305,66 300,62 303,62 305,59 305,54 300,57 293,54 289,50 286,55 285,59 284,63 281,66 281,60" class="region-shape" />
                        </a>

                        <a href="#region-5">
                            <polygon points="376,136 385,83 347,58 287,35 270,50 301,59 319,109 319,144 313,174 296,194 293,205 327,202 337,254 342,265 354,247 354,220 372,223 375,242 396,249 403,238 418,233 430,253 437,256 438,247 437,230 425,214 432,203 446,195 450,205 468,210 470,150 459,145 439,164 417,157 405,142" class="region-shape" />
                        </a>

                        <a href="#region-6">
                            <polygon points="270,185 270,191 267,196 268,201 268,207 270,213 275,214 279,213 278,208 282,207 287,208 291,208 294,205 293,199 293,190 297,189 301,184 305,184 309,182 312,175 314,169 319,165 321,159 321,152 315,145 320,139 322,132 322,124 320,118 313,118 307,119 299,119 295,122 292,124 287,120 280,118 271,117 266,118 268,123 268,127 262,125 260,119 257,113 255,108 251,111 250,115 245,116 241,113 234,113 229,114 229,110 224,110 224,113 220,115 215,115 212,118 215,122 217,129 215,134 216,139 217,145 219,147 223,148 224,154 220,157 216,162 216,165 215,170 218,172 222,176 227,180 232,179 238,178 241,181 243,181 251,180 257,181 263,178 266,178 271,180" class="region-shape" />
                        </a>

                        <a href="#region-7">
                            <polygon points="274,232 275,224 269,223 266,220 272,216 275,214 278,211 281,206 289,207 295,207 302,207 310,208 317,205 319,200 323,199 325,202 330,202 331,205 330,209 330,217 332,219 336,223 337,229 335,234 335,236 334,241 333,244 334,249 335,254 340,259 342,263 340,266 336,268 337,272 334,275 330,280 331,285 330,288 327,290 328,293 331,296 334,298 336,300 334,307 333,310 329,312 324,310 320,310 323,306 320,300 318,294 313,290 306,287 309,283 313,279 310,274 306,274 302,273 296,272 291,270 287,265 284,261 281,257 275,255 273,253 272,247 274,242 275,237" class="region-shape" />
                        </a>
                    </svg>
                  </div>
                </div>

                <div style="flex: 1; background: #fdfdfd; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); min-height: 500px;">
                  <h3 style="font-family: sans-serif;">Informationen</h3>
                  
                  <div id="details-view">
                    <div id="placeholder">
                      <p style="color: #666; font-style: italic;">Bitte wählen Sie eine Region auf der Karte aus.</p>
                    </div>

                    <div id="region-1" class="region-detail">
                      <h4 style="color: #007bff;">Region 1: Genferseeregion</h4>
                      <p>Wichtige Kraftwerke: KKW Mühleberg (stillgelegt), div. Wasserkraftwerke an der Rhone.</p>
                    </div>

                    <div id="region-2" class="region-detail">
                      <h4 style="color: #007bff;">Region 2: Espace Mittelland</h4>
                      <p>Zentrum der schweizerischen Stromproduktion mit vielen Flusskraftwerken.</p>
                    </div>

                    <div id="region-3" class="region-detail">
                      <h4 style="color: #007bff;">Region 3: Nordwestschweiz</h4>
                      <p>Details zur Energieversorgung in Basel und Umgebung.</p>
                    </div>

                    <div id="region-4" class="region-detail">
                      <h4 style="color: #007bff;">Region 4: Zürich</h4>
                      <p>Hoher Energiebedarf, Fokus auf Fernwärme und Solarenergie.</p>
                    </div>

                    <div id="region-5" class="region-detail">
                      <h4 style="color: #007bff;">Region 5: Ostschweiz</h4>
                      <p>Kombination aus Wind- und Biomasseprojekten.</p>
                    </div>

                    <div id="region-6" class="region-detail">
                      <h4 style="color: #007bff;">Region 6: Zentralschweiz</h4>
                      <p>Fokus auf alpine Speicherkraftwerke.</p>
                    </div>

                    <div id="region-7" class="region-detail">
                      <h4 style="color: #007bff;">Region 7: Graubünden / Tessin</h4>
                      <p>Die "Batterie" der Schweiz mit den größten Stauseen.</p>
                    </div>
                  </div>
                </div>

              </div> 
            </section>
          </xsl:if>
        </main>
        
        <script src="/js/app.js"></script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>