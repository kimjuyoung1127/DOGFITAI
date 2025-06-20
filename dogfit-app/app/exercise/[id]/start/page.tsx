"use client";
export const runtime = 'edge';

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Exercise, CustomExercise } from "@/lib/types"
import { getLocalStorageItem } from "@/lib/utils"

export default function ExerciseStartPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const id = params.id

  useEffect(() => {
    const recommendations = getLocalStorageItem<Exercise[]>("dogfit-recommendations", [])
    const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", [])
    const allExercises = [...recommendations, ...customExercises]
    const foundExercise = allExercises.find((ex) => ex.id === id)
    if (foundExercise) {
      setExercise(foundExercise)
    } else {
      router.push("/result")
    }
    setLoading(false)
  }, [id, router])

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-xl font-bold mb-6">운동 정보를 불러오고 있어요</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!exercise) return null

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">🐶 운동 준비 완료!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-bold text-lg mb-1">📌 운동 이름</div>
            <div>{exercise.name}</div>
          </div>
          <div>
            <div className="font-bold text-lg mb-1">📍 소요 시간</div>
            <div>약 {exercise.duration}분</div>
          </div>
          <div>
            <div className="font-bold text-lg mb-1">🧩 기대 효과</div>
            <div className="flex flex-wrap gap-2">
              {exercise.benefits?.map((benefit, idx) => (
                <Badge key={idx} variant="outline">{benefit}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="font-bold text-lg mb-1">🛠️ 사용할 장비</div>
            <div className="flex flex-wrap gap-2">
              {exercise.equipment?.length > 0
                ? exercise.equipment.map((item, idx) => (
                    <Badge key={idx} variant="secondary">{item}</Badge>
                  ))
                : <span>별도 장비 없음</span>
              }
            </div>
          </div>
          <div>
            <div className="font-bold text-lg mb-1">설명</div>
            <div>{exercise.description}</div>
          </div>
          <div className="flex gap-4 mt-6">
            <Button className="flex-1" onClick={() => router.push(`/play/${id}`)}>
              ✅ 웜업부터 시작하기
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => router.push(`/play/${id}?skipWarmup=true`)}>
              🚀 본 운동만 시작하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}