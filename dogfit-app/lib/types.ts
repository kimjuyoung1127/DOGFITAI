export type Breed =  "러프 콜리" | "로트와일러" | "마스티프" | "말리노이즈" | "말티즈" | "바센지" | "보더 콜리" | "보르조이" | "보스턴 테리어" | "기타";

export interface DogInfo {
  name: string
  gender: string
  age: number
  breed: Breed | ""
  weight: number
  activityLevel: "low" | "medium" | "high"
  healthIssues: string[]
}

export interface Exercise {
  id: string
  name: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  duration: number
  equipment: string[]
  steps: string[]
  benefits: string[]
  imageUrl?: string
  warmupSteps?: string[] // 추가: 준비운동 단계
  cooldownSteps?: string[] // 추가: 마무리운동 단계
  isCustom: boolean; // ← 이 줄을 추가
}

export interface CustomExercise extends Exercise {
  isCustom: boolean
}

export interface DogProfile {
  id: number
  name: string
  age: number
  weight: number
  sex: string
  breed: Breed | ""
  activityLevel: "low" | "medium" | "high"
  healthIssues: string[]
  performance: Record<string, number>
  preferences: Record<string, boolean>
  equipment: Record<string, boolean>
  intensities: Record<string, number>
  selected: Record<string, boolean>
  intensity: Record<string, number>
  selectedActivities: Record<string, boolean>
  selectedEquipment: Record<string, boolean>  

  
}

export interface DogProfileData {
  
  id: number
  dogInfo: DogInfo
  healthValues: Record<string, number>
  performanceValues: Record<string, number>
  selectedActivities: Record<string, boolean>
  intensities: Record<string, number>
  selectedEquipment: Record<string, boolean>
  preferences: {
    selected: string[]
    intensity: Record<string, number>
  }
}
