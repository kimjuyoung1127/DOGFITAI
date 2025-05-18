"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { basicPerformanceCategories, advancedPerformanceCategories } from "@/Data/Performance"
// 차트 라이브러리 import 예시 (실제 프로젝트에 맞게 교체)
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts"
import { supabase } from "@/lib/supabase/supabaseClient"


type PerformanceValues = {
    strength: number
    balance: number
    flexibility: number
    stamina: number
    agility: number
    [key: string]: number
  }
  
  type Recommendation = {
    id: string
    name: string
    description: string
    difficulty: string
    duration: number
    equipment: string[]
    steps: any[]
    benefits: string[]
    contact: string
    reason: string
    caution: string
    meta: string[]
  }
  
  type HistoryItem = {
    date: string
    values: PerformanceValues
    completed: boolean
  }

export default function AnalysisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const profileId = searchParams.get("profileId") || params.id // params.id로 동적 라우트 id 사용

  // 상태 정의
  const [dogProfile, setDogProfile] = useState<any>(null)
  const [performanceValues, setPerformanceValues] = useState<PerformanceValues | null>(null)
  const [exerciseRecommendations, setExerciseRecommendations] = useState<Recommendation[]>([])
  const [exerciseHistory, setExerciseHistory] = useState<HistoryItem[]>([])
  const [breedAvgValues, setBreedAvgValues] = useState<PerformanceValues | null>(null)
  const [summaryText, setSummaryText] = useState<string>("")

  // 데이터 fetch 예시 (실제 fetch 로직은 프로젝트에 맞게 구현)
  useEffect(() => {
    if (!profileId) return

    const fetchProfile = async () => {
      // Supabase에서 해당 프로필 ID로 데이터 fetch
      const { data, error } = await supabase
        .from('dog_profile')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error || !data) {
        setDogProfile(null)
        setPerformanceValues(null)
        // 필요시 에러 처리
        return
      }

      setDogProfile({
        name: data.name,
        age: data.age,
        breed: data.breed,
        weight: data.weight,
        healthIssues: data.health_values ? Object.keys(data.health_values).filter(k => data.health_values[k] > 0) : [],
        equipment: data.equipment_keys || [],
      })
      setPerformanceValues(data.performance_values || null)
      // 필요시 추천/히스토리 등도 여기서 fetch
    }

    // 분석 요약 자동 호출
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId }),
        })
        if (!res.ok) throw new Error("분석 요약 API 호출 실패")
        const data = await res.json()
        setSummaryText(data.summary || "분석 요약을 불러오지 못했습니다.")
      } catch (e) {
        setSummaryText("분석 요약을 불러오지 못했습니다.")
      }
    }

    fetchProfile()
    fetchSummary()
  }, [profileId])

  // 차트용 데이터 변환
  const radarData = performanceValues
    ? [
        ...basicPerformanceCategories.map(cat => ({
          subject: cat.title,
          value: performanceValues[cat.id] ?? 0,
        })),
        ...advancedPerformanceCategories.map(cat => ({
          subject: cat.title,
          value: performanceValues[cat.id] ?? 0,
        })),
      ]
    : []

  const barData = radarData

  const historyChartData = exerciseHistory.map((item) => ({
    date: item.date.slice(5, 10),
    ...item.values,
  }))

  // 액션 핸들러
  const handleRetryRecommendation = () => {
    router.push(`/result?profileId=${profileId}`)
  }

  return (
    <div className="container flex flex-col gap-4 p-4 max-w-md mx-auto">
      {/* 1. 프로필 요약 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>반려견 프로필 요약</CardTitle>
        </CardHeader>
        <CardContent>
          {dogProfile ? (
            <div className="flex flex-col gap-2">
              <div>이름: {dogProfile.name}</div>
              <div>나이: {dogProfile.age}개월</div>
              <div>견종: {dogProfile.breed}</div>
              <div>체중: {dogProfile.weight}kg</div>
              <div>건강상태: {dogProfile.healthIssues?.join(", ") || "없음"}</div>
              <div>보유 기구: {dogProfile.equipment?.join(", ") || "없음"}</div>
            </div>
          ) : (
            <div>프로필 정보를 불러오는 중...</div>
          )}
        </CardContent>
      </Card>

      {/* 2. 전체 능력치 분석 (RadarChart) 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 능력치 분포 </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 5]} />
                <Radar name="내 강아지" dataKey="value" stroke="#f59e42" fill="#fbbf24" fillOpacity={0.5} />
                {breedAvgValues && (
                  <Radar name="견종 평균" dataKey="avg" stroke="#60a5fa" fill="#93c5fd" fillOpacity={0.3} />
                )}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. 능력치 세부 항목별 점수 (BarChart) 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>능력치 세부 점수 </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={Math.max(300, radarData.length * 40)}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis type="category" dataKey="subject" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e42" />
                {breedAvgValues && <Bar dataKey="avg" fill="#60a5fa" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 4. 분석 요약 메시지 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>분석 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div>{summaryText || "분석 요약을 준비 중입니다."}</div>
        </CardContent>
      </Card>


      {/* 5. 액션 버튼 */}
      <div className="flex flex-col gap-2 mt-2">
        <Button className="bg-blue-500 text-white" onClick={handleRetryRecommendation}>
          운동 추천 다시 받기
        </Button>
        <Button variant="outline" onClick={() => router.push("/result")}>
          결과 페이지로 이동
        </Button>
      </div>
    </div>
  )
}