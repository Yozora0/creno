"""Serveur MCP Créno : expose l'API commerçant de Créno comme outils pour un agent IA (Hermes, Claude...).

Transport stdio : l'agent lance ce script en sous-processus. Aucune suppression n'est exposée ;
les seules écritures (statut d'un RDV, fermeture exceptionnelle) doivent être confirmées par le commerçant.
"""

from __future__ import annotations

import os
import secrets
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
    title="Créno - agenda et clients du salon",
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
    """Agenda du jour dans Créno, le logiciel de prise de RDV du salon : rendez-vous d'une journée (aujourd'hui
    par défaut), triés par heure, avec le chiffre d'affaires prévu. C'est LA source de vérité pour l'agenda,
    le calendrier et le planning du commerçant : n'utilise pas Google Calendar ni Outlook.

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
    """Agenda / calendrier / planning du salon dans Créno entre deux dates incluses (AAAA-MM-JJ), 92 jours max.

    Source de vérité pour les rendez-vous du commerçant (demain, cette semaine, le mois prochain...).
    """
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


# ---------- outils d'écriture : confirmation en deux temps imposée par le serveur ----------
#
# Le premier appel ne modifie rien : il renvoie un récapitulatif et un code à usage unique.
# L'action ne s'exécute qu'au second appel, avec ce code, pour exactement les mêmes paramètres.
# Le code expire au bout de 10 minutes.

CONFIRMATION_TTL = timedelta(minutes=10)
_pending: dict[str, tuple[tuple, datetime]] = {}


def _ask_confirmation(action: tuple, recap: dict) -> dict:
    now = datetime.now(timezone.utc)
    for code, (_, expires) in list(_pending.items()):
        if expires < now:
            del _pending[code]
    code = f"{secrets.randbelow(9000) + 1000}"
    _pending[code] = (action, now + CONFIRMATION_TTL)
    return {
        "etat": "EN ATTENTE DE CONFIRMATION - rien n'a été modifié",
        "recapitulatif": recap,
        "code_confirmation": code,
        "consigne": (
            "Montre ce récapitulatif au commerçant et demande-lui s'il confirme. Rappelle l'outil avec "
            "code_confirmation uniquement après un « oui » explicite de sa part dans un nouveau message."
        ),
    }


def _check_confirmation(code: str, action: tuple) -> None:
    entry = _pending.pop(code.strip(), None)
    if entry is None or entry[1] < datetime.now(timezone.utc):
        raise ToolError("Code de confirmation invalide ou expiré : refais l'appel sans code pour en obtenir un.")
    if entry[0] != action:
        raise ToolError("Ce code a été émis pour une autre action : refais l'appel sans code.")


def _find_rdv(rdv_id: int) -> dict:
    today = datetime.now(TZ).date()
    for a in _planning(today - timedelta(days=60), today + timedelta(days=90)):
        if a["id"] == rdv_id:
            return a
    raise ToolError(f"Aucun rendez-vous n°{rdv_id} entre il y a 60 jours et dans 90 jours.")


@mcp.tool(annotations=ECRITURE)
def marquer_rdv(rdv_id: int, statut: str, code_confirmation: str | None = None) -> dict:
    """Change le statut d'un rendez-vous : 'honoré', 'absent' ou 'annulé'. Une annulation libère le créneau.

    Fonctionne en deux temps : appelle d'abord SANS code_confirmation (rien n'est modifié, tu reçois un
    récapitulatif et un code), montre le récapitulatif au commerçant, puis rappelle avec le code
    seulement s'il répond « oui ».
    """
    codes = {v: k for k, v in STATUTS.items() if k != "BOOKED"}
    code = codes.get(statut.strip().lower())
    if code is None:
        raise ToolError("Statut attendu : 'honoré', 'absent' ou 'annulé'.")
    action = ("marquer_rdv", rdv_id, code)
    if not code_confirmation:
        rdv = _rdv(_find_rdv(rdv_id))
        return _ask_confirmation(action, {"action": f"passer le RDV en « {STATUTS[code]} »", "rdv": rdv})
    _check_confirmation(code_confirmation, action)
    result = _rdv(api.request("PATCH", f"/api/admin/appointments/{rdv_id}/status", json={"status": code}))
    return {"etat": "FAIT", "rdv": result}


@mcp.tool(annotations=ECRITURE)
def ajouter_fermeture(debut: str, fin: str, motif: str = "", code_confirmation: str | None = None) -> dict:
    """Ferme le commerce sur des journées entières (dates incluses, AAAA-MM-JJ), ex. congés.

    Une demi-journée n'est pas possible. Les RDV déjà pris ne sont pas annulés : ils sont listés pour
    être prévenus. Fonctionne en deux temps comme marquer_rdv : d'abord sans code_confirmation, puis
    avec le code après un « oui » du commerçant.
    """
    d1, d2 = _parse_date(debut, "debut"), _parse_date(fin, "fin")
    if d2 < d1:
        raise ToolError("La date de fin doit être égale ou postérieure à la date de début.")
    action = ("ajouter_fermeture", d1, d2, motif.strip())
    deja_pris = [_rdv(a) for a in _planning(d1, d2) if a["status"] == "BOOKED"] if (d2 - d1).days <= 92 else []
    if not code_confirmation:
        return _ask_confirmation(action, {
            "action": f"fermer du {d1:%d/%m/%Y} au {d2:%d/%m/%Y} inclus" + (f" ({motif.strip()})" if motif.strip() else ""),
            "rdv_deja_pris_a_prevenir": deja_pris,
        })
    _check_confirmation(code_confirmation, action)
    fermeture = api.request("POST", "/api/admin/closures",
                            json={"startDate": d1.isoformat(), "endDate": d2.isoformat(), "reason": motif.strip() or None})
    return {"etat": "FAIT", "fermeture": fermeture, "rdv_a_prevenir": deja_pris}


if __name__ == "__main__":
    mcp.run()
