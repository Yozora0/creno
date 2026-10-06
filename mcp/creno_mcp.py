"""Serveur MCP Créno : expose l'API commerçant de Créno comme outils pour un agent IA (Hermes, Claude...).

Transport stdio : l'agent lance ce script en sous-processus. Aucune suppression n'est exposée ;
les seules écritures (statut d'un RDV, fermeture exceptionnelle) doivent être confirmées par le commerçant.
"""

from __future__ import annotations

import os
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import httpx
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations

API_URL = os.environ.get("CRENO_API_URL", "http://localhost:8080").rstrip("/")
EMAIL = os.environ.get("CRENO_ADMIN_EMAIL", "")
PASSWORD = os.environ.get("CRENO_ADMIN_PASSWORD", "")
TZ = ZoneInfo(os.environ.get("CRENO_TZ", "Europe/Paris"))
MAX_DAYS = 31  # limite imposée par GET /api/admin/appointments
STATUTS = {"BOOKED": "réservé", "COMPLETED": "honoré", "NO_SHOW": "absent", "CANCELLED": "annulé"}

mcp = MCPServer(
    "creno",
    instructions=(
        "Outils de gestion d'un salon sur Créno (prise de RDV en ligne). Ton interlocuteur est le commerçant "
        "lui-même, jamais un client : tutoie-le, parle de « tes rendez-vous », « tes clients », et ne lui propose "
        "pas de réserver. Réponds en français, de façon concise. Les heures sont celles du commerce. "
        "Avant toute action d'écriture, récapitule-la et attends une confirmation explicite."
    ),
)
LECTURE = ToolAnnotations(readOnlyHint=True, openWorldHint=False)
ECRITURE = ToolAnnotations(readOnlyHint=False, destructiveHint=False, openWorldHint=False)


class CrenoClient:
    """Client HTTP qui se connecte en commerçant et garde le JWT (valable 8 h) jusqu'à expiration."""

    def __init__(self) -> None:
        # Render met jusqu'à ~1 min à réveiller l'API endormie : timeout large.
        self.http = httpx.Client(base_url=API_URL, timeout=90)
        self.token: str | None = None
        self.expires_at: datetime | None = None

    def _login(self) -> None:
        if not EMAIL or not PASSWORD:
            raise ToolError("CRENO_ADMIN_EMAIL et CRENO_ADMIN_PASSWORD doivent être définis.")
        r = self.http.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if r.status_code >= 400:
            raise ToolError(f"Connexion commerçant refusée ({r.status_code}) : vérifie l'email et le mot de passe.")
        body = r.json()
        if body["user"]["role"] != "ADMIN":
            raise ToolError("Ce compte n'est pas commerçant (rôle ADMIN requis).")
        self.token = body["token"]
        self.expires_at = datetime.fromisoformat(body["expiresAt"].replace("Z", "+00:00"))

    def request(self, method: str, path: str, **kwargs):
        try:
            return self._request(method, path, **kwargs)
        except httpx.HTTPError as exc:
            raise ToolError(f"API Créno injoignable ({API_URL}) : {exc.__class__.__name__}.") from exc

    def _request(self, method: str, path: str, **kwargs):
        needs_login = self.token is None or (
            self.expires_at is not None and datetime.now(timezone.utc) > self.expires_at - timedelta(minutes=5)
        )
        if needs_login:
            self._login()
        r = self.http.request(method, path, headers={"Authorization": f"Bearer {self.token}"}, **kwargs)
        if r.status_code == 401:  # jeton révoqué ou secret JWT changé : on retente une fois
            self._login()
            r = self.http.request(method, path, headers={"Authorization": f"Bearer {self.token}"}, **kwargs)
        if r.status_code >= 400:
            raise ToolError(f"API Créno {r.status_code} : {_api_error(r)}")
        return r.json() if r.content else None


def _api_error(r: httpx.Response) -> str:
    try:
        body = r.json()
        return body.get("detail") or body.get("message") or str(body)
    except ValueError:
        return r.text[:300]


api = CrenoClient()


# ---------- mise en forme ----------

