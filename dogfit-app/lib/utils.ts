import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  const item = localStorage.getItem(key)
  if (!item) return defaultValue

  try {
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Error parsing localStorage item ${key}:`, error)
    return defaultValue
  }
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting localStorage item ${key}:`, error)
  }
}

export function addStamp(): number {
  const currentStamps = getLocalStorageItem<number>("dogfit-stamps", 0)
  const newStamps = currentStamps + 1
  setLocalStorageItem("dogfit-stamps", newStamps)
  return newStamps
}

export function shareToSNS(platform: "twitter" | "instagram", message: string): void {
  let url = ""

  switch (platform) {
    case "twitter":
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
      break
    case "instagram":
      // Instagram doesn't have a direct sharing API, so we'll copy to clipboard
      navigator.clipboard.writeText(message)
      alert("텍스트가 클립보드에 복사되었습니다. Instagram 스토리에 붙여넣기 해주세요.")
      return
  }

  if (url) {
    window.open(url, "_blank")
  }
}

interface DogInfo {
  activityLevel: "low" | "medium" | "high"
  healthIssues: string[]
}

interface Exercise {
  id: string
  name: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  duration: number
  equipment: string[]
  steps: string[]
  benefits: string[]
  imageUrl: string
}

export function generateExerciseRecommendations(dogInfo: DogInfo): Exercise[] {
  // This would normally be an API call, but for the MVP we'll generate some sample exercises
  const exercises: Exercise[] = [
    {
      id: "1",
      name: "도넛볼 밸런스",
      description: "도넛 모양의 밸런스 볼 위에서 균형을 잡는 운동입니다.",
      difficulty: "medium",
      duration: 10,
      equipment: ["도넛볼"],
      steps: [
        "도넛볼을 평평한 바닥에 놓습니다.",
        "강아지를 볼 위에 올려 앞발로 균형을 잡도록 합니다.",
        "10초간 유지한 후 휴식합니다.",
        "3회 반복합니다.",
      ],
      benefits: ["균형감각 향상", "코어 근육 강화"],
      imageUrl: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "2",
      name: "터그 오브 워",
      description: "로프를 당기며 놀이하는 운동입니다.",
      difficulty: "easy",
      duration: 15,
      equipment: ["로프 장난감"],
      steps: [
        "로프 장난감을 준비합니다.",
        "강아지가 로프를 물도록 유도합니다.",
        "부드럽게 당기며 놀이합니다.",
        "15분간 진행합니다.",
      ],
      benefits: ["턱 근육 강화", "스트레스 해소", "유대감 형성"],
      imageUrl: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "3",
      name: "슬라롬 훈련",
      description: "장애물 사이를 지그재그로 달리는 운동입니다.",
      difficulty: "hard",
      duration: 20,
      equipment: ["콘", "간식"],
      steps: [
        "콘을 일렬로 배치합니다.",
        "강아지를 콘 사이로 유도합니다.",
        "성공할 때마다 간식으로 보상합니다.",
        "5회 반복합니다.",
      ],
      benefits: ["민첩성 향상", "집중력 향상", "순종성 향상"],
      imageUrl: "/placeholder.svg?height=200&width=200",
    },
  ]

  // Filter based on dog's activity level
  let filteredExercises = exercises

  if (dogInfo.activityLevel === "low") {
    filteredExercises = exercises.filter((e) => e.difficulty === "easy")
  } else if (dogInfo.activityLevel === "medium") {
    filteredExercises = exercises.filter((e) => e.difficulty !== "hard")
  }

  // If dog has health issues, further filter
  if (dogInfo.healthIssues.length > 0) {
    // This would be more sophisticated in a real app
    if (dogInfo.healthIssues.includes("joint")) {
      filteredExercises = filteredExercises.filter((e) => e.name !== "슬라롬 훈련")
    }
  }

  return filteredExercises.length > 0 ? filteredExercises : exercises.slice(0, 2)
}
