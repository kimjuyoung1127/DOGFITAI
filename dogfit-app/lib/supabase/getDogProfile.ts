import { supabase } from "./supabaseClient"

export async function getDogProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError || !userData.user) {
    return { data: null, error: { message: "사용자 인증 정보를 찾을 수 없습니다.", details: userError } }
  }
  
  const userId = userData.user.id
  
  const { data, error } = await supabase
    .from('dog_profile')
    .select('*')
    .eq('user_id', userId)
  
  return { data, error }
} 