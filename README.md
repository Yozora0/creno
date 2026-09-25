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
| 🔜 | Choix d'un créneau libre et réservation | Planning jour / semaine |
| 🔜 | Mes rendez-vous, annulation | Statut des RDV (honoré, absent, annulé) |

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
│       ├── appointment/     rendez-vous
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

- **Anti double-réservation au niveau de la base.** Une contrainte PostgreSQL `EXCLUDE USING gist` interdit que deux rendez-vous actifs se chevauchent, même si deux clients valident le même créneau à la même milliseconde. La réservation vérifiera aussi la disponibilité côté applicatif (semaine 2), mais la base reste le dernier rempart.
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

Variante sans Java ni Maven installés : `docker compose --profile full up -d --build` lance la base et l'API ensemble.

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
| GET / POST / PUT / DELETE | `/api/admin/services[/{id}]` | ADMIN |
| PUT | `/api/admin/opening-hours` | ADMIN |
| POST / DELETE | `/api/admin/closures[/{id}]` | ADMIN |

Documentation complète et interactive : `/swagger-ui.html`.

## Feuille de route

- [x] **Semaine 1** : fondations, authentification, prestations, horaires
- [ ] **Semaine 2** : calcul des créneaux disponibles, réservation, espace client
- [ ] **Semaine 3** : planning commerçant, emails de confirmation, déploiement
- [ ] **v2** : plusieurs employés, paiement d'acompte, rappels SMS, multi-commerces

---

Pablo Correia Mourato · [pablomourato.fr](https://pablomourato.fr) · [GitHub](https://github.com/Yozora0) · [LinkedIn](https://www.linkedin.com/in/pablo-correiamourato)
