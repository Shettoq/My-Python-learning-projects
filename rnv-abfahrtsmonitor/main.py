from pathlib import Path

import requests
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles


app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

API = "https://abfahrtsmonitor.rnv-online.de/graphql"
query = """
query {
  getState(id: 2417, excludeVrn: false) {
    stationMainInformation {
      specialinfos {
        text
        priority
      }
      departures {
        lineText
        stopText
        id
        cancelled
        departureText
        vehicleType
        barrierFree
        destinationText
        primaryColor
        departureInSeconds
        occupancy
      }
    }
    stationName
  }
}
"""


def get_departures():
    response = requests.post(
        API,
        json={"query": query},
        headers={
            "Accept": "application/graphql-response+json, application/json"
        },
        timeout=10,
    )
    response.raise_for_status()
    result = response.json()
    if result.get("errors"):
        raise ValueError("GraphQL API returned an error")
    state = (result.get("data") or {}).get("getState")
    if not state:
        raise ValueError("API returned no station data")
    raw_departures = state["stationMainInformation"]["departures"]

    departures = []
    for item in raw_departures:
        seconds = item.get("departureInSeconds")
        if seconds is None or seconds < 0:
            continue
        departures.append({
            "line": item["lineText"],
            "destination": item["destinationText"],
            "departure": item["departureText"],
            "seconds": seconds,
            "cancelled": item["cancelled"],
        })
    departures.sort(key=lambda item: item["seconds"])
    return {
        "station": state["stationName"],
        "departures": departures[:10],
        "error": None,
    }


@app.get("/", response_class=FileResponse, include_in_schema=False)
def index():
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/api/departures")
def departures_api():
    try:
        return get_departures()
    except requests.Timeout:
        return JSONResponse(
            status_code=504,
            content={
                "station": None,
                "departures": [],
                "error": "Zeitüberschreitung beim Abruf.",
            },
        )
    except (requests.RequestException, ValueError, KeyError) as exc:
        print("Error Source:", repr(exc))
        return JSONResponse(
            status_code=502,
            content={
                "station": None,
                "departures": [],
                "error": "Daten momentan nicht verfügbar.",
            },
        )