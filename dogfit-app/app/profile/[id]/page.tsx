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
    endurance: number
    mobility: number
    reaction: number
    focus: number
    agility: number
    balance: number
    confidence: number
    bodyAwareness: number
    problemSolving: number
    speed: number
    [key: string]: number // Keep for flexibility
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
        console.error("Error fetching dog profile:", error)
        setDogProfile(null)
        setPerformanceValues(null)
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
      // Return the breed to be used by fetchBreedAverageData
      return data.breed 
    }

    // summary와 recommendations를 한 번에 받아서 상태/로컬스토리지에 저장
    const fetchSummaryAndRecommendations = async () => {
      try {
        const res = await fetch("/api/exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId }),
        })
        if (!res.ok) {
          const errorData = await res.json();
          console.error("분석 요약 및 추천 API 호출 실패 응답:", errorData);
          throw new Error(errorData.error || "분석 요약 및 추천 API 호출 실패");
        }
        const data = await res.json()
        setSummaryText(data.summary || "분석 요약을 불러오지 못했습니다.")
        // 추천 운동을 상태와 로컬스토리지에 저장
        if (data.recommendations) {
          setExerciseRecommendations(data.recommendations)
          localStorage.setItem("dogfit-recommendations", JSON.stringify(data.recommendations))
        }
      } catch (e) {
        console.error("fetchSummaryAndRecommendations 에러:", e);
        setSummaryText("분석 요약을 불러오지 못했습니다.")
      }
    }

    // 중복 호출 없이 한 번씩만 실행
    fetchProfile().then(breed => {
      if (breed) {
        fetchBreedAverageData(breed)
      }
    })
    fetchSummaryAndRecommendations()
    fetchExerciseHistory()

    const fetchExerciseHistory = async () => {
      if (!profileId) return
      try {
        const { data, error } = await supabase
          .from('exercise_history')
          .select('date, performance_values, completed')
          .eq('profile_id', profileId)
          .order('date', { ascending: true })

        if (error) {
          console.error("Error fetching exercise history:", error)
          setExerciseHistory([])
          return
        }
        if (data) {
          const historyItems: HistoryItem[] = data.map(item => ({
            date: item.date,
            values: item.performance_values as PerformanceValues, // Assuming performance_values is already correct type
            completed: item.completed,
          }))
          setExerciseHistory(historyItems)
        } else {
          setExerciseHistory([])
        }
      } catch (e) {
        console.error("Error in fetchExerciseHistory:", e)
        setExerciseHistory([])
      }
    }

    const fetchBreedAverageData = async (breedName: string) => {
      try {
        const { data, error } = await supabase
          .from("breed_average_performance")
          .select("*")
          .eq("breed", breedName)
          .single()

        if (error) {
          console.error("Error fetching breed average performance data for breed:", breedName, error)
          setBreedAvgValues(null)
          return
        }

        if (data) {
          const breedPerformance: PerformanceValues = {
            endurance: data.endurance ?? 0,
            mobility: data.mobility ?? 0,
            reaction: data.reaction ?? 0,
            focus: data.focus ?? 0,
            agility: data.agility ?? 0,
            balance: data.balance ?? 0,
            confidence: data.confidence ?? 0,
            bodyAwareness: data.bodyAwareness ?? 0,
            problemSolving: data.problemSolving ?? 0,
            speed: data.speed ?? 0,
            // Ensure all keys from the new PerformanceValues are present
          }
          setBreedAvgValues(breedPerformance)
        } else {
          console.log("No breed average data found for:", breedName)
          setBreedAvgValues(null)
        }
      } catch (e) {
        console.error("Error in fetchBreedAverageData for breed:", breedName, e)
        setBreedAvgValues(null)
      }
    }
  }, [profileId])

  // 차트용 데이터 변환
  const radarData = performanceValues
    ? [
        ...basicPerformanceCategories.map(cat => ({
          subject: cat.title,
          value: performanceValues[cat.id] ?? 0,
          avg: breedAvgValues ? breedAvgValues[cat.id] ?? 0 : 0,
        })),
        ...advancedPerformanceCategories.map(cat => ({
          subject: cat.title,
          value: performanceValues[cat.id] ?? 0,
          avg: breedAvgValues ? breedAvgValues[cat.id] ?? 0 : 0,
        })),
      ]
    : []

  const barData = radarData

  const historyChartData = exerciseHistory.map((item) => ({
    date: new Date(item.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
    endurance: item.values.endurance ?? 0, // Changed from stamina
    agility: item.values.agility ?? 0,
    speed: item.values.speed ?? 0,
    // Add other specific values you want to track, ensuring they exist in PerformanceValues
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
                <Tooltip /> {/* Added Tooltip for RadarChart */}
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

      {/* 5. 능력치 변화 추이 (LineChart) 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>능력치 변화 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {historyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="endurance" name="체력" stroke="#8884d8" />
                <Line type="monotone" dataKey="agility" name="민첩성" stroke="#82ca9d" />
                <Line type="monotone" dataKey="speed" name="속도" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div>운동 기록이 없어 추이를 표시할 수 없습니다.</div>
          )}
        </CardContent>
      </Card>

      {/* 6. 액션 버튼 */}
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
