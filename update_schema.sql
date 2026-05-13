-- 1. MISE À JOUR DE LA TABLE STUDENTS POUR LES QR CODES ET LE SUIVI SIMPLIFIÉ
ALTER TABLE students ADD COLUMN IF NOT EXISTS qr_code_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE students ADD COLUMN IF NOT EXISTS alphabet_book TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS alphabet_page INTEGER DEFAULT 1;

-- 2. TABLE DES LIVRES ÉTUDIÉS PAR ÉLÈVE (MULTI-LIVRES)
CREATE TABLE IF NOT EXISTS student_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    book_name TEXT NOT NULL,
    level TEXT,
    current_page INTEGER DEFAULT 1,
    total_pages INTEGER,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE DE RÉFÉRENCE DES JUZ ET SOURATES (POUR LA LOGIQUE DYNAMIQUE)
CREATE TABLE IF NOT EXISTS quran_reference (
    juz_number INTEGER PRIMARY KEY,
    start_surah_name TEXT NOT NULL,
    start_page INTEGER NOT NULL
);

-- 4. TABLE DES ÉVALUATIONS (TESTS, EXAMENS)
CREATE TABLE IF NOT EXISTS academic_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    group_id UUID REFERENCES groups(id), -- Pour les évaluations de groupe
    student_id UUID REFERENCES students(id), -- Pour les évaluations individuelles
    subject_id UUID REFERENCES subjects(id),
    type TEXT NOT NULL, -- Test, Evaluation, Examen
    book_name TEXT,
    pages_covered TEXT,
    evaluation_date DATE DEFAULT CURRENT_DATE,
    grade DECIMAL(4,2), -- Note sur 10 (ex: 8.50)
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INSERTION DES DONNÉES DE RÉFÉRENCE QURAN (STRUCTURE PARTIELLE POUR TEST)
INSERT INTO quran_reference (juz_number, start_surah_name, start_page) VALUES
(30, 'An-Naba', 582),
(29, 'Al-Mulk', 562),
(1, 'Al-Fatiha', 1)
ON CONFLICT (juz_number) DO NOTHING;

-- 6. MISE À JOUR DES POLITIQUES RLS POUR LES NOUVELLES TABLES
ALTER TABLE student_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on student_books" ON student_books FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated on evaluations" ON academic_evaluations FOR ALL TO authenticated USING (true) WITH CHECK (true);
