// Elemente der Seite auswählen
const stationName = document.getElementById("station-name");
const monitor = document.getElementById("monitor");
const table = document.getElementById("departures-table");
const tableBody = document.getElementById("departures-body");

const message = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");

const connectionStatus = document.getElementById("connection-status");
const updatedAt = document.getElementById("updated-at");
const refreshButton = document.getElementById("refresh-button");

// Speichert, ob gerade eine Anfrage läuft
let isLoading = false;


function showMessage(state, title, text) {
    monitor.dataset.state = state;

    messageTitle.textContent = title;
    messageText.textContent = text;

    message.hidden = false;
}


function formatDeparture(departure) {
    // Zuerst den fertigen Abfahrtstext aus der API verwenden
    if (
        typeof departure.departure === "string" &&
        departure.departure.trim()
    ) {
        return departure.departure;
    }

    // Ersatzanzeige, wenn der Abfahrtstext leer ist
    if (departure.seconds === 0) {
        return "jetzt";
    }

    if (departure.seconds < 60) {
        return "in < 1 Min.";
    }

    return `in ${Math.ceil(departure.seconds / 60)} Min.`;
}


function addDeparture(departure) {
    const row = document.createElement("tr");

    const lineCell = document.createElement("td");
    const lineBadge = document.createElement("span");

    const destinationCell = document.createElement("td");

    const timeCell = document.createElement("td");
    const timeText = document.createElement("span");

    // Liniennummer
    lineBadge.className = "line-badge";
    lineBadge.textContent = departure.line;
    lineCell.append(lineBadge);

    // Fahrtrichtung
    destinationCell.className = "destination";
    destinationCell.textContent = departure.destination;

    // Abfahrtszeit
    timeCell.className = "time-column";
    timeText.className = "departure-time";
    timeText.textContent = formatDeparture(departure);
    timeCell.append(timeText);

    // Ausgefallene Fahrten mit einem Hinweis markieren
    if (departure.cancelled) {
        row.classList.add("cancelled");

        const cancelledLabel = document.createElement("span");
        cancelledLabel.className = "cancelled-label";
        cancelledLabel.textContent = "Fällt aus";

        timeCell.append(cancelledLabel);
    }

    // Die Tabellenzeile zusammensetzen und zur Tabelle hinzufügen
    row.append(lineCell, destinationCell, timeCell);
    tableBody.append(row);
}


async function loadDepartures() {
    // Keine neue Anfrage starten, solange die vorherige noch läuft
    if (isLoading) {
        return;
    }

    isLoading = true;
    refreshButton.disabled = true;
    monitor.setAttribute("aria-busy", "true");

    connectionStatus.textContent = "Wird aktualisiert …";
    monitor.dataset.state = "loading";

    // Beim ersten Abruf eine Lademeldung anzeigen
    if (table.hidden) {
        showMessage(
            "loading",
            "Abfahrten werden geladen",
            "Die aktuellen Verbindungen werden abgerufen."
        );
    }

    let errorText =
        "Die Abfahrten konnten nicht geladen werden. " +
        "Bitte versuche es erneut.";

    try {
        // Eine GET-Anfrage an unser FastAPI-Backend senden
        const response = await fetch(
            "/api/departures",
            { cache: "no-store" }
        );

        const data = await response.json();

        // Den HTTP-Status und das Feld "error" prüfen
        if (!response.ok || data.error) {
            if (typeof data.error === "string" && data.error) {
                errorText = data.error;
            }

            throw new Error(
                "Der Backend-Aufruf war nicht erfolgreich."
            );
        }

        // Die grundlegende Struktur der Antwort prüfen
        if (
            typeof data.station !== "string" ||
            !Array.isArray(data.departures)
        ) {
            throw new Error(
                "Die Antwort hat nicht das erwartete Format."
            );
        }

        stationName.textContent = data.station;

        // Die Tabellenzeilen der vorherigen Antwort entfernen
        tableBody.replaceChildren();

        if (data.departures.length === 0) {
            table.hidden = true;
            connectionStatus.textContent = "Keine Abfahrten";

            showMessage(
                "empty",
                "Momentan keine Abfahrten",
                "Für diese Haltestelle liegen zurzeit " +
                "keine nächsten Abfahrten vor."
            );
        } else {
            for (const departure of data.departures) {
                addDeparture(departure);
            }

            table.hidden = false;
            message.hidden = true;

            monitor.dataset.state = "ready";
            connectionStatus.textContent = "Aktuell";
        }

        updatedAt.textContent =
            "Zuletzt aktualisiert: " +
            new Date().toLocaleTimeString("de-DE");

    } catch (error) {
        // Bei einem Fehler die alten Abfahrten entfernen
        tableBody.replaceChildren();
        table.hidden = true;

        connectionStatus.textContent = "Verbindungsfehler";
        updatedAt.textContent = "Kein aktueller Datenstand";

        showMessage(
            "error",
            "Abfahrten nicht verfügbar",
            errorText
        );

        console.error(
            "Fehler beim Laden der Abfahrten:",
            error
        );

    } finally {
        // Wird sowohl nach einem Erfolg als auch nach einem Fehler ausgeführt
        isLoading = false;
        refreshButton.disabled = false;
        monitor.setAttribute("aria-busy", "false");
    }
}


function updateClock() {
    const now = new Date();
    const clock = document.getElementById("clock");

    clock.textContent = now.toLocaleTimeString(
        "de-DE",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    clock.dateTime = now.toISOString();

    document.getElementById("date").textContent =
        now.toLocaleDateString(
            "de-DE",
            {
                weekday: "long",
                day: "2-digit",
                month: "long"
            }
        );
}


// Die Daten beim Klick auf die Schaltfläche aktualisieren
refreshButton.addEventListener("click", loadDepartures);

// Die erste Anfrage direkt nach dem Öffnen der Seite starten
loadDepartures();

// Die Aktualisierung alle 30 Sekunden aufrufen
setInterval(loadDepartures, 30000);

// Die Uhr auf der Seite anzeigen und aktualisieren
updateClock();
setInterval(updateClock, 1000);