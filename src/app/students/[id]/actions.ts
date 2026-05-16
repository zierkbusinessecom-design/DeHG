'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function deleteDisciplinaryRecord(id: string) {
  const { error } = await supabaseAdmin.from('disciplinary_records').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteAcademicEvaluation(id: string) {
  const { error } = await supabaseAdmin.from('academic_evaluations').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}
