// src/supabaseClient.js 예시
import { createClient } from '@supabase/supabase-js'

// 이러한 값들은 실제 프로젝트에서는 환경 변수에서 가져와야 합니다.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL // 또는 import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY // 또는 import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
