import type { Exercise, DogInfo } from "@/lib/types"

// 운동 기록 단일 항목 타입
export interface HistoryItem {
  id: string
  name: string
  date: string
  duration: number
  isCustom: boolean
  difficulty: "easy" | "medium" | "hard"
  dogName: string
  equipmentUsed: string[]
  benefits: string[]
}

// 운동 기록 저장용 배열 타입
export type HistoryRecord = HistoryItem[]

// (선택) 운동 기록 저장 시 필요한 추가 정보 타입 예시
export interface SaveHistoryParams {
  exercise: Exercise
  dogInfo: DogInfo
  date?: string // 기본값: new Date().toISOString()
}