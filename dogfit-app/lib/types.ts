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
  isCustom: any;
  id: string
  name: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  duration: number
  equipment: string[]
  steps: string[]
  benefits: string[]
  imageUrl?: string
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
