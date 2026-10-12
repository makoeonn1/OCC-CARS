import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Avoid crashing the whole site when env vars are not set yet.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;

export const idToEmail = (idNumber) =>
  `${idNumber.trim().toLowerCase()}@${import.meta.env.VITE_ID_EMAIL_DOMAIN || "occ.edu.ph"}`;
