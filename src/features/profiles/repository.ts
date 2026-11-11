import { requireSupabase } from "../../lib/supabase";
import { profileSchema, type ProfileValues } from "../auth/validation";
export async function updateOwnProfile(userId: string, input: ProfileValues) {
  const safe = profileSchema.parse(input);
  const { data, error } = await requireSupabase()
    .from("profiles")
    .update(safe)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
