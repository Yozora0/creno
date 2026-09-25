-- Suivi des connexions : permet d'afficher ce qui est « nouveau » depuis la dernière visite.
ALTER TABLE users ADD COLUMN last_login_at     TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN previous_login_at TIMESTAMPTZ;

-- Accélère la recherche des RDV créés depuis une date (résumé du commerçant).
CREATE INDEX idx_appointments_created ON appointments (created_at);
