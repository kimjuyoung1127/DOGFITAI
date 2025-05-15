import { supabase } from "./supabaseClient"

interface DogProfileData {
  id?: number; // id 속성 추가
  name: string;
  sex: string;
  age: number;
  weight: number;
  breed: string;
  health_values?: Record<string, number>;
  performance_values?: Record<string, number>;
  preferences?: {
    selected: string[];
    intensity: Record<string, number>;
  };
  equipment?: string[];
  equipment_keys?: string[];
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
    .eq('name', profileData.name) // 이름으로 중복 체크
    .limit(1)
  
  if (fetchError) {
    return { data: null, error: { message: "프로필 조회 중 오류가 발생했습니다.", details: fetchError } }
  }
  
  // 새로운 프로필 생성 로직 추가
  if (!existingProfiles || existingProfiles.length === 0 || profileData.id === undefined) {
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
        equipment: profileData.equipment,
        equipment_keys: profileData.equipment_keys
      })
      .select()
    
    return { data, error }
  } else {
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
        equipment: profileData.equipment,
        equipment_keys: profileData.equipment_keys
      })
      .eq('user_id', userId)
      .eq('id', profileData.id) // id로 업데이트
      .select()
    
    return { data, error }
  }
}