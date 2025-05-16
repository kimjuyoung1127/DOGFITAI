"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PawPrintLoading } from "@/components/ui/paw-print-loading"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { warmupSteps, cooldownSteps } from "@/lib/presets"
import { Badge } from "@/components/ui/badge"
import { StampWidget } from "@/components/ui/stamp-widget"
import type { Exercise, CustomExercise } from "@/lib/types"
import { getLocalStorageItem, generateExerciseRecommendations } from "@/lib/utils"

export default function ExercisePlayPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const skipWarmup = searchParams.get("skipWarmup") === "true"
  const id = params.id

  // 상태 관리
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  // 1. allDisplaySteps 타입 변경
  const [allDisplaySteps, setAllDisplaySteps] = useState<{ step: string; stepDuration: number }[]>([])
  const [stepPhase, setStepPhase] = useState<"warmup" | "main" | "cooldown">("warmup")
  const [stepTimeLeft, setStepTimeLeft] = useState<number>(60)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const [stepDurations, setStepDurations] = useState<number[]>([])

  // 운동 데이터 로딩 및 초기화
  useEffect(() => {
    const recommendations = getLocalStorageItem<Exercise[]>("dogfit-recommendations", [])
    const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", [])
    const allExercises = [...recommendations, ...customExercises]
    let foundExercise = allExercises.find((ex) => ex.id === id)

    if (!foundExercise) {
      const dogInfo = getLocalStorageItem("dogfit-dog-info", null)
      if (dogInfo) {
        const generatedExercises = generateExerciseRecommendations(dogInfo)
        const foundGeneratedExercise = generatedExercises.find((ex) => ex.id === id)
        if (foundGeneratedExercise) {
          // steps가 string[]이면 변환 (빈 배열/undefined 방어)
          const steps =
            Array.isArray(foundGeneratedExercise.steps) &&
            foundGeneratedExercise.steps.length > 0
              ? foundGeneratedExercise.steps.map((s: string | { step: string; stepDuration: number }) => ({
                  step: typeof s === "string" ? s : s.step,
                  stepDuration: typeof s === "string" ? 60 : s.stepDuration
                }))
              : [];
          foundExercise = {
            ...foundGeneratedExercise,
            steps,
            isCustom: false,
          };
        } else {
          router.push("/result")
          return
        }
      } else {
        router.push("/form")
        return
      }
    }

    if (foundExercise) {
      // Normalize mainSteps to always be { step, stepDuration }[]
      const mainSteps =
        Array.isArray(foundExercise.steps) && foundExercise.steps.length > 0 && typeof foundExercise.steps[0] === "string"
          ? (foundExercise.steps as string[]).map((s) => ({ step: s, stepDuration: 60 }))
          : Array.isArray(foundExercise.steps)
            ? (foundExercise.steps as { step: string; stepDuration: number }[])
            : [];
      
      // If you need to convert this to a string array containing only the step descriptions:
      const stepDescriptions: string[] = mainSteps.map(stepObj => stepObj.step);
      // Warmup/Cooldown normalization remains the same
      const currentWarmupSteps = Array.isArray(foundExercise.warmupSteps) && foundExercise.warmupSteps.length > 0
        ? foundExercise.warmupSteps.map((s) => ({ step: s, stepDuration: 30 }))
        : Array.isArray(warmupSteps)
          ? warmupSteps.map((s) => ({ step: s, stepDuration: 30 }))
          : [];
      const currentCooldownSteps = Array.isArray(foundExercise.cooldownSteps) && foundExercise.cooldownSteps.length > 0
        ? foundExercise.cooldownSteps.map((s) => ({ step: s, stepDuration: 30 }))
        : Array.isArray(cooldownSteps)
          ? cooldownSteps.map((s) => ({ step: s, stepDuration: 30 }))
          : [];
      const allSteps = [...currentWarmupSteps, ...mainSteps, ...currentCooldownSteps];
      setAllDisplaySteps(allSteps);
      setExercise(foundExercise);

      const durations = allSteps.map((stepObj) => stepObj.stepDuration ?? 60);
      setStepDurations(durations);
      setStepTimeLeft(durations[skipWarmup ? currentWarmupSteps.length : 0] || 60);
      setCurrentStep(skipWarmup ? currentWarmupSteps.length : 0);
    }

    setTimeout(() => setLoading(false), 1000)
  }, [id, router, skipWarmup])

  // 진행도 및 단계 구분
  useEffect(() => {
    if (exercise && allDisplaySteps.length > 0) {
      setProgress(((currentStep + 1) / allDisplaySteps.length) * 100)
      const numWarmup = Array.isArray(exercise.warmupSteps)
        ? exercise.warmupSteps.length
        : Array.isArray(warmupSteps) ? warmupSteps.length : 0
      const numMain = Array.isArray(exercise.steps) ? exercise.steps.length : 0
      if (currentStep < numWarmup) setStepPhase("warmup")
      else if (currentStep < numWarmup + numMain) setStepPhase("main")
      else setStepPhase("cooldown")
    }
  }, [currentStep, exercise, allDisplaySteps])

  // 타이머 효과
  useEffect(() => {
    if (!isTimerRunning) return
    if (stepTimeLeft <= 0) {
      setIsTimerRunning(false)
      return
    }
    const timer = setInterval(() => {
      setStepTimeLeft((prev) => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [isTimerRunning, stepTimeLeft])

  // 단계 이동 시 타이머 초기화
  useEffect(() => {
    if (stepDurations.length > 0) {
      setStepTimeLeft(stepDurations[currentStep] || 60)
      setIsTimerRunning(false)
    }
  }, [currentStep, stepDurations])

  // 핸들러
  const handleNextStep = () => {
    if (!exercise || allDisplaySteps.length === 0) return
    if (currentStep < allDisplaySteps.length - 1) setCurrentStep(currentStep + 1)
    else setCompleted(true)
  }
  const handlePreviousStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }
  const handleComplete = () => router.push(`/complete/${id}`)
  const handleStartPause = () => setIsTimerRunning((prev) => !prev)
  const handleResetTimer = () => setStepTimeLeft(stepDurations[currentStep] || 60)

  // 로딩/에러 처리
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-xl font-bold mb-6">운동을 준비하고 있어요</h2>
            <PawPrintLoading />
          </CardContent>
        </Card>
      </div>
    )
  }
  if (!exercise || allDisplaySteps.length === 0) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-xl font-bold mb-6">운동을 찾을 수 없어요</h2>
            <Link href="/result">
              <Button>추천 운동으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 메인 렌더링
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full">
          <CardHeader className="bg-primary text-white">
            <div className="flex items-center">
              <Link href={`/exercise/${id}`}>
                <Button variant="ghost" size="icon" className="text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <CardTitle className="flex-1 text-center mr-9">{exercise.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행도</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex justify-center">
              <Badge variant="secondary">
                {stepPhase === "warmup" ? "운동 전 준비" : stepPhase === "cooldown" ? "마무리 운동" : "본 운동"}
              </Badge>
            </div>
            {/* 타이머 UI */}
            <div className="flex flex-col items-center space-y-2">
              <div className="text-lg font-bold">
                ⏱️ 남은 시간: {Math.floor(stepTimeLeft / 60)}:{(stepTimeLeft % 60).toString().padStart(2, "0")}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleStartPause}>
                  {isTimerRunning ? "일시정지" : "시작"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleResetTimer}>
                  리셋
                </Button>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {completed ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-10 space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle2 className="h-20 w-20 text-primary" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-center">운동 완료!</h2>
                  <p className="text-center text-muted-foreground">모든 단계를 성공적으로 완료했어요. 정말 잘했어요!</p>
                </motion.div>
              ) : (
                <motion.div
                  key={`step-${currentStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-secondary p-6 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">
                      단계 {currentStep + 1}/{allDisplaySteps.length}
                    </h3>
                  </div>
                  <p className="text-lg">
                    {allDisplaySteps[currentStep]?.step}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex justify-between p-6 pt-0">
            {completed ? (
              <Button onClick={handleComplete} className="w-full">
                완료 및 스탬프 받기
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handlePreviousStep} disabled={currentStep === 0}>
                  이전
                </Button>
                <Button onClick={handleNextStep}>
                  {currentStep === allDisplaySteps.length - 1 ? "완료" : "다음"}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </motion.div>
      <StampWidget />
    </div>
  )
}
