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

// public/images/exercises 내부에 존재하는 이미지 파일명 목록 (확장자 제외)
const availableImages = new Set([
  "back-arch-stretch_bodyweight",
  "balance-donut-fullBody",
  "balance-fitbone-stand-fullBody",
  "block-rear-stand_rearPawsElevated",
  "bodyweight-sit-to-stand_fullBody",
  "cavaletti-walk_fullBody",
  "circuit-roll_floorOnly",
  "climbing-lowstep_frontPawsOnly",
  "cone-pivot_fullBody",
  "cone-weave_fullBody",
  "confidence-box_fullBody",
  "core-elevated-push_rearPawsElevated",
  "core-sitstand_bodyweight",
  "core-twist-disc_wholebody",
  // "default.png"는 Set에 포함하지 않고, 매칭되는 이미지가 없을 때 사용합니다.
  "donut-balance_frontPawsOnly",
  "donut-ball-balance_frontPawsOnly",
  "down-to-sit_bodyweight",
  "fitbone-frontonly_frontPawsOnly",
  "fitbone-static-stand_fullBody",
  "focus-touchmat_bodyweight",
  "hind-leg-raises_rearPawsElevated",
  "jump-hurdle_bodyweight",
  "pause-hold-yogablock_bodyweight",
  "side-stretch_bodyweight",
  "sit-down-stand_bodyweight",
  "sit-to-stand_bodyweight",
  "staggered-cushion-stand_wholebody",
  "strength-cavaletti-step_fullBody",
  "strength-plank_fullBody",
  "stretch-frontlegs_bodyweight",
  "stretch-hindlegs_donut",
  "wobble-mat-hold_bodyweight"
]);

