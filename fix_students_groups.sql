-- CORRECTIF STRUCTURE ÉLÈVES & GROUPES
-- On s'assure que la colonne est bien du TEXT pour accepter 'morning' / 'afternoon'
ALTER TABLE students DROP COLUMN IF EXISTS group_id;
ALTER TABLE students ADD COLUMN group_id TEXT DEFAULT 'morning';

-- On met à jour les élèves existants
UPDATE students SET group_id = 'morning' WHERE group_id IS NULL;
