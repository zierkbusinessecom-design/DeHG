-- MIGRATION POUR LE SYSTÈME ACADÉMIQUE COMPLET
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Table de référence des Juz et Sourates
CREATE TABLE IF NOT EXISTS juz_sourates (
    juz_number INTEGER PRIMARY KEY,
    main_surah TEXT NOT NULL,
    start_page INTEGER NOT NULL,
    surah_list TEXT[]
);

-- Insertion des 30 Juz (Ordre décroissant géré dans l'UI)
INSERT INTO juz_sourates (juz_number, main_surah, start_page, surah_list) VALUES
(30, 'An-Naba', 582, ARRAY['An-Naba', 'An-Nazi''at', 'Abasa', 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq', 'Al-A''la', 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Layl', 'Ad-Duha', 'Ash-Sharh', 'At-Tin', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-Adiyat', 'Al-Qari''ah', 'At-Takathur', 'Al-Asr', 'Al-Humazah', 'Al-Fil', 'Quraysh', 'Al-Ma''un', 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr', 'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas']),
(29, 'Al-Mulk', 562, ARRAY['Al-Mulk', 'Al-Qalam', 'Al-Haqqah', 'Al-Ma''arij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddathir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat']),
(28, 'Al-Mujadila', 542, ARRAY['Al-Mujadila', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff', 'Al-Jumu''ah', 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim']),
(27, 'Adh-Dhariyat', 522, ARRAY['Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', 'Al-Waqi''ah', 'Al-Hadid']),
(26, 'Al-Ahqaf', 502, ARRAY['Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat']),
(25, 'Fussilat', 482, ARRAY['Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah']),
(24, 'Az-Zumar', 462, ARRAY['Az-Zumar', 'Ghafir', 'Fussilat']),
(23, 'Ya-Sin', 442, ARRAY['Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar']),
(22, 'Al-Ahzab', 422, ARRAY['Al-Ahzab', 'Saba', 'Fatir', 'Ya-Sin']),
(21, 'Al-Ankabut', 402, ARRAY['Al-Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah', 'Al-Ahzab']),
(20, 'An-Naml', 382, ARRAY['An-Naml', 'Al-Qasas', 'Al-Ankabut']),
(19, 'Al-Furqan', 362, ARRAY['Al-Furqan', 'Ash-Shu''ara', 'An-Naml']),
(18, 'Al-Mu''minun', 342, ARRAY['Al-Mu''minun', 'An-Nur', 'Al-Furqan']),
(17, 'Al-Anbiya', 322, ARRAY['Al-Anbiya', 'Al-Hajj']),
(16, 'Al-Kahf', 302, ARRAY['Al-Kahf', 'Maryam', 'Ta-Ha']),
(15, 'Al-Isra', 282, ARRAY['Al-Isra', 'Al-Kahf']),
(14, 'Al-Hijr', 262, ARRAY['Al-Hijr', 'An-Nahl']),
(13, 'Ar-Ra''d', 242, ARRAY['Ar-Ra''d', 'Ibrahim', 'Al-Hijr']),
(12, 'Yusuf', 222, ARRAY['Yusuf', 'Ar-Ra''d']),
(11, 'Hud', 202, ARRAY['Hud', 'Yusuf']),
(10, 'Al-Anfal', 182, ARRAY['Al-Anfal', 'At-Tawbah']),
(9, 'Al-A''raf', 162, ARRAY['Al-A''raf', 'Al-Anfal']),
(8, 'Al-A''raf', 142, ARRAY['Al-A''raf']),
(7, 'Al-A''raf', 122, ARRAY['Al-A''raf']),
(6, 'Al-An''am', 102, ARRAY['Al-An''am', 'Al-A''raf']),
(5, 'Al-Ma''idah', 82, ARRAY['Al-Ma''idah', 'Al-An''am']),
(4, 'An-Nisa', 62, ARRAY['An-Nisa', 'Al-Ma''idah']),
(3, 'Al-Imran', 42, ARRAY['Al-Imran', 'An-Nisa']),
(2, 'Al-Baqarah', 22, ARRAY['Al-Baqarah', 'Al-Imran']),
(1, 'Al-Fatiha', 1, ARRAY['Al-Fatiha', 'Al-Baqarah'])
ON CONFLICT (juz_number) DO NOTHING;

-- 2. Table de suivi Coranique par élève
CREATE TABLE IF NOT EXISTS student_quran_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    juz INTEGER CHECK (juz BETWEEN 1 AND 30),
    surah TEXT,
    page INTEGER,
    level TEXT,
    progress_pct INTEGER DEFAULT 0,
    history JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table de suivi Multi-Livres (Alphabétisation et Arabe)
CREATE TABLE IF NOT EXISTS student_books_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    book_name TEXT NOT NULL,
    level TEXT,
    current_page INTEGER,
    progress TEXT,
    remarks TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des Évaluations (Tests, Examens, Évaluations)
CREATE TABLE IF NOT EXISTS academic_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    book TEXT,
    type TEXT CHECK (type IN ('Test', 'Evaluation', 'Examen')),
    grade NUMERIC(4,2) CHECK (grade BETWEEN 0 AND 10),
    pages_covered TEXT,
    evaluation_date DATE DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
