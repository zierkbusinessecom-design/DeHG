-- INSERTION D'UNE ÉCOLE PAR DÉFAUT POUR LE SYSTÈME
INSERT INTO schools (id, name, address, phone) 
VALUES ('00000000-0000-0000-0000-000000000000', 'DHG School', 'Adresse de l''école', '+224 000 000 000')
ON CONFLICT (id) DO NOTHING;

-- S'assurer que les tables sont accessibles (RLS)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schools are viewable by everyone" ON schools FOR SELECT USING (true);

-- Permettre l'insertion par les utilisateurs anonymes si nécessaire (pour le test)
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous parent insertion" ON parents FOR INSERT WITH CHECK (true);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous student insertion" ON students FOR INSERT WITH CHECK (true);

ALTER TABLE student_parent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous link insertion" ON student_parent FOR INSERT WITH CHECK (true);

ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous fee insertion" ON student_fees FOR INSERT WITH CHECK (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous payment insertion" ON payments FOR INSERT WITH CHECK (true);
