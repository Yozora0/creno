# Serveur MCP Créno

Expose l'espace commerçant de Créno à un agent IA via le [Model Context Protocol](https://modelcontextprotocol.io).
Le commerçant pilote son agenda en langage naturel, depuis Discord avec [Hermes Agent](https://github.com/NousResearch/hermes-agent)
ou depuis n'importe quel client MCP.

```
Discord ──► Hermes Agent ──stdio/MCP──► creno_mcp.py ──HTTPS + JWT──► API Spring Boot ──► PostgreSQL
```

> « Qu'est-ce que j'ai demain ? » · « Quels clients ne sont pas revenus depuis 3 mois ? » ·
> « Marque le RDV de Léa comme honoré » · « Ferme le salon du 24 au 26 décembre »

## Outils

| Outil | Type | Rôle |
|---|---|---|
| `rdv_du_jour` | lecture | RDV d'une journée et chiffre d'affaires prévu |
| `rdv_periode` | lecture | Planning entre deux dates (92 j max, découpé en tranches de 31 j pour l'API) |
| `nouvelles_reservations` | lecture | RDV réservés ces N dernières heures |
| `clients_inactifs` | lecture | Clients venus mais pas depuis N mois, sans RDV à venir (relance) |
| `horaires_et_fermetures` | lecture | Horaires hebdomadaires et fermetures à venir |
| `prestations` | lecture | Catalogue (durée, prix) |
| `marquer_rdv` | écriture | Statut d'un RDV : honoré, absent ou annulé |
| `ajouter_fermeture` | écriture | Fermeture à la journée ; signale les RDV déjà pris à prévenir |

## Choix de sécurité

- **Aucune suppression exposée** (prestations, fermetures, horaires restent gérés dans le back-office).
- **Écritures en deux temps, imposées par le serveur** : le premier appel de `marquer_rdv` ou `ajouter_fermeture`
  ne modifie rien et renvoie un récapitulatif avec un code à usage unique (10 min, lié aux paramètres exacts).
  L'action ne s'exécute qu'au second appel avec ce code. Une simple consigne dans la description d'outil
  ne suffisait pas : en test, un modèle gratuit a annulé un RDV sans rien demander.
- **Droits portés par l'API** : le serveur se connecte avec un compte commerçant ; c'est Spring Security qui vérifie
  le rôle `ADMIN` sur `/api/admin/**`. Le JWT est gardé en mémoire et renouvelé à son expiration (8 h).
- **Identifiants hors du code** : variables d'environnement uniquement (`.env` ignoré par git).
- **Erreurs lisibles par l'agent** (`ToolError`) sans fuite de traces serveur.

## Installation (WSL2, là où tourne Hermes)

```bash
cd "/mnt/c/Users/pablo/Documents/projet portfolio/creno/mcp"
python3 -m venv ~/.venvs/creno-mcp
~/.venvs/creno-mcp/bin/pip install -r requirements.txt
```

## Brancher sur Hermes

Dans `~/.hermes/config.yaml` :

```yaml
mcp_servers:
  creno:
    command: "/home/<utilisateur-wsl>/.venvs/creno-mcp/bin/python"
    args: ["/mnt/c/Users/pablo/Documents/projet portfolio/creno/mcp/creno_mcp.py"]
    env:
      CRENO_API_URL: "https://creno-api-8aj7.onrender.com"
      CRENO_ADMIN_EMAIL: "admin@creno.dev"
      CRENO_ADMIN_PASSWORD: "Admin123!"
    timeout: 120
```

Puis `/reload-mcp` dans une conversation Hermes.

**À savoir**
- L'API Render s'endort : le premier appel peut prendre ~1 min (le client HTTP attend 90 s).
- En local (`docker compose up`), WSL2 ne voit pas toujours le `localhost` de Windows : activer
  `networkingMode=mirrored` dans `%UserProfile%\.wslconfig`, ou viser l'URL Render.
- Chaque connexion du serveur MCP compte comme une connexion commerçant : elle décale le repère
  « nouveautés depuis ma dernière visite » du back-office. Évolution prévue : un compte dédié à l'agent.

## Discord

Bot créé sur le [portail développeur](https://discord.com/developers/applications) avec les intents
*Message Content* et *Server Members*, puis `hermes gateway setup` (ou `DISCORD_BOT_TOKEN` et
`DISCORD_ALLOWED_USERS` dans `~/.hermes/.env`) et `hermes gateway`.
Voir la [doc Discord d'Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/discord).

## Données de démo

Le jeu de démo de l'API est daté du premier déploiement : ses RDV finissent par être tous passés.
[`demo/seed_agent_demo.sql`](demo/seed_agent_demo.sql), à coller dans la console SQL de Neon, ajoute 6 clients
fictifs, des RDV sur les 14 prochains jours (dont des « nouveaux ») et un historique avec 2 clients inactifs.
Il respecte les horaires, les fermetures et les RDV réels déjà réservés, et peut être rejoué pour recaler les dates.

## Tester sans Hermes

```bash
npx @modelcontextprotocol/inspector ~/.venvs/creno-mcp/bin/python creno_mcp.py
```
