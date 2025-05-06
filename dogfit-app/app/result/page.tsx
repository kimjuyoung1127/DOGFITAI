"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PawPrintLoading } from "@/components/ui/paw-print-loading"
import { motion } from "framer-motion"
import type { DogInfo, Exercise, CustomExercise } from "@/lib/types"
import { getLocalStorageItem, setLocalStorageItem, generateExerciseRecommendations } from "@/lib/utils"
import { StampWidget } from "@/components/ui/stamp-widget"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ResultPage() {
  const router = useRouter()
  const [dogInfo, setDogInfo] = useState<DogInfo | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [customExercise, setCustomExercise] = useState<Partial<CustomExercise>>({
    name: "",
    description: "",
    difficulty: "medium",
    duration: 10,
    equipment: [],
    steps: [],
    benefits: [],
    isCustom: true,
  })
  const [customEquipment, setCustomEquipment] = useState("")
  const [customStep, setCustomStep] = useState("")
  const [customBenefit, setCustomBenefit] = useState("")

  useEffect(() => {
    // 로딩 상태 설정
    setLoading(true);
    
    // 1. localStorage에서 추천 운동 데이터 가져오기
    const savedRecommendations = getLocalStorageItem<Exercise[]>("dogfit-recommendations", []);
    console.log("📥 localStorage에서 불러온 운동:", savedRecommendations);
    
    // 2. 강아지 정보 가져오기
    const savedDogInfo = getLocalStorageItem<DogInfo | null>("dogfit-dog-info", null);
    setDogInfo(savedDogInfo);
    
    if (savedRecommendations && savedRecommendations.length > 0) {
      // API에서 받은 추천 운동이 있는 경우
      console.log("✅ API 추천 운동 사용:", savedRecommendations.length, "개");
      
      // isCustom 속성 추가
      const typedRecommendations = savedRecommendations.map(rec => ({
        ...rec,
        isCustom: false
      }));
      
      // 커스텀 운동 가져오기
      const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", []);
      
      // 모든 운동 합치기
      setExercises([...typedRecommendations, ...customExercises]);
    } else if (savedDogInfo) {
      // API 추천이 없지만 강아지 정보가 있는 경우 fallback으로 목업 데이터 생성
      console.log("⚠️ API 추천 없음, 목업 데이터 사용");
      const recommendations = generateExerciseRecommendations(savedDogInfo);
      
      // isCustom 속성 추가
      const typedRecommendations = recommendations.map(rec => ({
        ...rec,
        isCustom: false
      }));
      
      // 커스텀 운동 가져오기
      const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", []);
      
      // 모든 운동 합치기
      setExercises([...typedRecommendations, ...customExercises]);
    } else {
      // 강아지 정보도 없는 경우 프로필 페이지로 리다이렉트
      console.error("❌ 강아지 정보 없음, 프로필 페이지로 이동");
      router.push("/profile");
      return;
    }
    
    // 로딩 시뮬레이션 (UX 향상)
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [router])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? exercises.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === exercises.length - 1 ? 0 : prev + 1))
  }

  const handleAddCustomExercise = () => {
    if (!customExercise.name || !customExercise.description) return

    const newExercise: CustomExercise = {
      id: `custom-${Date.now()}`,
      name: customExercise.name || "",
      description: customExercise.description || "",
      difficulty: (customExercise.difficulty as "easy" | "medium" | "hard") || "medium",
      duration: customExercise.duration || 10,
      equipment: customExercise.equipment || [],
      steps: customExercise.steps || [],
      benefits: customExercise.benefits || [],
      isCustom: true,
    }

    // Add to exercises state
    const updatedExercises = [...exercises, newExercise]
    setExercises(updatedExercises)

    // Save to localStorage
    const savedCustomExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", [])
    setLocalStorageItem("dogfit-custom-exercises", [...savedCustomExercises, newExercise])

    // Reset form
    setCustomExercise({
      name: "",
      description: "",
      difficulty: "medium",
      duration: 10,
      equipment: [],
      steps: [],
      benefits: [],
      isCustom: true,
    })
    setCustomEquipment("")
    setCustomStep("")
    setCustomBenefit("")

    // Set index to the new exercise
    setCurrentIndex(updatedExercises.length - 1)
  }

  const handleAddEquipment = () => {
    if (!customEquipment) return
    setCustomExercise({
      ...customExercise,
      equipment: [...(customExercise.equipment || []), customEquipment],
    })
    setCustomEquipment("")
  }

  const handleAddStep = () => {
    if (!customStep) return
    setCustomExercise({
      ...customExercise,
      steps: [...(customExercise.steps || []), customStep],
    })
    setCustomStep("")
  }

  const handleAddBenefit = () => {
    if (!customBenefit) return
    setCustomExercise({
      ...customExercise,
      benefits: [...(customExercise.benefits || []), customBenefit],
    })
    setCustomBenefit("")
  }
  const handleDeleteCustomExercise = () => {
    // Check if the exercise has the custom property or is a custom exercise
    if (!('isCustom' in currentExercise) || !currentExercise.isCustom) return

    const updatedExercises = exercises.filter((exercise) => exercise.id !== currentExercise.id)
    setExercises(updatedExercises)
    // Update localStorage
    const updatedCustomExercises = updatedExercises.filter((exercise) => 'isCustom' in exercise && exercise.isCustom)
    setLocalStorageItem("dogfit-custom-exercises", updatedCustomExercises)

    // Adjust currentIndex
    setCurrentIndex((prev) => (prev === 0 ? 0 : prev - 1))
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-xl font-bold mb-6">맞춤형 운동을 찾고 있어요</h2>
            <PawPrintLoading />
            <p className="mt-6 text-muted-foreground">{dogInfo?.name || "반려견"}에게 딱 맞는 운동을 찾고 있어요...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentExercise = exercises[currentIndex]

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full overflow-hidden">
          <CardHeader className="bg-primary text-white">
            <CardTitle className="text-center">{dogInfo?.name}에게 추천하는 운동</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              <div className="flex justify-between absolute top-1/2 transform -translate-y-1/2 w-full px-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/80 rounded-full h-8 w-8"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="bg-white/80 rounded-full h-8 w-8" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="aspect-video bg-muted relative">
                <Image
                  src={
                    currentExercise.imageUrl
                      ? currentExercise.imageUrl
                      : `/images/exercises/${currentExercise.id || "default"}.jpg`
                  }
                  alt={currentExercise.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{currentExercise.name}</h2>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      currentExercise.difficulty === "easy"
                        ? "outline"
                        : currentExercise.difficulty === "medium"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {currentExercise.difficulty === "easy"
                      ? "쉬움"
                      : currentExercise.difficulty === "medium"
                        ? "중간"
                        : "어려움"}
                  </Badge>
                  <Badge variant="outline">{currentExercise.duration}분</Badge>
                </div>
              </div>

              <p>{currentExercise.description}</p>

              <div>
                <h3 className="font-bold mb-2">필요 장비</h3>
                <div className="flex flex-wrap gap-2">
                  {currentExercise.equipment.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">기대 효과</h3>
                <div className="flex flex-wrap gap-2">
                  {currentExercise.benefits.map((benefit, index) => (
                    <Badge key={index} variant="outline">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-6 pt-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  운동 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>커스텀 운동 추가하기</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">운동 이름</Label>
                    <Input
                      id="name"
                      value={customExercise.name || ""}
                      onChange={(e) => setCustomExercise({ ...customExercise, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={customExercise.description || ""}
                      onChange={(e) => setCustomExercise({ ...customExercise, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="difficulty">난이도</Label>
                      <Select
                        value={customExercise.difficulty || "medium"}
                        onValueChange={(value) => setCustomExercise({ ...customExercise, difficulty: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="난이도 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">쉬움</SelectItem>
                          <SelectItem value="medium">중간</SelectItem>
                          <SelectItem value="hard">어려움</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="duration">소요 시간 (분)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={customExercise.duration || ""}
                        onChange={(e) => setCustomExercise({ ...customExercise, duration: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>필요 장비</Label>
                    <div className="flex gap-2">
                      <Input
                        value={customEquipment}
                        onChange={(e) => setCustomEquipment(e.target.value)}
                        placeholder="장비 추가"
                      />
                      <Button type="button" onClick={handleAddEquipment} size="sm">
                        추가
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customExercise.equipment?.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>운동 단계</Label>
                    <div className="flex gap-2">
                      <Input
                        value={customStep}
                        onChange={(e) => setCustomStep(e.target.value)}
                        placeholder="단계 추가"
                      />
                      <Button type="button" onClick={handleAddStep} size="sm">
                        추가
                      </Button>
                    </div>
                    <div className="space-y-2 mt-2">
                      {customExercise.steps?.map((step, index) => (
                        <div key={index} className="bg-secondary p-2 rounded-md text-sm">
                          {index + 1}. {step}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>기대 효과</Label>
                    <div className="flex gap-2">
                      <Input
                        value={customBenefit}
                        onChange={(e) => setCustomBenefit(e.target.value)}
                        placeholder="효과 추가"
                      />
                      <Button type="button" onClick={handleAddBenefit} size="sm">
                        추가
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customExercise.benefits?.map((benefit, index) => (
                        <Badge key={index} variant="outline">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">취소</Button>
                  </DialogClose>
                  <Button onClick={handleAddCustomExercise}>추가하기</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Link href={`/exercise/${currentExercise.id}`}>
              <Button>상세 보기</Button>
            </Link>
            
            {currentExercise.isCustom && (
              <Button variant="destructive" size="sm" onClick={handleDeleteCustomExercise}>
                운동 삭제
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="flex justify-center mt-4">
          <div className="flex gap-1">
            {exercises.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${index === currentIndex ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
      <StampWidget />
    </div>
  )
}
