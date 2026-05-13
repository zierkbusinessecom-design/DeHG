-- CORRECTIF POUR LE SUIVI CORANIQUE (VERSION ROBUSTE)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_quran_tracking_student_id_key') THEN
        ALTER TABLE student_quran_tracking ADD CONSTRAINT student_quran_tracking_student_id_key UNIQUE (student_id);
    END IF;
END;
$$;
