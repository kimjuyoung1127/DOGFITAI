import { supabase } from "./supabaseClient"

// 운동 기록 추가: exercise_history 테이블에 직접 insert
export async function addExerciseHistory(profileId: string, newHistoryItem: any) {
  // profileId를 포함하여 새로운 기록을 exercise_history에 추가
  const { data, error } = await supabase
    .from("exercise_history")
    .insert([{ ...newHistoryItem, profile_id: profileId }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addExerciseHistoryToProfile(profileId: string, newHistoryItem: any) {
  // 기존 history 불러오기
  const { data, error } = await supabase
    .from("dog_profile")
    .select("exercise_history")
    .eq("id", profileId)
    .single()

  if (error) throw error

  const prevHistory = Array.isArray(data?.exercise_history) ? data.exercise_history : []
  const updatedHistory = [newHistoryItem, ...prevHistory]

  // history 컬럼 업데이트
  const { error: updateError } = await supabase
    .from("dog_profile")
    .update({ exercise_history: updatedHistory })
    .eq("id", profileId)

  if (error) {
    console.error("🔥 [updateHistory] SELECT error:", error)
    throw error
  }
  if (updateError) {
    console.error("🔥 [updateHistory] UPDATE error:", updateError)
    throw updateError
  }
  return updatedHistory
}