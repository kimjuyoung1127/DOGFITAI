import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const insertDogProfile = async (profileData: {
  name: string
  sex: string
  age: number
  weight: number
  breed: string
}) => {
  const { data, error } = await supabase
    .from('dog_profile')
    .insert([profileData])
    .select()

  return { data, error }
}