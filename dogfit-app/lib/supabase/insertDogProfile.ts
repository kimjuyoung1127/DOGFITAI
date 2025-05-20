import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const insertDogProfile = async (profileData: {
  id: number
  user_id: string
  name: string
  sex: string
  age: number
  weight: number
  breed: string
  health_values: Record<string, number>
  performance_values: Record<string, number>
  preferences: Record<string, number>
  equipment: string[]
}) => {
  // dog_profile에 해당 id가 이미 존재하는지 확인
  const { data: existing, error: selectError } = await supabase
    .from('dog_profile')
    .select('id')
    .eq('id', profileData.id)
    .eq('user_id', profileData.user_id)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116: No rows found (존재하지 않으면 insert 진행)
    return { data: null, error: selectError }
  }

  if (existing) {
    // 이미 존재하면 insert하지 않고 에러 반환
    return { data: null, error: { message: "이미 해당 id의 프로필이 존재합니다." } }
  }

  const { data, error } = await supabase
    .from('dog_profile')
    .insert([profileData])
    .select()

  return { data, error }
}