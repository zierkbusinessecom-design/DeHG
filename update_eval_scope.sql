-- AJOUT DU CHAMP SCOPE POUR LES ÉVALUATIONS
-- Permet d'enregistrer les plages (Juz/Sourates ou Pages)
ALTER TABLE academic_evaluations ADD COLUMN IF NOT EXISTS scope JSONB DEFAULT '{}'::jsonb;
