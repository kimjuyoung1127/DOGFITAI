"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PawPrintLoading } from "@/components/ui/paw-print-loading"
import { motion } from "framer-motion"
import type { Breed, DogInfo, DogProfile } from "@/lib/types"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/utils"
import { StampWidget } from "@/components/ui/stamp-widget"
import { dogBreedData } from "@/Data/DogBreedData"
import { Minus, Plus, Activity, ChevronDown, ChevronUp, PlayIcon as Run, Zap, Mountain, Scale, Hand, Triangle, Circle, Disc, CircleDot, Square, RectangleVerticalIcon as Rectangle, Info } from "lucide-react";
import { BreedSelector } from "@/components/ui/Breed-selector"
import { DropdownItem } from "@/components/ui/dropdown"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { healthCategories } from "@/Data/Health"
import { activityIcons, activityNames } from "@/Data/Activity"
import { equipmentItems } from "@/Data/EquipmentItem"
import { basicPerformanceCategories, advancedPerformanceCategories, performanceFieldMapping } from "@/Data/Performance"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { insertDogProfile } from "@/lib/supabase/insertDogProfile"
import { getDogProfile } from "@/lib/supabase/getDogProfile"
import { upsertDogProfile } from "@/lib/supabase/upsertDogProfile"
import { supabase } from "@/lib/supabase/supabaseClient"

const stepNames = ["기본 정보", "건강 상태", "운동 능력", "활동 선호도", "운동기구"];

