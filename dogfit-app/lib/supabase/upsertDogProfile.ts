import { supabase } from "./supabaseClient"

interface DogProfileData {
  name: string
  sex: string
  age: number
  weight: number
  breed: string
  health_values?: Record<string, number>
  performance_values?: Record<string, number>
  preferences?: {
    selected: string[]
    intensity: Record<string, number>
  }
  equipment?: string[]
}

export async function upsertDogProfile(profileData: DogProfileData) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError || !userData.user) {
    return { data: null, error: { message: "사용자 인증 정보를 찾을 수 없습니다.", details: userError } }
  }
  
  const userId = userData.user.id
  
  // 기존 프로필 확인
  const { data: existingProfiles, error: fetchError } = await supabase
    .from('dog_profile')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
  
  if (fetchError) {
    return { data: null, error: { message: "프로필 조회 중 오류가 발생했습니다.", details: fetchError } }
  }
  
  // upsert 작업 수행
  if (existingProfiles && existingProfiles.length > 0) {
    // 기존 프로필 업데이트
    const { data, error } = await supabase
      .from('dog_profile')
      .update({
        name: profileData.name,
        sex: profileData.sex,
        age: profileData.age,
        weight: profileData.weight,
        breed: profileData.breed,
        health_values: profileData.health_values,
        performance_values: profileData.performance_values,
        preferences: profileData.preferences,
        equipment: profileData.equipment
      })
      .eq('user_id', userId)
      .select()
    
    return { data, error }
  } else {
    // 새 프로필 생성
    const { data, error } = await supabase
      .from('dog_profile')
      .insert({
        user_id: userId,
        name: profileData.name,
        sex: profileData.sex,
        age: profileData.age,
        weight: profileData.weight,
        breed: profileData.breed,
        health_values: profileData.health_values,
        performance_values: profileData.performance_values,
        preferences: profileData.preferences,
        equipment: profileData.equipment
      })
      .select()
    
    return { data, error }
  }
} 