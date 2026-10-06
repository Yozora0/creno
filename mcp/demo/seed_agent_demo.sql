-- =====================================================================
-- Données de démo pour l'agent IA (à exécuter dans la console SQL Neon).
-- - 6 clients fictifs (@demo-agent.creno, sans connexion possible)
-- - des RDV à venir sur les 14 prochains jours (dont quelques « nouveaux »)
-- - un historique : visites récentes, une absence, et 2 clients inactifs
--   depuis plus de 3 mois (pour l'outil clients_inactifs)
-- Rejouable : supprime d'abord les RDV de ces clients puis les recrée,
-- avec des dates recalculées par rapport à aujourd'hui.
-- =====================================================================
BEGIN;

INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES
    ('a.sophie.bernard@demo-agent.creno', '!compte-de-demo-sans-connexion', 'Sophie', 'Bernard', '06 11 22 33 44', 'CLIENT'),
    ('b.karim.benali@demo-agent.creno',   '!compte-de-demo-sans-connexion', 'Karim',  'Benali',  '06 22 33 44 55', 'CLIENT'),
    ('c.julie.fontaine@demo-agent.creno', '!compte-de-demo-sans-connexion', 'Julie',  'Fontaine','07 33 44 55 66', 'CLIENT'),
    ('d.marc.dupuis@demo-agent.creno',    '!compte-de-demo-sans-connexion', 'Marc',   'Dupuis',  '06 44 55 66 77', 'CLIENT'),
    ('e.emma.girard@demo-agent.creno',    '!compte-de-demo-sans-connexion', 'Emma',   'Girard',  NULL,             'CLIENT'),
    ('f.lucas.mercier@demo-agent.creno',  '!compte-de-demo-sans-connexion', 'Lucas',  'Mercier', '07 55 66 77 88', 'CLIENT')
ON CONFLICT (email) DO NOTHING;

DELETE FROM appointments
WHERE client_id IN (SELECT id FROM users WHERE email LIKE '%@demo-agent.creno');

-- RDV à venir : 3 créneaux par jour d'ouverture (mar.-sam.), répartis entre Sophie, Karim, Julie et Marc.
WITH c AS (
    SELECT id, row_number() OVER (ORDER BY email) - 1 AS i
    FROM users WHERE email LIKE '%@demo-agent.creno'
), s AS (
    SELECT id, duration_minutes, row_number() OVER (ORDER BY id) - 1 AS i
    FROM services WHERE active
), slot AS (
    SELECT ((dd.d + t) AT TIME ZONE 'Europe/Paris') AS start_at, dd.d
    FROM generate_series(0, 13) AS g(k)
    CROSS JOIN LATERAL (SELECT (now() AT TIME ZONE 'Europe/Paris')::date + g.k AS d) dd
    CROSS JOIN LATERAL unnest(CASE
        WHEN extract(isodow FROM dd.d) BETWEEN 2 AND 5 THEN ARRAY['10:00', '14:30', '16:30']::time[]
        WHEN extract(isodow FROM dd.d) = 6             THEN ARRAY['09:30', '11:00', '14:00']::time[]
        ELSE ARRAY[]::time[] END) AS t
), x AS (
    SELECT slot.start_at, row_number() OVER (ORDER BY slot.start_at) AS n
    FROM slot
    WHERE slot.start_at > now() + interval '1 hour'
      AND NOT EXISTS (SELECT 1 FROM closures f WHERE slot.d BETWEEN f.start_date AND f.end_date)
)
INSERT INTO appointments (client_id, service_id, start_at, end_at, status, created_at)
SELECT c.id, s.id, x.start_at, x.start_at + make_interval(mins => s.duration_minutes), 'BOOKED',
       CASE WHEN x.n % 3 = 0 THEN now() - make_interval(hours => 2 + (x.n % 6)::int)
            ELSE now() - make_interval(days => 2 + (x.n % 5)::int) END
FROM x
JOIN c ON c.i = x.n % 4
JOIN s ON s.i = x.n % (SELECT count(*) FROM s)
WHERE NOT EXISTS (   -- ne jamais chevaucher un RDV réel déjà réservé
    SELECT 1 FROM appointments a
    WHERE a.status = 'BOOKED'
      AND tstzrange(a.start_at, a.end_at, '[)')
          && tstzrange(x.start_at, x.start_at + make_interval(mins => s.duration_minutes), '[)'));

-- Historique : visites honorées, une absence, et Emma / Lucas sans visite depuis plus de 3 mois.
WITH c AS (
    SELECT id, row_number() OVER (ORDER BY email) - 1 AS i
    FROM users WHERE email LIKE '%@demo-agent.creno'
), s AS (
    SELECT id, duration_minutes, row_number() OVER (ORDER BY id) - 1 AS i
    FROM services WHERE active
), v(ci, si, jours, heure, statut) AS (VALUES
    (0, 0,  28, '10:00'::time, 'COMPLETED'), (0, 3,  63, '14:30'::time, 'COMPLETED'),
    (1, 1,  14, '14:30'::time, 'COMPLETED'), (1, 4,  42, '10:00'::time, 'NO_SHOW'),
    (2, 0,  21, '16:30'::time, 'COMPLETED'),
    (3, 1,  35, '11:00'::time, 'COMPLETED'),
    (4, 3, 130, '10:00'::time, 'COMPLETED'), (4, 0, 175, '14:30'::time, 'COMPLETED'), (4, 3, 220, '10:00'::time, 'COMPLETED'),
    (5, 1, 110, '14:30'::time, 'COMPLETED'), (5, 4, 160, '16:30'::time, 'COMPLETED')
), d AS (
    -- Ramène un lundi au mardi et un dimanche au samedi (jours d'ouverture).
    SELECT v.*, base + CASE extract(isodow FROM base) WHEN 1 THEN 1 WHEN 7 THEN -1 ELSE 0 END AS jour
    FROM v CROSS JOIN LATERAL (SELECT (now() AT TIME ZONE 'Europe/Paris')::date - v.jours AS base) b
)
INSERT INTO appointments (client_id, service_id, start_at, end_at, status, created_at)
SELECT c.id, s.id, p.start_at, p.start_at + make_interval(mins => s.duration_minutes), d.statut,
       p.start_at - interval '5 days'
FROM d
JOIN c ON c.i = d.ci
JOIN s ON s.i = d.si % (SELECT count(*) FROM s)
CROSS JOIN LATERAL (SELECT ((d.jour + d.heure) AT TIME ZONE 'Europe/Paris') AS start_at) p;

COMMIT;

-- Contrôle
SELECT u.first_name || ' ' || u.last_name AS client, a.status, count(*) AS nb,
       min(a.start_at AT TIME ZONE 'Europe/Paris') AS premier, max(a.start_at AT TIME ZONE 'Europe/Paris') AS dernier
FROM appointments a JOIN users u ON u.id = a.client_id
WHERE u.email LIKE '%@demo-agent.creno'
GROUP BY 1, 2 ORDER BY 1, 2;
