# Créno

**Prise de rendez-vous en ligne pour un commerce de proximité.**
Les clients réservent un créneau en quelques clics, le commerçant gère ses prestations, ses horaires et son planning depuis un back-office.

> Projet full stack réalisé dans le cadre de mon portfolio : **Spring Boot · React · TypeScript · PostgreSQL**.

---

## Fonctionnalités

| | Client | Commerçant |
|---|---|---|
| ✅ | Catalogue des prestations (durée, prix) | CRUD des prestations, activation / désactivation |
| ✅ | Horaires et fermetures à venir | Horaires hebdomadaires (plusieurs plages par jour) |
| ✅ | Inscription / connexion | Fermetures exceptionnelles (congés, jours fériés) |
| ✅ | Choix d'un jour et d'un créneau libre, réservation | Planning de la semaine avec indicateurs (RDV, CA prévu, absences) |
| ✅ | Mes rendez-vous, annulation (jusqu'à 2 h avant) | Statut des RDV : honoré, absent, annulé |
| ✅ | Emails de confirmation et d'annulation | Email automatique au client si le salon annule |

## Stack

- **Back** : Java 21, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, PostgreSQL 16, Flyway, springdoc-openapi
- **Front** : React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form + Zod, Tailwind CSS 4
- **Qualité** : JUnit 5, Testcontainers, MockMvc, oxlint, GitHub Actions
- **Infra** : Docker, docker-compose

## Architecture

```
creno/
├── backend/                 API REST Spring Boot
│   └── src/main/java/com/creno/
│       ├── auth/            inscription, connexion, émission des JWT
│       ├── user/            utilisateurs et rôles (CLIENT, ADMIN)
│       ├── offering/        prestations (catalogue public + admin)
│       ├── schedule/        horaires d'ouverture et fermetures
│       ├── availability/    calcul des créneaux disponibles
│       ├── appointment/     réservation, mes rendez-vous, planning commerçant
│       ├── notification/    emails (confirmation, annulation)
│       ├── config/          sécurité, CORS, OpenAPI, horloge
│       └── common/          erreurs métier → ProblemDetail (RFC 9457)
├── frontend/                SPA React
│   └── src/
│       ├── api/             hooks TanStack Query par domaine
│       ├── auth/            contexte d'authentification, garde de routes
│       ├── components/      layout et composants UI
│       └── pages/           pages publiques et back-office
└── docker-compose.yml
```

Le code back est organisé **par fonctionnalité** (et non par couche technique) : tout ce qui concerne les horaires est dans `schedule/`, ce qui rend chaque domaine lisible et facile à faire évoluer.

## Choix techniques

- **Calcul des créneaux dans une classe pure** (`SlotCalculator`) : horaires du jour, pas de 15 min, durée de la prestation, RDV existants et délai minimum sont passés en paramètres. Aucune dépendance à Spring ni à la base, donc des tests unitaires simples, y compris sur le changement d'heure.
- **Anti double-réservation en deux barrières.** À la réservation, l'API recalcule les créneaux et refuse toute heure qui n'en fait pas partie (on ne fait jamais confiance à l'heure envoyée par le client). Si deux clients passent cette vérification au même instant, une contrainte PostgreSQL `EXCLUDE USING gist` refuse le second enregistrement, traduit en 409. Un test lance 8 réservations simultanées du même créneau : une seule réussit.
- **Emails envoyés après le commit et en arrière-plan** (`@TransactionalEventListener(AFTER_COMMIT)` + `@Async`) : aucun email pour une réservation qui échoue, et un serveur SMTP lent ou en panne ne bloque jamais la réservation. Sans SMTP configuré, l'email est écrit dans les logs.
- **Règles de statut dans l'entité** (`Appointment.changeStatusByShop`) : on ne marque « honoré » ou « absent » qu'un RDV commencé, on n'annule qu'un RDV réservé, et un RDV ne redevient jamais « réservé » (le créneau a pu être repris).
- **Fuseau horaire maîtrisé** : les horaires du salon sont en heure de Paris, les RDV sont stockés en instants UTC (`timestamptz`), et le front affiche toujours l'heure du salon, quel que soit le fuseau du visiteur.
- **La sélection vit dans l'URL** (`/reserver/2?date=…&start=…`) : un visiteur non connecté qui choisit un créneau le retrouve après s'être connecté.
- **JWT via le resource server de Spring Security** plutôt qu'un filtre maison : la validation de la signature et de l'expiration est assurée par une brique éprouvée, et les rôles sont lus depuis le claim `roles`.
- **Schéma géré uniquement par Flyway** (`ddl-auto: validate`) : chaque évolution de la base est versionnée et rejouable.
- **Prix stockés en centimes** (entiers) pour éviter les erreurs d'arrondi des nombres flottants.
- **Erreurs homogènes** au format `application/problem+json`, avec le détail par champ pour les erreurs de validation (affichées directement sous les champs du formulaire côté front).
- **Horloge injectée** (`Clock`) pour rendre testable toute la logique qui dépend de la date du jour.
- **Validation en double** : Zod côté front pour le confort, Bean Validation côté back pour la sécurité.

## Lancer le projet en local

**Prérequis** : Docker, Java 21 et Node 22. Maven n'a pas besoin d'être installé : le projet embarque le Maven Wrapper (`mvnw`), qui télécharge la bonne version au premier lancement.

```bash
# 1. Base de données
docker compose up -d db

# 2. API (profil "demo" = données de démonstration)
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo   # Windows : .\mvnw.cmd ...
# → http://localhost:8080/swagger-ui.html

# 3. Front
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Variante sans Java installé : `docker compose --profile full up -d --build` lance la base, l'API et Mailpit ensemble.

### Voir les emails en local

```bash
docker compose up -d mailpit
# puis lancer l'API avec SPRING_MAIL_HOST=localhost et SPRING_MAIL_PORT=1025
```

Les emails envoyés apparaissent sur http://localhost:8025.

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Commerçant | admin@creno.dev | Admin123! |
| Client | client@creno.dev | Client123! |

## Tests

```bash
cd backend && ./mvnw verify      # tests unitaires + intégration (PostgreSQL via Testcontainers, Docker requis)
cd frontend && npm run lint && npm run build
```

Les tests d'intégration tournent contre un vrai PostgreSQL, avec les migrations Flyway et la sécurité activées : ils vérifient les règles d'accès (401 / 403), la validation et les règles métier.

## API (extrait)

| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | connecté |
| GET | `/api/services`, `/api/opening-hours`, `/api/closures` | public |
| GET | `/api/services/{id}/availability?date=YYYY-MM-DD` | public |
| POST | `/api/appointments` | connecté |
| GET | `/api/appointments/me` | connecté |
| POST | `/api/appointments/{id}/cancel` | propriétaire du RDV |
| GET | `/api/admin/appointments?from=…&to=…` | ADMIN |
| PATCH | `/api/admin/appointments/{id}/status` | ADMIN |
| GET / POST / PUT / DELETE | `/api/admin/services[/{id}]` | ADMIN |
| PUT | `/api/admin/opening-hours` | ADMIN |
| POST / DELETE | `/api/admin/closures[/{id}]` | ADMIN |

Documentation complète et interactive : `/swagger-ui.html`.

## Déploiement

- **API + base** sur [Render](https://render.com) : le fichier `render.yaml` décrit le service Docker et la base PostgreSQL (New → Blueprint).
- **Front** sur [Vercel](https://vercel.com) : dossier racine `frontend`, variable `VITE_API_URL` = URL de l'API. `vercel.json` redirige toutes les routes vers `index.html` (application monopage).
- Côté API, `CORS_ALLOWED_ORIGINS` et `FRONTEND_URL` reçoivent l'URL du front.

## Feuille de route

- [x] **Semaine 1** : fondations, authentification, prestations, horaires
- [x] **Semaine 2** : calcul des créneaux disponibles, réservation, espace client
- [x] **Semaine 3** : planning commerçant, emails de confirmation, préparation du déploiement
- [ ] **v2** : plusieurs employés, paiement d'acompte, rappels SMS, multi-commerces

---

Pablo Correia Mourato · [pablomourato.fr](https://pablomourato.fr) · [GitHub](https://github.com/Yozora0) · [LinkedIn](https://www.linkedin.com/in/pablo-correiamourato)