// DogInfoForm의 내용을 이 컴포넌트로 옮깁니다.
export default function FormContent() {
  const router = useRouter()
  const searchParams = useSearchParams() // 여기서 useSearchParams 사용
  const hasPendingData = searchParams.get('pending_data') === 'true'

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  // ... (기존 DogInfoForm의 나머지 모든 상태 및 로직)
  const initialDogInfo: DogInfo = {
    name: "",
    age: 0,
    breed: "",
    weight: 0.1,
    activityLevel: "medium",
    healthIssues: [],
    gender: "",
  };
  const initialHealthValues: Record<string, number> = healthCategories.reduce((acc, category) => {
    acc[category.id] = 0;
    return acc;
  }, {} as Record<string, number>);
  const initialPerformanceValues: Record<string, number> = Object.keys(performanceFieldMapping).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<string, number>);
  const initialSelectedActivities: Record<string, boolean> = {
    running: false,
    jumping: false,
    climbing: false,
    balance: false,
    holding: false,
  };
  const initialIntensities: Record<string, number> = {
    running: 0,
    jumping: 0,
    climbing: 0,
    balance: 0,
    holding: 0,
  };
  const initialSelectedEquipment: Record<string, boolean> = equipmentItems.reduce((acc, item) => {
    acc[item.key] = false;
    return acc;
  }, {} as Record<string, boolean>);

  const [dogInfo, setDogInfo] = useState<DogInfo>(initialDogInfo)
  const [profiles, setProfiles] = useState<DogProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [isSaveProfileChecked, setIsSaveProfileChecked] = useState(false)
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [healthValues, setHealthValues] = useState<Record<string, number>>(
    healthCategories.reduce((acc, category) => {
      acc[category.id] = 0
      return acc
    }, {} as Record<string, number>)
  )
  const [performanceValues, setPerformanceValues] = useState(
    Object.keys(performanceFieldMapping).reduce((acc, key) => {
      acc[key] = 0
      return acc
    }, {} as Record<string, number>)
  )
  const [selectedActivities, setSelectedActivities] = useState<Record<string, boolean>>({
    running: false,
    jumping: false,
    climbing: false,
    balance: false,
    holding: false,
  })
  const [intensities, setIntensities] = useState<Record<string, number>>({
    running: 0,
    jumping: 0,
    climbing: 0,
    balance: 0,
    holding: 0,
  })
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, boolean>>(
    equipmentItems.reduce((acc, item) => {
      acc[item.key] = false;
      return acc;
    }, {} as Record<string, boolean>)
  )
  const [equipmentList, setEquipmentList] = useState(equipmentItems)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // --- 임시 저장: step2~step5 상태를 localStorage에 저장 및 복원 ---
  useEffect(() => {
    if (selectedProfileId !== null) {
      setLocalStorageItem("dogfit-form-temp", {
        healthValues,
        performanceValues,
        selectedActivities,
        intensities,
        selectedEquipment,
        step,
      })
    }
  }, [selectedProfileId, healthValues, performanceValues, selectedActivities, intensities, selectedEquipment, step]) // 의존성 배열 업데이트

  useEffect(() => {
    const temp = getLocalStorageItem("dogfit-form-temp", null) as {
      healthValues?: typeof healthValues,
      performanceValues?: typeof performanceValues,
      selectedActivities?: typeof selectedActivities,
      intensities?: typeof intensities,
      selectedEquipment?: typeof selectedEquipment,
      step?: number
    } | null
    if (temp) {
      if (temp.healthValues) setHealthValues(temp.healthValues)
      if (temp.performanceValues) setPerformanceValues(temp.performanceValues)
      if (temp.selectedActivities) setSelectedActivities(temp.selectedActivities)
      if (temp.intensities) setIntensities(temp.intensities)
      if (temp.selectedEquipment) setSelectedEquipment(temp.selectedEquipment)
      if (temp.step) setStep(temp.step)
    }
  }, [selectedProfileId])
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()
  }, [])
  
  useEffect(() => {
    if (isAuthenticated && hasPendingData) {
      const pendingData = getLocalStorageItem('dogfit-pending-profile', null)
      if (pendingData) {
        const typedPendingData = pendingData as {
          step?: number;
          dogInfo?: typeof dogInfo;
          healthValues?: typeof healthValues;
          performanceValues?: typeof performanceValues;
          selectedActivities?: typeof selectedActivities;
          intensities?: typeof intensities;
          selectedEquipment?: typeof selectedEquipment;
        };
        
        if (typedPendingData.dogInfo) setDogInfo(typedPendingData.dogInfo);
        if (typedPendingData.healthValues) setHealthValues(typedPendingData.healthValues);
        if (typedPendingData.performanceValues) setPerformanceValues(typedPendingData.performanceValues);
        if (typedPendingData.selectedActivities) setSelectedActivities(typedPendingData.selectedActivities);
        if (typedPendingData.intensities) setIntensities(typedPendingData.intensities);
        if (typedPendingData.selectedEquipment) setSelectedEquipment(typedPendingData.selectedEquipment);
        if (typedPendingData.step) setStep(typedPendingData.step); // step 복원 추가
        
        // 로컬 스토리지에서 pending 데이터 삭제
        localStorage.removeItem('dogfit-pending-profile');
        // URL에서 pending_data 파라미터 제거 (새로고침 시 반복 실행 방지)
        router.replace('/form', undefined);
      }
    }
  }, [isAuthenticated, hasPendingData, router]) // router를 의존성 배열에 추가

  // ... (기존 DogInfoForm의 나머지 모든 함수 및 JSX 렌더링 로직)
  // 예시: handleNext, handlePrev, handleSubmit, renderStep 등 모든 함수 포함
  // 마지막 return 문은 Card 컴포넌트를 포함한 전체 UI가 됩니다.

  // 임시로 간단한 JSX를 반환하도록 설정합니다. 실제로는 전체 폼 UI가 와야 합니다.
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl bg-white dark:bg-gray-900 rounded-xl">
      {/* ... 기존 CardHeader, CardContent, CardFooter 내용 ... */}
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6 rounded-t-xl">
        <CardTitle className="text-3xl font-bold text-center">AI 운동 추천 설문</CardTitle>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        {/* 여기에 각 단계별 폼 내용이 렌더링됩니다. */}
        {/* 예시: {renderStep()} */}
        <p>현재 단계: {stepNames[step - 1]}</p>
        <p>로드 중: {isLoading ? "예" : "아니오"}</p>
        <p>인증됨: {isAuthenticated === null ? "확인 중..." : isAuthenticated ? "예" : "아니오"}</p>
        <p>보류 중인 데이터 있음: {hasPendingData ? "예" : "아니오"}</p>
      </CardContent>
      <CardFooter className="flex justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
        <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || isLoading}>
          이전
        </Button>
        <Button onClick={() => setStep(s => Math.min(stepNames.length, s + 1))} disabled={step === stepNames.length || isLoading}>
          다음
        </Button>
      </CardFooter>
    </Card>
  );
}