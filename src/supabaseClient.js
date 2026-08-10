import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL)
  || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL)
  || "https://dsxnlqgxrhgwhskbvugy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_PUBLISHABLE_KEY)
  || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key');
