import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

// ID par défaut pour éviter les blocages si la table schools est vide ou non accessible
const DEFAULT_SCHOOL_ID = '00000000-0000-0000-0000-000000000000';

export function useSchoolId() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchoolId() {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // 1. Essayer via le profil de l'utilisateur connecté
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('school_id')
            .eq('id', user.id)
            .single();

          if (profile?.school_id) {
            setSchoolId(profile.school_id);
            setLoading(false);
            return;
          }
        }

        // 2. Essayer de récupérer la première école en base
        const { data: schools } = await supabase.from('schools').select('id').limit(1);
        if (schools && schools.length > 0) {
          setSchoolId(schools[0].id);
        } else {
          // 3. Fallback ultime sur l'ID par défaut (Seed)
          setSchoolId(DEFAULT_SCHOOL_ID);
        }
      } catch (err) {
        console.warn("Erreur récupération école, utilisation du fallback.");
        setSchoolId(DEFAULT_SCHOOL_ID);
      } finally {
        setLoading(false);
      }
    }

    fetchSchoolId();
  }, []);

  return { schoolId, loading, error };
}
