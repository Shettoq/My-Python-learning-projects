# rnv-Abfahrtsmonitor

Ein webbasiertes Lernprojekt aus meinem Schülerpraktikum bei der Rhein-Neckar-Verkehr GmbH in Mannheim vom **2. bis 6. November 2026**. Die Anwendung zeigt die nächsten Abfahrten am **Mannheim Hauptbahnhof** an.

Im Praktikum habe ich erste Erfahrungen mit FastAPI, GraphQL und JavaScript gesammelt. Besonders interessant war für mich, wie Backend, externe Schnittstelle und Benutzeroberfläche zusammenarbeiten.

## Funktionen

- Anzeige von Linie, Fahrtrichtung und Abfahrtszeit
- Sortierung nach der verbleibenden Zeit bis zur Abfahrt
- Anzeige von bis zu zehn nächsten Abfahrten
- Kennzeichnung ausgefallener Fahrten, sofern sie in den angezeigten Daten enthalten sind
- Automatische Aktualisierung alle 30 Sekunden und Schaltfläche zum manuellen Aktualisieren
- Lade-, Leer- und Fehleranzeige
- Darstellung für größere und kleinere Bildschirme

Einträge mit fehlender oder negativer `departureInSeconds` werden übersprungen. Anschließend werden die verbleibenden Einträge sortiert und auf zehn begrenzt.

## Technologien und Ablauf

| Bestandteil | Aufgabe |
| --- | --- |
| Python, FastAPI | Lokaler Webserver und eigener Endpunkt `/api/departures` |
| Requests | HTTP-Anfrage an den rnv-Dienst |
| GraphQL | Abfrage der Haltestellen- und Abfahrtsdaten |
| HTML und CSS | Aufbau und Gestaltung der Seite |
| JavaScript | Abruf der Daten und Aktualisierung der Oberfläche |

Der Browser ruft mit **GET** den lokalen Endpunkt `/api/departures` auf. Das Python-Backend sendet eine **POST**-Anfrage mit einer GraphQL-Abfrage an `https://abfahrtsmonitor.rnv-online.de/graphql`. Es verarbeitet die Antwort im JSON-Format und gibt die vorbereiteten Abfahrten an den Browser zurück. JavaScript stellt daraus die Tabellenzeilen zusammen.

## Lokal starten

Benötigt werden **Python 3.10 oder neuer** und eine Internetverbindung zum Abrufen der Abfahrtsdaten. Ein zusätzlicher API-Schlüssel ist im vorliegenden Code nicht vorgesehen.

### Linux / macOS

Im Hauptverzeichnis dieses Repositories:

```bash
cd rnv-abfahrtsmonitor
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Windows / PowerShell

Im Hauptverzeichnis dieses Repositories:

```powershell
cd rnv-abfahrtsmonitor
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Danach die Seite unter **http://127.0.0.1:8000/** im Browser öffnen. Die Seite wird über den laufenden FastAPI-Server ausgeliefert. Zum Beenden des Servers `Strg+C` im Terminal drücken.

Weitere lokale Adressen:

- JSON-Endpunkt: http://127.0.0.1:8000/api/departures
- Interaktive API-Dokumentation: http://127.0.0.1:8000/docs

## Projektdateien

- `main.py`: FastAPI-Routen, GraphQL-Abfrage und Aufbereitung der Daten
- `static/index.html`: Struktur der Seite
- `static/style.css`: Gestaltung und Anpassung an unterschiedliche Bildschirmgrößen
- `static/script.js`: Datenabruf, Tabellenanzeige und Uhr
- `requirements.txt`: Python-Abhängigkeiten

## Fehlerbehandlung

In dieser Implementierung liefert der Endpunkt bei einer abgefangenen `requests.Timeout`-Ausnahme den HTTP-Status **504**. Abgefangene `requests.RequestException`-, `ValueError`- und `KeyError`-Ausnahmen werden auf **502** abgebildet. Das betrifft zum Beispiel HTTP-Fehler des externen Dienstes, GraphQL-Fehlermeldungen oder fehlende erwartete Felder.

Eine erfolgreiche Antwort ohne nächste Abfahrten enthält eine leere Liste. Die Oberfläche zeigt dafür eine eigene Meldung an.

## Aktueller Stand und mögliche Erweiterungen

Die Haltestelle ist in der GraphQL-Abfrage auf **ID 2417** festgelegt. Auch die Überschrift und die Beschreibung in der HTML-Datei beziehen sich auf Mannheim Hauptbahnhof. Eine Haltestellensuche ist noch nicht umgesetzt.

Die Anwendung benötigt verfügbare Daten des externen rnv-Dienstes. Bisher wird jede Anfrage direkt weitergegeben; ein gemeinsamer Cache ist noch nicht vorhanden.

Mögliche Erweiterungen sind eine Haltestellenauswahl, eine umfangreichere Prüfung unerwarteter API-Antworten und ein Zwischenspeicher für Abfahrtsdaten.

**Autor:** Illia Ostapchuk
