"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Minus, Plus, Activity, ChevronDown, ChevronUp, PlayIcon as Run, Zap, Mountain, Scale, Hand, Triangle, Circle, Disc, CircleDot, Square, RectangleVerticalIcon as Rectangle } from "lucide-react"
import { BreedSelector } from "@/components/ui/Breed-selector"
import { DropdownItem } from "@/components/ui/dropdown"
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


export default function DogInfoForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [dogInfo, setDogInfo] = useState<DogInfo>({
    name: "",
    age: 0,
    breed: "",
    weight: 0.1,
    activityLevel: "medium",
    healthIssues: [],
    gender: "",
  })

  // State for profiles
  const [profiles, setProfiles] = useState<DogProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null)
  const [isSaveProfileChecked, setIsSaveProfileChecked] = useState(false)
  const { toast } = useToast()

  // State for saving profile
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

  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, boolean>>({
    cone_bar: false,
    balance_cushion: false,
    balance_disc: false,
    donut_ball: false,
    yoga_block: false,
    platform_board: false,
  })

  // 운동기구 목록을 Supabase에서 불러오는 함수
  const [equipmentList, setEquipmentList] = useState(equipmentItems)

  useEffect(() => {
    // Load profiles from localStorage
    const storedProfiles = getLocalStorageItem<DogProfile[]>("dogfit-profiles", [])
    setProfiles(storedProfiles)

    // 프로필 데이터 불러오기
    const loadProfileData = async () => {
      try {
        const { data, error } = await getDogProfile()
        
        if (error) {
          console.error("프로필 데이터 불러오기 실패:", error.message)
          return
        }
        
        if (data && data.length > 0) {
          const profile = data[0] // 첫 번째 프로필 사용
          
          // 기본 정보 설정
          setDogInfo({
            name: profile.name || "",
            age: profile.age ? profile.age / 12 : 0, // 월 단위를 년 단위로 변환
            breed: profile.breed || "",
            weight: profile.weight || 0.1,
            activityLevel: "medium",
            healthIssues: [],
            gender: profile.sex || "",
          })
          
          // 건강 정보 설정
          if (profile.health_values) {
            setHealthValues(profile.health_values)
          }
          
          // 운동 능력 정보 설정
          if (profile.performance_values) {
            setPerformanceValues(profile.performance_values)
          }
          
          // 활동 선호도 설정
          if (profile.preferences) {
            // 선택된 활동 설정
            if (profile.preferences.selected) {
              const updatedSelectedActivities = { ...selectedActivities };
              profile.preferences.selected.forEach((activity: string) => {
                if (updatedSelectedActivities.hasOwnProperty(activity)) {
                  updatedSelectedActivities[activity] = true;
                }
              });
              setSelectedActivities(updatedSelectedActivities);
            }
            
            // 강도 설정
            if (profile.preferences.intensity) {
              setIntensities(prevIntensities => ({
                ...prevIntensities,
                ...profile.preferences.intensity
              }));
            }
          }
          
          // 운동기구 선택 정보 설정
          if (profile.equipment_keys && Array.isArray(profile.equipment_keys)) {
            const updatedSelectedEquipment = { ...selectedEquipment };
            profile.equipment_keys.forEach((key: string) => {
              if (updatedSelectedEquipment.hasOwnProperty(key)) {
                updatedSelectedEquipment[key] = true;
              }
            });
            setSelectedEquipment(updatedSelectedEquipment);
          }
        }
      } catch (e) {
        console.error("프로필 데이터 불러오기 중 오류 발생:", e)
      }
    }
    
    loadProfileData()
  }, [])

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const { data, error } = await supabase
          .from('equipments')
          .select('*')
        
        if (error) {
          console.error("운동기구 목록 불러오기 실패:", error.message)
          return
        }
        
        if (data && data.length > 0) {
          // 운동기구 목록 업데이트
          // 여기서는 기존 equipmentItems를 사용하고 있지만,
          // 실제로는 Supabase에서 불러온 데이터로 대체할 수 있습니다.
          // setEquipmentList(data)
        }
      } catch (e) {
        console.error("운동기구 목록 불러오기 중 오류 발생:", e)
      }
    }
    
    fetchEquipments()
  }, [])

  const handleProfileSelect = (profileId: number) => {
    const profile = profiles.find(p => p.id === profileId)
    if (profile) {
      setDogInfo({
        name: profile.name,
        age: profile.age / 12, // Convert months to years
        breed: profile.breed,
        weight: profile.weight,
        activityLevel: "medium",
        healthIssues: [],
        gender: profile.sex,
      })
      setSelectedProfileId(profileId)
    }
  }

  const handleSaveProfile = async () => {
    // Prevent duplicate saves
    if (isSaved || isSaving) return
    
    setIsSaving(true)
    
    const profileData = {
      name: dogInfo.name,
      sex: dogInfo.gender,
      age: Math.round(dogInfo.age * 12), // Convert to months
      weight: dogInfo.weight,
      breed: dogInfo.breed,
      health_values: healthValues, // 건강 정보도 함께 저장
      performance_values: performanceValues, // 운동 능력 정보도 함께 저장
      preferences: {
        selected: Object.keys(selectedActivities).filter(activity => selectedActivities[activity]),
        intensity: intensities
      },
      equipment: Object.keys(selectedEquipment).filter(key => selectedEquipment[key])
    }

    try {
      const { data, error } = await upsertDogProfile(profileData)

      if (error) {
        console.error("프로필 저장 실패:", error.message)
        toast({
          title: "❌ 프로필 저장 실패",
          description: "다시 시도해주세요.",
          variant: "destructive",
        })
      } else {
        console.log("프로필 저장 성공:", data)
        toast({
          title: "✅ 프로필이 저장되었습니다!",
          description: "반려견 정보가 성공적으로 저장되었습니다.",
          variant: "default",
        })
        setIsSaved(true)
      }
    } catch (e) {
      console.error("프로필 저장 중 오류 발생:", e)
      toast({
        title: "❌ 오류 발생",
        description: "프로필 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async () => {
    // 각 단계별 유효성 검사만 수행하고, 저장은 하지 않음
    if (step === 1) {
      // 기본 정보 유효성 검사
      if (!dogInfo.name) {
        toast({
          title: "❌ 이름을 입력해주세요",
          description: "반려견 이름은 필수 입력 항목입니다.",
          variant: "destructive",
        })
        return
      }
      
      if (!dogInfo.gender) {
        toast({
          title: "❌ 성별을 선택해주세요",
          description: "반려견 성별은 필수 선택 항목입니다.",
          variant: "destructive",
        })
        return
      }
      
      if (!dogInfo.breed) {
        toast({
          title: "❌ 견종을 선택해주세요",
          description: "반려견 견종은 필수 선택 항목입니다.",
          variant: "destructive",
        })
        return
      }
    }
    
    // 다음 단계로 이동
    if (step < 5) {
      setStep(step + 1)
    } else {
      // Step 5에서는 전체 데이터를 저장하고 결과 페이지로 이동
      await saveFullProfile()
    }
  }

  // 전체 프로필 저장 함수
  const saveFullProfile = async () => {
    setIsLoading(true)
    
    try {
      // 선택된 활동 목록 생성
      const selectedActivitiesList = Object.keys(selectedActivities).filter(
        activity => selectedActivities[activity]
      )
      
      // 선택된 운동기구 목록 생성
      const selectedEquipmentList = Object.keys(selectedEquipment).filter(
        key => selectedEquipment[key]
      )
      
      // 최종 프로필 데이터 구성
      const profileData = {
        name: dogInfo.name,
        sex: dogInfo.gender,
        age: Math.round(dogInfo.age * 12), // 년 단위를 월 단위로 변환
        weight: dogInfo.weight,
        breed: dogInfo.breed,
        health_values: healthValues,
        performance_values: performanceValues,
        preferences: {
          selected: selectedActivitiesList,
          intensity: intensities
        },
        equipment_keys: selectedEquipmentList
      }
      
      // Supabase에 저장
      const { data, error } = await upsertDogProfile(profileData)
      
      if (error) {
        console.error("프로필 저장 실패:", error.message)
        toast({
          title: "❌ 프로필 저장 실패",
          description: "다시 시도해주세요.",
          variant: "destructive",
        })
        setIsLoading(false)
        return false
      }
      
      // 로컬 스토리지에도 저장
      setLocalStorageItem("dogfit-dog-info", { 
        ...dogInfo, 
        healthValues, 
        performance: performanceValues, 
        preferences: { 
          selected: selectedActivitiesList, 
          intensity: intensities 
        },
        equipment: selectedEquipmentList
      })
      
      toast({
        title: "✅ 프로필이 저장되었습니다!",
        description: "반려견 정보가 성공적으로 저장되었습니다.",
        variant: "default",
      })
      
      // 결과 페이지로 이동
      router.push("/result")
      return true
    } catch (e) {
      console.error("프로필 저장 중 오류 발생:", e)
      toast({
        title: "❌ 오류 발생",
        description: "프로필 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      setIsLoading(false)
      return false
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = () => {
    saveFullProfile()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'breed') return;

    let processedValue: string | number = value;

    if (name === "age") {
      processedValue = parseFloat(value);
      if (processedValue < 0) processedValue = 0;
      processedValue = Math.round(processedValue * 10) / 10;
    } else if (name === "weight") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        processedValue = Math.max(0.1, numValue);
      } else if (value === "") {
        return;
      } else {
        return;
      }
    }

    setDogInfo({ ...dogInfo, [name]: processedValue })
  }

  const handleGenderChange = (gender: string) => {
    setDogInfo({ ...dogInfo, gender })
  }

  const handleAgeChange = (increment: number) => {
    setDogInfo(prevInfo => {
      const newAge = Math.max(0.1, Math.round((prevInfo.age + increment) * 10) / 10);
      return { ...prevInfo, age: newAge };
    });
  };

  const handleWeightChange = (increment: number) => {
    setDogInfo(prevInfo => {
      const currentWeightScaled = Math.round(prevInfo.weight * 10);
      const incrementScaled = Math.round(increment * 10);
      const newWeight = (currentWeightScaled + incrementScaled) / 10;
      return { ...prevInfo, weight: Math.max(0.1, newWeight) };
    });
  };

  const handleBreedSelect = (selectedBreedValue: Breed | "") => {
    setDogInfo(prevInfo => ({ ...prevInfo, breed: selectedBreedValue as unknown as Breed }));
  };

  const breedDropdownItems: DropdownItem[] = dogBreedData.map((breed) => ({
    id: breed,
    label: breed,
    onClick: () => handleBreedSelect(breed as unknown as Breed),
  }));

  const handleSliderChange = (category: string, value: number) => {
    setHealthValues((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const handlePerformanceSliderChange = (category: string, value: number) => {
    setPerformanceValues((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) => {
      const updated = {
        ...prev,
        [activity]: !prev[activity],
      }
      updatePreferences(updated, intensities)
      return updated
    })
  }

  const updateIntensity = (activity: string, value: number[]) => {
    setIntensities((prev) => {
      const updated = {
        ...prev,
        [activity]: value[0],
      }
      updatePreferences(selectedActivities, updated)
      return updated
    })
  }

  const updatePreferences = (activities: Record<string, boolean>, intensity: Record<string, number>) => {
    const selected = Object.keys(activities).filter((activity) => activities[activity])
    setDogInfo((prev) => ({
      ...prev,
      preferences: {
        selected,
        intensity,
      },
    }))
  }

  const toggleEquipment = (key: string) => {
    setSelectedEquipment((prev) => {
      const updated = {
        ...prev,
        [key]: !prev[key],
      }
      updateDogFormEquipment(updated)
      return updated
    })
  }

  const updateDogFormEquipment = (equipment: Record<string, boolean>) => {
    const selected = Object.keys(equipment).filter((key) => equipment[key])
    setDogInfo((prev) => ({
      ...prev,
      equipment: selected,
    }))
  }

  const [showAdvanced, setShowAdvanced] = useState(false)

  const formatAgeDisplay = (age: number) => {
    if (age < 1) {
      return `${Math.round(age * 12)}개월`;
    }
    return `${age.toFixed(1)}세`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>반려견 정보 입력 ({step}/5)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Profile Dropdown */}
            {step === 1 && (
              <Select onValueChange={(value) => handleProfileSelect(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="프로필 선택" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id.toString()}>
                      {profile.name} ({profile.breed})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {step === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="반려견 이름"
                    value={dogInfo.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>성별</Label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => handleGenderChange("male")}
                      className={`flex items-center justify-center w-full p-3 rounded-lg transition-all ${
                        dogInfo.gender === "male"
                          ? "bg-[#FFF0E5] border-2 border-[#FFA94D] text-[#FFA94D]"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <span className="mr-2">♂️</span> 남아
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenderChange("female")}
                      className={`flex items-center justify-center w-full p-3 rounded-lg transition-all ${
                        dogInfo.gender === "female"
                          ? "bg-[#FFF0E5] border-2 border-[#FFA94D] text-[#FFA94D]"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <span className="mr-2">♀️</span> 여아
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">나이</Label>
                  <div className="flex items-center space-x-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleAgeChange(-0.1)}
                      disabled={dogInfo.age <= 0.1}
                    >
                      <Minus className="h-4 w-4" />
                      <span className="sr-only">나이 감소</span>
                    </Button>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      placeholder="예: 1.5세 또는 6개월"
                      value={dogInfo.age.toFixed(1) || ""}
                      onChange={handleInputChange}
                      min="0.1"
                      step="0.1"
                      required
                      className="flex-1 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleAgeChange(0.1)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">나이 증가</span>
                    </Button>
                    <span className="text-muted-foreground">{formatAgeDisplay(dogInfo.age)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">체중</Label>
                  <div className="flex items-center space-x-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleWeightChange(-0.1)}
                      disabled={dogInfo.weight <= 0.1}
                    >
                      <Minus className="h-4 w-4" />
                      <span className="sr-only">체중 감소</span>
                    </Button>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      placeholder="체중"
                      value={dogInfo.weight || ""}
                      onChange={handleInputChange}
                      min="0.1"
                      step="0.1"
                      required
                      className="flex-1 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleWeightChange(0.1)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">체중 증가</span>
                    </Button>
                    <span className="text-muted-foreground">kg</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>견종</Label>
                  <BreedSelector
                    value={dogInfo.breed}
                    onValueChange={handleBreedSelect}
                    placeholder="견종을 선택해주세요..."
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {healthCategories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <Label>{category.title}</Label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={healthValues[category.id]}
                        onChange={(e) => handleSliderChange(category.id, Number(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-rose-500"
                      />
                      <span className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-sm font-medium text-rose-700">
                        {healthValues[category.id]}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                      <span>건강함</span>
                      <span>심각함</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="mb-6 flex items-center justify-center">
                  <Activity className="mr-2 h-6 w-6 text-blue-500" />
                  <h1 className="text-2xl font-bold text-blue-700">강아지 운동 능력</h1>
                </div>

                <p className="mb-8 text-center text-sm text-blue-600">
                  각 항목을 0(매우 낮음)부터 5(매우 뛰어남)까지 평가해주세요
                </p>

                <div className="space-y-4">
                  {basicPerformanceCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <Label>{category.title}</Label>
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          value={performanceValues[category.id]}
                          onChange={(e) => handlePerformanceSliderChange(category.id, Number(e.target.value))}
                          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-500"
                        />
                        <span className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                          {performanceValues[category.id]}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-gray-400">
                        <span>낮음</span>
                        <span>높음</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-6 mb-4 w-full flex items-center justify-center rounded-xl bg-blue-50 p-3 text-blue-700 shadow-sm transition-all hover:bg-blue-100"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? (
                    <>
                      <ChevronUp className="mr-1 h-5 w-5" />
                      고급 항목 접기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-5 w-5" />
                      고급 항목 펼치기
                    </>
                  )}
                </button>

                {showAdvanced && (
                  <div className="space-y-4 mb-6">
                    {advancedPerformanceCategories.map((category) => (
                      <div key={category.id} className="space-y-2">
                        <Label>{category.title}</Label>
                        <div className="flex items-center">
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="1"
                            value={performanceValues[category.id]}
                            onChange={(e) => handlePerformanceSliderChange(category.id, Number(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-500"
                          />
                          <span className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                            {performanceValues[category.id]}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-gray-400">
                          <span>낮음</span>
                          <span>높음</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="mb-6 flex items-center justify-center">
                  <h1 className="text-2xl font-bold text-orange-700">활동 선호도</h1>
                </div>

                <p className="mb-8 text-center text-sm text-orange-600">
                  아이가 좋아하는 활동을 선택하고 강도를 조절하세요
                </p>

                <div className="space-y-6 mb-8">
                  {Object.keys(selectedActivities).map((activity) => (
                    <div
                      key={activity}
                      className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm hover:shadow-md transition-all"
                    >
                      <button
                        onClick={() => toggleActivity(activity)}
                        className={`w-full rounded-lg flex items-center gap-3 transition-all p-3 ${
                          selectedActivities[activity]
                            ? "bg-orange-50 border-2 border-orange-400"
                            : "bg-white border border-gray-100"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                          {activityIcons[activity as keyof typeof activityIcons]}
                        </div>
                        <span className="font-medium text-lg">{activityNames[activity as keyof typeof activityNames]}</span>
                      </button>

                      {selectedActivities[activity] && (
                        <div className="px-4 py-4 mt-3 bg-orange-50 rounded-lg">
                          <div className="flex justify-between mb-3">
                            <span className="text-sm font-medium text-orange-700">강도</span>
                            <span className="text-sm font-bold text-orange-700">{intensities[activity]}/5</span>
                          </div>
                          <input
                            type="range"
                            value={intensities[activity]}
                            min={0}
                            max={5}
                            step={1}
                            onChange={(e) => updateIntensity(activity, [parseInt(e.target.value)])}
                            className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <div className="mt-2 flex justify-between text-xs text-orange-600">
                            <span>잘함</span>
                            <span>잘 못함</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="mb-6 flex items-center justify-center">
                  <h1 className="text-2xl font-bold text-orange-700">운동기구 선택</h1>
                </div>

                <p className="mb-8 text-center text-sm text-orange-600">
                  사용 중인 운동기구를 선택해주세요
                </p>

                <div className="space-y-4 mb-8">
                  {equipmentItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => toggleEquipment(item.key)}
                      className={`w-full p-4 rounded-lg flex items-start gap-3 transition-all text-left ${
                        selectedEquipment[item.key]
                          ? "bg-orange-100 border-2 border-orange-400"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex-shrink-0 flex items-center justify-center text-orange-500 mt-1">
                        {item.icon}
                      </div>
                      <div>
                        <span className="font-medium block">{item.label}</span>
                        <span className="text-sm text-gray-500">{item.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                이전
              </Button>
            ) : (
              <div></div>
            )}

            {step < 5 ? (
              <Button onClick={handleNext}>다음</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "저장 중..." : "완료"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
      <StampWidget />
    </div>
  )
}
