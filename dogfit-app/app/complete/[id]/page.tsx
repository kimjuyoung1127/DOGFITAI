"use client";
export const runtime = 'edge';

import React from 'react'
import { useState, useEffect, useRef } from "react" // useRef import 추가
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PawPrintLoading } from "@/components/ui/paw-print-loading"
import { Confetti } from "@/components/ui/confetti"
import { motion } from "framer-motion"
import type { Exercise, CustomExercise, DogInfo } from "@/lib/types"
import { getLocalStorageItem, addStamp, shareToSNS, setLocalStorageItem } from "@/lib/utils"
import { StampWidget } from "@/components/ui/stamp-widget"
import { Home, Twitter, Instagram, Clock } from "lucide-react"
import Link from "next/link"
import { generateExerciseRecommendations } from "@/lib/utils"
import { addExerciseHistory, addExerciseHistoryToProfile } from "@/lib/supabase/updateHistory"

export default function CompletePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [dogInfo, setDogInfo] = useState<DogInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [stamps, setStamps] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  
  // 이전에 저장된 운동 ID를 추적하기 위한 ref
  const lastSavedExerciseIdRef = useRef<string | null>(null);

  // params를 React.use()로 unwrap하고 id 가져오기  
  // 기존 방식으로 돌아가기
  const id = params.id;

  useEffect(() => {
    // 어떤 id가 사용되는지 콘솔에 출력
    console.log("[DogFit][CompletePage] params.id:", id);

    // Load exercises from localStorage
    const recommendations = getLocalStorageItem<Exercise[]>("dogfit-recommendations", [])
    const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", [])
    const allExercises = [...recommendations, ...customExercises]

    // Find the exercise with the matching ID
    let foundExercise = allExercises.find((ex) => ex.id === id)

    // Load dog info
    const savedDogInfo = getLocalStorageItem<DogInfo | null>("dogfit-dog-info", null)
    setDogInfo(savedDogInfo)

    // 운동 찾기 (로컬 → 생성)
    if (!foundExercise && savedDogInfo) {
      const generatedExercises = generateExerciseRecommendations(savedDogInfo)
      const foundGeneratedExercise = generatedExercises.find((ex) => ex.id === id)
      if (foundGeneratedExercise) {
        const normalizedSteps = Array.isArray(foundGeneratedExercise.steps) && foundGeneratedExercise.steps.length > 0
          ? foundGeneratedExercise.steps.map((s: string | { step: string; stepDuration: number }) => ({
              step: typeof s === "string" ? s : s.step,
              stepDuration: typeof s === "string" ? 60 : s.stepDuration
            }))
          : [];
        foundExercise = {
          ...foundGeneratedExercise,
          isCustom: false,
          steps: normalizedSteps
        }
      }
    }

    if (foundExercise) {
      setExercise(foundExercise)
      // 운동 완료 데이터를 히스토리에 저장 (현재 ID에 대해 아직 저장되지 않은 경우에만)
      if (savedDogInfo && lastSavedExerciseIdRef.current !== id) {
        saveExerciseToHistory(foundExercise, savedDogInfo);
        lastSavedExerciseIdRef.current = id; // 현재 ID에 대해 저장되었음을 표시
      }
    } else {
      // 운동을 찾지 못한 경우
      if (savedDogInfo) {
        router.push("/result")
      } else {
        router.push("/form")
      }
    }

    // Add stamp
    const newStampCount = addStamp()
    setStamps(newStampCount)

    // Show confetti after a short delay
    setTimeout(() => {
      setShowConfetti(true)
    }, 500)

    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [id, router]) // 의존성 배열은 그대로 유지
  
  // 운동 완료 데이터를 히스토리에 저장하는 함수
  const saveExerciseToHistory = async (exercise: Exercise, dogInfo: DogInfo | null) => {
    if (!exercise || !dogInfo) return;

    const profileId = getLocalStorageItem("dogfit-selected-profile-id", null);
    console.log("[DogFit][CompletePage] profileId(localStorage):", profileId);

    if (!profileId) return;

    const historyEntry = {
      profile_id: profileId, // exercise_history 테이블의 profile_id 컬럼
      exercise_name: exercise.name,
      date: new Date().toISOString(),
      duration: exercise.duration,
      isCustom: exercise.isCustom || false,
      difficulty: exercise.difficulty,
      dogName: dogInfo.name,
      equipmentUsed: exercise.equipment || [],
      benefits: exercise.benefits || []
    };

    // Supabase에 기록 추가
    try {
      // 반드시 exercise_history 테이블에 insert 하도록 구현
      await addExerciseHistory(profileId, historyEntry)
    } catch (e) {
      console.error("🔥 [saveExerciseToHistory] 운동 기록 저장 실패:", e)
    }
  };

  const handleShareTwitter = () => {
    if (!exercise || !dogInfo) return
    
    const message = `${dogInfo.name}와(과) 함께 ${exercise.name} 운동을 완료했어요! 🎉 #DogFit #강아지운동 #펫테크`
    const url = window.location.href
    
    // Twitter(X) 공유 URL 형식
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank')
  }

  const handleShareInstagram = () => {
    if (!exercise || !dogInfo) return
    
    // Instagram은 직접 공유 API가 제한적이므로 클립보드에 복사하는 방식으로 안내
    const message = `${dogInfo.name}와(과) 함께 ${exercise.name} 운동을 완료했어요! 🎉 #DogFit #강아지운동 #펫테크`
    
    navigator.clipboard.writeText(message)
      .then(() => {
        alert('📋 메시지가 클립보드에 복사되었어요! Instagram에 붙여넣기 해보세요 🐾')
      })
      .catch(err => {
        console.error('클립보드 복사에 실패했어요:', err)
        alert('메시지 복사에 실패했어요. 직접 작성해주세요!')
      })
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-xl font-bold mb-6">완료 정보를 처리하고 있어요</h2>
            <PawPrintLoading />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!exercise) {
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
      {showConfetti && <Confetti />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full">
          <CardHeader className="bg-primary text-white">
            <CardTitle className="text-center">운동 완료!</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.3 }}
              className="flex flex-col items-center justify-center py-4"
            >
              <div className="bg-secondary rounded-full p-6 mb-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, delay: 0.5 }}>
                  <img src="/placeholder.svg?height=100&width=100" alt="Stamp" className="h-20 w-20" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-center">스탬프 획득!</h2>
              <p className="text-center text-muted-foreground mt-2">총 {stamps}개의 스탬프를 모았어요!</p>
              {stamps >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-4 bg-primary/10 p-3 rounded-lg text-center"
                >
                  <p className="font-bold text-primary">🎉 뱃지 잠금 해제! 🎉</p>
                  <p className="text-sm">5개 이상의 스탬프를 모아 뱃지를 획득했어요!</p>
                </motion.div>
              )}
            </motion.div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">완료한 운동</h3>
              <div className="bg-secondary p-4 rounded-lg">
                <div className="font-bold">{exercise.name}</div>
                <div className="text-sm text-muted-foreground">{exercise.description}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">SNS에 공유하기</h3>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 flex items-center gap-2" onClick={handleShareTwitter}>
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
                <Button variant="outline" className="flex-1 flex items-center gap-2" onClick={handleShareInstagram}>
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col justify-center p-6 pt-0">
            <Link href="/profile" className="w-full">
              <Button className="flex items-center gap-2 w-full">
                <Home className="h-4 w-4" />
                프로필로 돌아가기
              </Button>
            </Link>
            <Link href="/history" className="w-full mt-4">
              <Button variant="outline" className="flex items-center gap-2 w-full">
                <Clock className="h-4 w-4" />
                운동 기록 보기
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
      <StampWidget />
    </div>
  )
}