def _local(instant: str) -> datetime:
    return datetime.fromisoformat(instant.replace("Z", "+00:00")).astimezone(TZ)


def _euros(cents: int) -> str:
    return f"{cents / 100:.2f} €".replace(".", ",")


def _rdv(a: dict) -> dict:
    debut, fin = _local(a["startAt"]), _local(a["endAt"])
    return {
        "id": a["id"],
        "date": debut.strftime("%Y-%m-%d"),
        "heure": f"{debut:%H:%M}–{fin:%H:%M}",
        "prestation": a["serviceName"],
        "prix": _euros(a["priceCents"]),
        "statut": STATUTS.get(a["status"], a["status"]),
        "client": a["clientName"],
        "client_id": a["clientId"],
        "telephone": a.get("clientPhone"),
        "email": a.get("clientEmail"),
    }


def _parse_date(value: str, field: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ToolError(f"{field} doit être au format AAAA-MM-JJ (reçu : {value!r}).") from exc


def _planning(debut: date, fin: date) -> list[dict]:
    """Planning brut, découpé en tranches de 31 jours pour respecter la limite de l'API."""
    result, cursor = [], debut
    while cursor <= fin:
        stop = min(cursor + timedelta(days=MAX_DAYS - 1), fin)
        result += api.request("GET", "/api/admin/appointments",
                              params={"from": cursor.isoformat(), "to": stop.isoformat()})
        cursor = stop + timedelta(days=1)
    return result


# ---------- outils de lecture ----------

@mcp.tool(annotations=LECTURE)
def rdv_du_jour(jour: str | None = None) -> dict:
    """Rendez-vous d'une journée (aujourd'hui par défaut), triés par heure, avec le chiffre d'affaires prévu.

    jour : date au format AAAA-MM-JJ, optionnelle.
    """
    d = _parse_date(jour, "jour") if jour else datetime.now(TZ).date()
    rdvs = sorted(_planning(d, d), key=lambda a: a["startAt"])
    actifs = [a for a in rdvs if a["status"] != "CANCELLED"]
    return {
        "jour": d.isoformat(),
        "nombre_rdv": len(actifs),
        "ca_prevu": _euros(sum(a["priceCents"] for a in actifs)),
        "rdv": [_rdv(a) for a in rdvs],
    }


@mcp.tool(annotations=LECTURE)
def rdv_periode(debut: str, fin: str) -> list[dict]:
    """Planning des rendez-vous entre deux dates incluses (AAAA-MM-JJ), 92 jours maximum."""
    d1, d2 = _parse_date(debut, "debut"), _parse_date(fin, "fin")
    if d2 < d1:
        raise ToolError("La date de fin doit être égale ou postérieure à la date de début.")
    if (d2 - d1).days > 92:
        raise ToolError("Période limitée à 92 jours : découpe la demande.")
    return [_rdv(a) for a in sorted(_planning(d1, d2), key=lambda a: a["startAt"])]


@mcp.tool(annotations=LECTURE)
def nouvelles_reservations(depuis_heures: int = 24) -> list[dict]:
    """Rendez-vous à venir (60 prochains jours) réservés au cours des N dernières heures."""
    depuis_heures = max(1, min(depuis_heures, 24 * 30))
    seuil = datetime.now(timezone.utc) - timedelta(hours=depuis_heures)
    today = datetime.now(TZ).date()
    rdvs = _planning(today, today + timedelta(days=60))
    recents = [a for a in rdvs if a["status"] == "BOOKED" and _local(a["createdAt"]) >= seuil]
    return [_rdv(a) for a in sorted(recents, key=lambda a: a["createdAt"], reverse=True)]


@mcp.tool(annotations=LECTURE)
def clients_inactifs(mois_sans_visite: int = 3, historique_mois: int = 12) -> list[dict]:
    """Clients venus au moins une fois mais pas depuis N mois, et sans rendez-vous à venir.

    Utile pour une campagne de relance. Le résultat donne la dernière visite et le nombre de visites.
    mois_sans_visite : 1 à 12 (défaut 3). historique_mois : profondeur d'analyse, 3 à 24 (défaut 12).
    """
    mois_sans_visite = max(1, min(mois_sans_visite, 12))
    historique_mois = max(mois_sans_visite, min(historique_mois, 24))
    today = datetime.now(TZ).date()
    rdvs = _planning(today - timedelta(days=30 * historique_mois), today + timedelta(days=60))

    visites: dict[int, list[dict]] = defaultdict(list)
    a_venir: set[int] = set()
    for a in rdvs:
        if a["status"] == "COMPLETED":
            visites[a["clientId"]].append(a)
        elif a["status"] == "BOOKED" and _local(a["startAt"]).date() >= today:
            a_venir.add(a["clientId"])

    seuil = today - timedelta(days=30 * mois_sans_visite)
    result = []
    for client_id, vs in visites.items():
        derniere = max(vs, key=lambda a: a["startAt"])
        if client_id in a_venir or _local(derniere["startAt"]).date() >= seuil:
            continue
        result.append({
            "client_id": client_id,
            "client": derniere["clientName"],
            "telephone": derniere.get("clientPhone"),
            "email": derniere.get("clientEmail"),
            "derniere_visite": _local(derniere["startAt"]).strftime("%Y-%m-%d"),
            "derniere_prestation": derniere["serviceName"],
            "nombre_visites": len(vs),
        })
    return sorted(result, key=lambda c: c["derniere_visite"])


@mcp.tool(annotations=LECTURE)
def horaires_et_fermetures() -> dict:
    """Horaires d'ouverture hebdomadaires et fermetures exceptionnelles à venir."""
    today = datetime.now(TZ).date().isoformat()
    fermetures = [f for f in api.request("GET", "/api/closures") if f["endDate"] >= today]
    return {"horaires": api.request("GET", "/api/opening-hours"), "fermetures": fermetures}


@mcp.tool(annotations=LECTURE)
def prestations() -> list[dict]:
    """Catalogue des prestations actives (nom, durée, prix)."""
    return [
        {"id": s["id"], "nom": s["name"], "duree_min": s["durationMinutes"], "prix": _euros(s["priceCents"])}
        for s in api.request("GET", "/api/services")
    ]


# ---------- outils d'écriture (confirmation obligatoire) ----------

@mcp.tool(annotations=ECRITURE)
def marquer_rdv(rdv_id: int, statut: str) -> dict:
    """Change le statut d'un rendez-vous : 'honoré', 'absent' ou 'annulé'.

    ACTION D'ÉCRITURE : avant d'appeler cet outil, récapitule au commerçant le RDV concerné
    (client, date, heure) et attends sa confirmation explicite. Une annulation libère le créneau.
    """
    codes = {v: k for k, v in STATUTS.items() if k != "BOOKED"}
    code = codes.get(statut.strip().lower())
    if code is None:
        raise ToolError("Statut attendu : 'honoré', 'absent' ou 'annulé'.")
    return _rdv(api.request("PATCH", f"/api/admin/appointments/{rdv_id}/status", json={"status": code}))


@mcp.tool(annotations=ECRITURE)
def ajouter_fermeture(debut: str, fin: str, motif: str = "") -> dict:
    """Ferme le commerce sur des journées entières (dates incluses, AAAA-MM-JJ), ex. congés.

    ACTION D'ÉCRITURE : confirme les dates avec le commerçant avant d'appeler. Les fermetures se font
    à la journée : une demi-journée n'est pas possible. Les RDV déjà pris sur ces jours ne sont pas annulés :
    vérifie-les avec rdv_periode et signale-les.
    """
    d1, d2 = _parse_date(debut, "debut"), _parse_date(fin, "fin")
    deja_pris = [a for a in _planning(d1, d2) if a["status"] == "BOOKED"] if (d2 - d1).days <= 92 else []
    fermeture = api.request("POST", "/api/admin/closures",
                            json={"startDate": d1.isoformat(), "endDate": d2.isoformat(), "reason": motif or None})
    return {"fermeture": fermeture, "rdv_a_prevenir": [_rdv(a) for a in deja_pris]}


if __name__ == "__main__":
    mcp.run()
