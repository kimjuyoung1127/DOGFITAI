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
  const { data, error } = await supabase
    .from('dog_profile')
    .insert([profileData])
    .select()

  return { data, error }
}