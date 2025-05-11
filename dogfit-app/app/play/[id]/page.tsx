"use client"

import React from 'react'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PawPrintLoading } from "@/components/ui/paw-print-loading"
import { motion, AnimatePresence } from "framer-motion"
import type { Exercise, CustomExercise } from "@/lib/types"
import { getLocalStorageItem, generateExerciseRecommendations } from "@/lib/utils"
import { StampWidget } from "@/components/ui/stamp-widget"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { warmupSteps, cooldownSteps } from "@/lib/presets" // 추가
import { Badge } from "@/components/ui/badge" // 추가

export default function ExercisePlayPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)

  const [allDisplaySteps, setAllDisplaySteps] = useState<string[]>([]) // 추가
  const [stepPhase, setStepPhase] = useState<"warmup" | "main" | "cooldown">("warmup") // 추가

  // params를 React.use()로 unwrap하고 id 가져오기
// 기존 방식으로 돌아가기
  const id = params.id;

  useEffect(() => {
    // Load exercises from localStorage
    const recommendations = getLocalStorageItem<Exercise[]>("dogfit-recommendations", [])
    const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", [])
    const allExercises = [...recommendations, ...customExercises]

    // Find the exercise with the matching ID
    let foundExercise = allExercises.find((ex) => ex.id === id)

    if (foundExercise) {
      // setExercise(foundExercise) // 아래에서 allDisplaySteps 설정 후 함께 처리
    } else {
      // If no exercises in localStorage, generate them from the dog info
      const dogInfo = getLocalStorageItem("dogfit-dog-info", null)
      if (dogInfo) {
        const generatedExercises = generateExerciseRecommendations(dogInfo)
        const foundGeneratedExercise = generatedExercises.find((ex) => ex.id === id)

        if (foundGeneratedExercise) {
          foundExercise = foundGeneratedExercise // API에서 생성된 운동으로 설정
        } else {
          // Exercise not found, redirect to results
          router.push("/result")
          return // useEffect 종료
        }
      } else {
        // No dog info, redirect to form
        router.push("/form")
        return // useEffect 종료
      }
    }

    if (foundExercise) {
      const mainSteps = foundExercise.steps || [];
      // Always use preset as default, and only use custom if it's a non-empty array
      let currentWarmupSteps: string[] = Array.isArray(foundExercise.warmupSteps) && foundExercise.warmupSteps.length > 0
        ? foundExercise.warmupSteps
        : Array.isArray(warmupSteps) ? warmupSteps : [];
      let currentCooldownSteps: string[] = Array.isArray(foundExercise.cooldownSteps) && foundExercise.cooldownSteps.length > 0
        ? foundExercise.cooldownSteps
        : Array.isArray(cooldownSteps) ? cooldownSteps : [];
      const allSteps = [...currentWarmupSteps, ...mainSteps, ...currentCooldownSteps];
      setAllDisplaySteps(allSteps);
      setExercise(foundExercise);
    }

    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [id, router])

  useEffect(() => {
    if (exercise && allDisplaySteps.length > 0) {
      // Calculate progress
      setProgress(((currentStep + 1) / allDisplaySteps.length) * 100)

      // Determine step phase
      const numWarmup = Array.isArray(exercise.warmupSteps)
        ? exercise.warmupSteps.length
        : Array.isArray(warmupSteps)
          ? warmupSteps.length
          : 0;
      const numMain = Array.isArray(exercise.steps) ? exercise.steps.length : 0;
      
      if (currentStep < numWarmup) {
        setStepPhase("warmup")
      } else if (currentStep < numWarmup + numMain) {
        setStepPhase("main")
      } else {
        setStepPhase("cooldown")
      }
    }
  }, [currentStep, exercise, allDisplaySteps])

  const handleNextStep = () => {
    if (!exercise || allDisplaySteps.length === 0) return

    if (currentStep < allDisplaySteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setCompleted(true)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    router.push(`/complete/${id}`)
  }

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

  if (!exercise || allDisplaySteps.length === 0) { // allDisplaySteps 조건 추가
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
            
            {/* 현재 루틴 타입 표시 */}
            <div className="flex justify-center">
              <Badge variant="secondary">
                {stepPhase === "warmup" ? "운동 전 준비" : stepPhase === "cooldown" ? "마무리 운동" : "본 운동"}
              </Badge>
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
                  <p className="text-lg">{allDisplaySteps[currentStep]}</p>
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
                <Button onClick={handleNextStep}>{currentStep === allDisplaySteps.length - 1 ? "완료" : "다음"}</Button>
              </>
            )}
          </CardFooter>
        </Card>
      </motion.div>
      <StampWidget />
    </div>
  )
}
