"use client"

import React from 'react'
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PawPrintLoading } from "@/components/ui/paw-print-loading"
import { motion } from "framer-motion"
import type { Exercise, CustomExercise } from "@/lib/types"
import { getLocalStorageItem } from "@/lib/utils"
import { StampWidget } from "@/components/ui/stamp-widget"
import { ArrowLeft, Play } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { generateExerciseRecommendations } from "@/lib/utils"

export default function ExercisePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromHistory = searchParams.get('from') === 'history'
  const imageUrlFromQuery = searchParams.get('imageUrl') // <-- Add this line
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  // 기존 방식으로 돌아가기
  const id = params.id;

  useEffect(() => {
    // Load exercises from localStorage
    const recommendations = getLocalStorageItem<Exercise[]>("dogfit-recommendations", []);
    const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", []);
    const allExercises = [...recommendations, ...customExercises];
    
    console.log("📥 운동 상세 페이지 - 불러온 운동 목록:", allExercises.length, "개");

    // Find the exercise with the matching ID
    const foundExercise = allExercises.find((ex) => ex.id === id);

    if (foundExercise) {
      console.log("✅ 운동 찾음:", foundExercise.name);
      setExercise(foundExercise);
    } else {
      console.log("⚠️ 운동을 찾을 수 없음, 대체 방법 시도");
      // If no exercises in localStorage, generate them from the dog info
      const dogInfo = getLocalStorageItem("dogfit-dog-info", null);
      if (dogInfo) {
        const generatedExercises = generateExerciseRecommendations(dogInfo);
        const foundGeneratedExercise = generatedExercises.find((ex) => ex.id === id);
        if (foundGeneratedExercise) {
          console.log("✅ 생성된 운동에서 찾음:", foundGeneratedExercise.name);
          setExercise({
            ...foundGeneratedExercise,
            isCustom: false
          });
        } else {
          // Exercise not found, redirect to results
          console.error("❌ 운동을 찾을 수 없음, 결과 페이지로 이동");
          router.push("/result");
        }
      } else {
        // No dog info, redirect to form
        console.error("❌ 강아지 정보 없음, 폼 페이지로 이동");
        router.push("/form");
      }
    }

    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [id, router]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-xl font-bold mb-6">운동 정보를 불러오고 있어요</h2>
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
      {fromHistory && (
        <div className="w-full max-w-md mb-4">
          <Link href="/history">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              운동 기록 보기로 돌아가기
            </Button>
          </Link>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full overflow-hidden">
          <CardHeader className="bg-primary text-white">
            <div className="flex items-center">
              <Link href="/result">
                <Button variant="ghost" size="icon" className="text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <CardTitle className="flex-1 text-center mr-9">{exercise.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-square bg-muted flex justify-center items-center relative">
              <Image
                src={imageUrlFromQuery || exercise.imageUrl || "/placeholder.svg?height=200&width=400"}
                alt={exercise.name}
                width={220}
                height={220}
                className="object-contain"
                style={{ maxWidth: "80%", maxHeight: "80%" }}
              />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge
                    variant={
                      exercise.difficulty === "easy"
                        ? "outline"
                        : exercise.difficulty === "medium"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {exercise.difficulty === "easy" ? "쉬움" : exercise.difficulty === "medium" ? "중간" : "어려움"}
                  </Badge>
                  <Badge variant="outline">{exercise.duration}분</Badge>
                </div>
              </div>

              <p>{exercise.description}</p>

              <div>
                <h3 className="font-bold mb-2">필요 장비</h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.equipment.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">운동 단계</h3>
                <div className="space-y-2">
                  {exercise.steps.map((step, index) => (
                    <div key={index} className="bg-secondary p-3 rounded-lg text-sm">
                      <span className="font-bold mr-2">{index + 1}.</span> {step}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">기대 효과</h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.benefits.map((benefit, index) => (
                    <Badge key={index} variant="outline">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center p-6 pt-0">
            <Link href={`/exercise/${exercise.id}/start`}>
              <Button className="w-full">
                <Play className="h-4 w-4 mr-2" />
                운동 시작하기
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
      <StampWidget />
    </div>
  )
}