// 운동 이미지 파일명 추론 유틸 함수
function getExerciseImageFilename(exercise: Exercise) {
  const base = (exercise.id ?? '').replace(/\s+/g, '-').toLowerCase();
  const suffixMap = {
    frontlegs: 'frontPawsOnly',
    hindlegs: 'rearPawsElevated',
    wholebody: 'fullBody',
    bodyweight: 'bodyweight',
  };

  const contactKey = typeof exercise.contact === "string" && suffixMap.hasOwnProperty(exercise.contact)
    ? exercise.contact
    : "bodyweight";
  const suffix = suffixMap[contactKey as keyof typeof suffixMap];

  const normalized = (str: string) => str.replace(/[-_]/g, '').toLowerCase();

  let bestMatch: string | null = null;
  let maxMatchScore = -1;

  for (const imageName of availableImages) {
    const normalizedImageName = normalized(imageName);
    const normalizedBase = normalized(base);
    const normalizedSuffix = normalized(suffix);

    let currentScore = 0;
    let baseFound = false;
    let suffixFound = false;

    // 1. base와 suffix 모두 포함 (가장 높은 점수)
    if (normalizedImageName.includes(normalizedBase) && normalizedImageName.includes(normalizedSuffix)) {
      currentScore = 2; // 높은 우선순위
      baseFound = true;
      suffixFound = true;
    } 
    // 2. base만 포함
    else if (normalizedImageName.includes(normalizedBase)) {
      currentScore = 1;
      baseFound = true;
    }
    // 3. suffix만 포함
    else if (normalizedImageName.includes(normalizedSuffix)) {
      currentScore = 1;
      suffixFound = true;
    }

    // 더 정확한 매칭 (예: base가 더 길게 일치하는 경우)을 위해 점수 조정 가능성
    if (baseFound) {
        // base 문자열이 이미지 이름 내에서 얼마나 정확히 일치하는지 (부분 문자열보다는 전체 단어 선호)
        if (normalizedImageName.split(/[-_]/).includes(normalizedBase.split(/[-_]/)[0])) currentScore += 0.5;
    }
    if (suffixFound) {
        if (normalizedImageName.split(/[-_]/).includes(normalizedSuffix.split(/[-_]/)[normalizedSuffix.split(/[-_]/).length -1])) currentScore += 0.5;
    }


    if (currentScore > maxMatchScore) {
      maxMatchScore = currentScore;
      bestMatch = imageName;
    }
  }

  if (bestMatch) {
    return `/images/exercises/${bestMatch}.png`;
  }
  return `/images/exercises/default.png`;
}


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
    setLoading(true);
    // 1. localStorage에서 profileId 가져오기 (가장 중요)
    const storedProfileId = getLocalStorageItem<string | null>("dogfit-selected-profile-id", null);
    console.log("📥 [DogFit][ResultPage] localStorage에서 가져온 profileId:", storedProfileId);

    // 2. 강아지 정보 가져오기 (profileId와 직접적 연관은 없지만, 추천 생성에 필요)
    const savedDogInfo = getLocalStorageItem<DogInfo | null>("dogfit-dog-info", null);
    setDogInfo(savedDogInfo);

    // 3. 추천 운동 데이터 가져오기 (profileId 기반으로 저장되었을 수 있음)
    const savedRecommendations = getLocalStorageItem<Exercise[]>("dogfit-recommendations", []);
    console.log("📥 localStorage에서 불러온 기존 운동 추천:", savedRecommendations);

    const normalizeSteps = (steps: any) => {
      if (!steps) return [];
      // steps가 문자열 배열이고, 첫 번째 요소가 문자열인지 확인
      if (Array.isArray(steps) && steps.length > 0 && typeof steps[0] === "string") {
        return steps.map((s: string) => ({ step: s, stepDuration: 60 }));
      }
      // 이미 객체 배열이거나 빈 배열이면 그대로 반환
      return steps;
    };

    // profileId가 있는지 확인
    if (!storedProfileId) {
      console.error("❌ profileId가 localStorage에 없습니다. 프로필 선택 페이지로 이동합니다.");
      // 사용자를 프로필 선택 페이지로 리디렉션합니다.
      router.push("/profile");
      return; // useEffect 실행 중단
    }

    // API 호출 또는 기존 추천 사용 로직
    // 이 부분은 profileId를 사용하여 API를 호출하거나,
    // profileId에 해당하는 추천을 localStorage에서 찾아 사용해야 합니다.
    // 현재 코드는 dogfit-recommendations 키로 저장된 것을 그대로 사용하고 있습니다.
    // 이 저장된 추천이 올바른 profileId에 대한 것인지 확인하는 로직이 필요할 수 있습니다.
    // (예: 추천 데이터 내에 profileId를 포함하여 저장하고, 불러올 때 비교)

    if (savedRecommendations && savedRecommendations.length > 0) {
      console.log("✅ 기존 저장된 운동 추천 사용:", savedRecommendations.length, "개");

      const typedRecommendations = savedRecommendations.map(rec => ({
        ...rec,
        isCustom: false, // API에서 받은 추천은 isCustom: false
        steps: normalizeSteps(rec.steps),
      }));

      const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", []).map(rec => ({
        ...rec,
        steps: normalizeSteps(rec.steps), // 커스텀 운동도 steps 정규화
      }));

      setExercises([...typedRecommendations, ...customExercises]);
    } else if (savedDogInfo) {
      // API 추천이 없고, 강아지 정보가 있는 경우:
      // 클라이언트 사이드에서 운동을 생성하거나, API를 호출하여 받아와야 합니다.
      // 현재는 generateExerciseRecommendations (클라이언트 사이드 생성)을 사용합니다.
      // API를 사용한다면, storedProfileId를 API 요청에 포함해야 합니다.
      // 예: fetch(`/api/exercises`, { method: 'POST', body: JSON.stringify({ profileId: storedProfileId }) })
      console.log("⚠️ 저장된 추천 없음, savedDogInfo 기반으로 클라이언트에서 생성 (실제로는 API 호출 권장)");
      const recommendations = generateExerciseRecommendations(savedDogInfo);

      const typedRecommendations = recommendations.map(rec => ({
        ...rec,
        isCustom: false,
        steps: normalizeSteps(rec.steps),
      }));

      const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", []).map(rec => ({
        ...rec,
        steps: normalizeSteps(rec.steps),
      }));
      
      setExercises([...typedRecommendations, ...customExercises]);
      // 생성된 추천을 localStorage에 저장할 수 있습니다 (선택 사항).
      // API를 사용한다면 API 응답을 저장합니다.
      // setLocalStorageItem("dogfit-recommendations", typedRecommendations); // 필요시 주석 해제
    } else {
      // 강아지 정보도 없는 경우 (이론적으로 storedProfileId가 있으면 dogInfo도 있어야 함)
      console.error("❌ 강아지 정보 없음, 프로필 페이지로 이동");
      router.push("/profile");
      return; // useEffect 실행 중단
    }

    setLoading(false);
  }, [router]); // router를 의존성 배열에 추가합니다.
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? exercises.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === exercises.length - 1 ? 0 : prev + 1))
  }

  const handleAddCustomExercise = () => {
    if (!customExercise.name || !customExercise.description) return

    // steps 변환
    const normalizeSteps = (steps: any) => {
      if (!steps) return [];
      if (Array.isArray(steps) && typeof steps[0] === "string") {
        return steps.map((s: string) => ({ step: s, stepDuration: 60 }));
      }
      return steps;
    };

    const newExercise: CustomExercise = {
      id: `custom-${Date.now()}`,
      name: customExercise.name || "",
      description: customExercise.description || "",
      difficulty: (customExercise.difficulty as "easy" | "medium" | "hard") || "medium",
      duration: customExercise.duration || 10,
      equipment: customExercise.equipment || [],
      steps: normalizeSteps(customExercise.steps),
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
      steps: [
        ...(customExercise.steps || []),
        { step: customStep, stepDuration: 60 }, // step 객체로 추가
      ],
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
  
  // 이미지 경로 계산
  const exerciseImageUrl = currentExercise.imageUrl || getExerciseImageFilename(currentExercise);

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
              <div className="aspect-square bg-muted flex justify-center items-center relative">
                <Image
                  src={exerciseImageUrl}
                  alt={currentExercise.name}
                  width={220}
                  height={220}
                  className="object-contain"
                  style={{ maxWidth: "80%", maxHeight: "80%" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/exercises/default.png';
                  }}
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
                  {currentExercise.equipment?.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item}
                    </Badge>
                  )) || <span>장비 정보가 없습니다.</span>}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">기대 효과</h3>
                <div className="flex flex-wrap gap-2">
                  {currentExercise.benefits?.map((benefit, index) => (
                    <Badge key={index} variant="outline">
                      {benefit}
                    </Badge>
                  )) || <span>효과 정보가 없습니다.</span>}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">운동 단계</h3>
                <ol className="list-decimal pl-4 space-y-1">
                  {Array.isArray(currentExercise.steps) && currentExercise.steps.map((stepObj, idx) => (
                    <li key={idx}>
                      {typeof stepObj === "string"
                        ? stepObj
                        : stepObj.description
                          ? `${stepObj.description}${stepObj.stepDuration ? ` (${stepObj.stepDuration}초)` : ""}`
                          : `${stepObj.step}${stepObj.stepDuration ? ` (${stepObj.stepDuration}초)` : ""}`}
                    </li>
                  ))}
                </ol>
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
                      {customExercise.steps?.map((stepObj, index) => (
                        <div key={index} className="bg-secondary p-2 rounded-md text-sm">
                          {index + 1}. {typeof stepObj === "string" ? stepObj : stepObj.step}
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

            <Link href={{
              pathname: `/exercise/${currentExercise.id}`,
              query: { imageUrl: exerciseImageUrl }
            }}>
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
