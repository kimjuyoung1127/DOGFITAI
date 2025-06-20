"use client";
export const runtime = 'edge';

import React, { useState, useEffect } from 'react'
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
  const imageUrlFromQuery = searchParams.get('imageUrl')
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([])

  const id = params.id;

  useEffect(() => {
    const recommendations = getLocalStorageItem<Exercise[]>("dogfit-recommendations", []);
    const customExercises = getLocalStorageItem<CustomExercise[]>("dogfit-custom-exercises", []);
    const allExercises = [...recommendations, ...customExercises];
    
    console.log("📥 운동 상세 페이지 - 불러온 운동 목록:", allExercises.length, "개");

    const foundExercise = allExercises.find((ex) => ex.id === id);

    if (foundExercise) {
      console.log("✅ 운동 찾음:", foundExercise.name);
      setExercise(foundExercise);
    } else {
      console.log("⚠️ 운동을 찾을 수 없음, 대체 방법 시도");
      const dogInfo = getLocalStorageItem("dogfit-dog-info", null);
      if (dogInfo) {
        const generatedExercises = generateExerciseRecommendations(dogInfo);
        const foundGeneratedExercise = generatedExercises.find((ex) => ex.id === id);
        if (foundGeneratedExercise) {
          console.log("✅ 생성된 운동에서 찾음:", foundGeneratedExercise.name);
          const normalizedSteps = Array.isArray(foundGeneratedExercise.steps) && typeof foundGeneratedExercise.steps[0] === "string"
            ? (foundGeneratedExercise.steps as string[]).map((s) => ({ step: s, stepDuration: 60 }))
            : (foundGeneratedExercise.steps as unknown as { step: string; stepDuration: number }[]);
          
          setExercise({
            ...foundGeneratedExercise,
            isCustom: false,
            steps: normalizedSteps
          });
        } else {
          console.error("❌ 운동을 찾을 수 없음, 결과 페이지로 이동");
          router.push("/result");
        }
      } else {
        console.error("❌ 강아지 정보 없음, 폼 페이지로 이동");
        router.push("/form");
      }
    }

    // Load history data
    loadHistoryData();

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [id, router]);

  const loadHistoryData = () => {
    if (!id) return;
    
    const historyKey = `dogfit-history-${id}`;
    const historyData = getLocalStorageItem<HistoryItem[]>(historyKey, []);
    
    const sortedHistory = [...historyData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setHistory(sortedHistory);
    setFilteredHistory(sortedHistory);
  };

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
                  {exercise.equipment?.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item}
                    </Badge>
                  )) || <span>장비 정보가 없습니다.</span>}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">운동 단계</h3>
                <div className="space-y-2">
                  {Array.isArray(exercise.steps) && exercise.steps.map((step, index) => {
                    // step이 string이면 객체로 변환, 아니면 그대로 사용
                    let stepObj: { step?: string; description?: string; stepDuration?: number };
                    if (typeof step === "string") {
                      stepObj = { step, stepDuration: 60 };
                    } else {
                      stepObj = step;
                    }
                    return (
                      <div key={index} className="bg-secondary p-3 rounded-lg text-sm">
                        <span className="font-bold mr-2">{index + 1}.</span>
                        {stepObj.description
                          ? `${stepObj.description}${stepObj.stepDuration ? ` (${stepObj.stepDuration}초)` : ""}`
                          : `${stepObj.step ?? ""}${stepObj.stepDuration ? ` (${stepObj.stepDuration}초)` : ""}`}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">기대 효과</h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.benefits?.map((benefit, index) => (
                    <Badge key={index} variant="outline">
                      {benefit}
                    </Badge>
                  )) || <span>효과 정보가 없습니다.</span>}
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

// Define the HistoryItem type
interface HistoryItem {
  id: string;
  name: string;
  date: string;
  duration: number;
  isCustom: boolean;
  difficulty: "easy" | "medium" | "hard";
  dogName: string;
  equipmentUsed: string[];
  benefits: string[];
}
