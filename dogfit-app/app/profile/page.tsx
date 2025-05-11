"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "@supabase/supabase-js"
import Link from "next/link"
import Image from "next/image"
import { LogOut, PawPrint, Plus } from "lucide-react"

import type { DogProfile, DogProfileData } from "@/lib/types"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/utils"
import { upsertDogProfile } from "@/lib/supabase/upsertDogProfile"

// 개발 테스트 모드 설정 (true로 설정하면 테스트 버튼이 표시됨)

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasPendingData = searchParams.get('pending_data') === 'true'
  
  const [profiles, setProfiles] = useState<DogProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<DogProfile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // API 테스트용 상태 추가

  useEffect(() => {
    // 이미 처리 중인지 추적하는 플래그
    let isProcessing = false;
    
    // Check if user is authenticated and handle pending data
    const init = async () => {
      if (isProcessing) return; // 이미 처리 중이면 중복 실행 방지
      isProcessing = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }
        
        setUser(session.user)
        
        // Handle pending data if exists
        if (hasPendingData) {
          console.log("🔄 URL에서 pending_data=true 감지, 임시 데이터 처리 시작")
          await handlePendingData(session.user.id)
          
          // 쿼리 파라미터 제거 (중요: 페이지 새로고침 시 중복 처리 방지)
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('pending_data');
          window.history.replaceState({}, '', newUrl.toString());
          console.log("🧹 URL에서 pending_data 파라미터 제거")
        }
        
        // Fetch profiles
        await fetchProfiles()
        
        setLoading(false)
      } catch (e) {
        console.error("초기화 중 오류 발생:", e)
        setLoading(false)
      } finally {
        isProcessing = false;
      }
    }
    
    init()
  }, [router, hasPendingData]) // router와 hasPendingData 의존성 추가

  // Function to handle pending data
  const handlePendingData = async (userId: string) => {
    console.log("🔍 임시 저장된 데이터 확인 중...")
    
    // 이미 처리 완료 여부 확인
    const processedFlag = getLocalStorageItem('dogfit-pending-processed', false)
    if (processedFlag) {
      console.log("⚠️ 이미 처리된 임시 데이터입니다. 중복 처리 방지")
      localStorage.removeItem('dogfit-pending-profile') // 안전하게 제거
      setIsSaving(false)
      return
    }
    
    try {
      setIsSaving(true)
      
      // 처리 중임을 표시
      setLocalStorageItem('dogfit-pending-processed', true)
      
      // Get pending data from localStorage
      const pendingData = getLocalStorageItem('dogfit-pending-profile', null) as {
        dogInfo?: any;
        healthValues?: any;
        performanceValues?: any;
        selectedActivities?: Record<string, boolean>;
        intensities?: Record<string, any>;
        selectedEquipment?: Record<string, boolean>;
      } | null;
      
      if (!pendingData) {
        console.log("⚠️ 임시 저장된 데이터가 없습니다")
        setIsSaving(false)
        return
      }
      
      console.log("✅ 임시 데이터 발견:", pendingData)
      
      // Extract data from pending data
      const {
        dogInfo,
        healthValues,
        performanceValues,
        selectedActivities,
        intensities,
        selectedEquipment
      } = pendingData
      
      if (!dogInfo) {
        console.log("⚠️ 필수 데이터(dogInfo)가 없습니다")
        setIsSaving(false)
        return
      }
      
      // Prepare profile data for Supabase
      const selectedActivitiesList = selectedActivities ? 
        Object.keys(selectedActivities).filter(key => selectedActivities[key]) : []
      
      const selectedEquipmentList = selectedEquipment ? 
        Object.keys(selectedEquipment).filter(key => selectedEquipment[key]) : []
      
      const profileData: {
        id?: number;
        name: string;
        sex: string;
        age: number;
        weight: number;
        breed: string;
        health_values: any;
        performance_values: any;
        preferences: {
          selected: string[];
          intensity: Record<string, any> | undefined;
        };
        equipment_keys: string[];
        user_id: string;
      } = {
        name: dogInfo?.name || '',
        sex: dogInfo?.gender || '',
        age: dogInfo?.age ? Math.round(dogInfo.age * 12) : 0,
        weight: dogInfo?.weight || 0,
        breed: dogInfo?.breed || '',
        health_values: healthValues,
        performance_values: performanceValues,
        preferences: {
          selected: selectedActivitiesList,
          intensity: intensities
        },
        equipment_keys: selectedEquipmentList,
        user_id: userId
      }
      
      console.log("📤 Supabase에 저장할 데이터:", profileData)
      
      // Check for existing profiles to avoid duplicates
      const { data: existingProfiles, error: fetchError } = await supabase
        .from('dog_profile')
        .select('id, name')
        .eq('user_id', userId)
        .eq('name', profileData.name)
      
      if (fetchError) {
        console.error("❌ 기존 프로필 확인 실패:", fetchError)
        toast({
          title: "❌ 프로필 확인 실패",
          description: "기존 프로필을 확인하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }
      
      // If profile with same name exists, update it instead of creating new one
      if (existingProfiles && existingProfiles.length > 0) {
        console.log("🔄 동일한 이름의 프로필이 존재합니다. 업데이트를 진행합니다:", existingProfiles[0])
        profileData.id = existingProfiles[0].id
      }
      
      // Save to Supabase
      const { data, error } = await upsertDogProfile(profileData as any)
      
      if (error) {
        console.error("❌ 임시 데이터 저장 실패:", error)
        toast({
          title: "❌ 프로필 저장 실패",
          description: "임시 저장된 데이터를 저장하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }
      
      console.log("✅ Supabase 저장 성공:", data)
      
      // Only remove from localStorage after successful save
      localStorage.removeItem('dogfit-pending-profile')
      localStorage.removeItem('dogfit-pending-processed') // 처리 완료 후 플래그도 제거
      console.log("✅ localStorage에서 임시 데이터 및 처리 플래그 삭제 완료")
      
      // Save to localStorage for result page (but don't render it)
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
        title: "✅ 프로필 저장 완료",
        description: "임시 저장된 데이터가 성공적으로 저장되었습니다.",
        variant: "default",
      })
      
      // Refresh profiles to show the newly saved profile
      // But use a flag to prevent duplicate rendering
      await fetchProfiles(true) // true indicates this is after a save
      
    } catch (e) {
      // 오류 발생 시 처리 플래그 제거하여 재시도 가능하게 함
      localStorage.removeItem('dogfit-pending-processed')
      console.error("❌ 임시 데이터 처리 중 오류 발생:", e)
      toast({
        title: "❌ 오류 발생",
        description: "임시 데이터를 처리하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Modified fetchProfiles function to handle post-save scenarios
  const fetchProfiles = async (isAfterSave = false) => {
    setIsLoading(true)
    try {
      console.log("🔍 Supabase에서 프로필 목록 불러오는 중...")
      
      // 현재 세션에서 사용자 ID 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session || !session.user) {
        console.error("❌ 사용자 정보가 없습니다")
        setIsLoading(false)
        return
      }
      
      const userId = session.user.id
      
      // 현재 로그인한 사용자의 프로필만 가져오기
      const { data, error } = await supabase
        .from('dog_profile')
        .select('*')
        .eq('user_id', userId) // 세션에서 직접 가져온 ID 사용
      
      if (error) {
        console.error("❌ 프로필 불러오기 실패:", error)
        toast({
          title: "프로필 불러오기 실패",
          description: "프로필을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } else {
        console.log("✅ 프로필 불러오기 성공:", data)
        
        // Set profiles from Supabase data
        setProfiles(data || [])
        
        // If this is after a save, we don't need to show any localStorage data
        if (isAfterSave) {
          // We've already saved the data to Supabase, so we can ignore localStorage
          console.log("🔄 저장 후 프로필 목록 갱신 완료")
        }
      }
    } catch (e) {
      console.error("❌ 프로필 불러오기 중 오류 발생:", e)
      toast({
        title: "오류 발생",
        description: "프로필을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle exercise recommendation
  const handleExerciseRecommendation = async (profileId: number) => {
    try {
      // 로딩 상태 설정
      setIsLoading(true);
      
      console.log(`🏋️ 프로필 ID ${profileId}에 대한 운동 추천 요청 시작...`);
      
      // API 호출
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      });
      
      // 응답 처리
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
      }
      
      // 추천 운동 추출
      const recommendations = data.recommendations || [];
      
      console.log(`✅ 추천 운동 ${recommendations.length}개 수신 완료:`, recommendations);
      
      // localStorage에 저장
      setLocalStorageItem("dogfit-recommendations", recommendations);
      console.log("✅ 추천 운동 저장됨", recommendations);
      
      // 프로필 ID도 저장 (result 페이지에서 필요할 수 있음)
      setLocalStorageItem("dogfit-selected-profile-id", profileId);
      
      // 성공 토스트 메시지
      toast({
        title: "✅ 운동 추천 완료",
        description: `${recommendations.length}개의 맞춤형 운동이 추천되었습니다.`,
      });
      
      // 잠시 후 결과 페이지로 이동
      setTimeout(() => {
        router.push("/result");
      }, 1000);
      
    } catch (error) {
      console.error('❌ 운동 추천 요청 실패:', error);
      toast({
        title: "❌ 운동 추천 실패",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    try {
      const { error } = await supabase
        .from('dog_profile')
        .delete()
        .eq('id', profileId)

      if (error) {
        console.error("프로필 삭제 실패:", error)
        toast({
          title: "프로필 삭제 실패",
          description: "프로필을 삭제하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } else {
        setProfiles(profiles.filter(profile => profile.id !== profileId))
        toast({
          title: "프로필 삭제 완료",
          description: "프로필이 성공적으로 삭제되었습니다.",
        })
      }
    } catch (e) {
      console.error("프로필 삭제 중 오류 발생:", e)
      toast({
        title: "오류 발생",
        description: "프로필을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDialogOpen(false)
    }
  }

  const handleEditProfile = (profileId: number) => {
    router.push(`/form?profileId=${profileId}`)
  }

  const handleAddProfile = () => {
    router.push('/form')
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (e) {
      console.error("로그아웃 중 오류 발생:", e)
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-10 pb-8 flex flex-col items-center">
            <div className="mb-6">
              <Image 
                src="/dogfit-logo.png" 
                alt="DogFit Logo" 
                width={120} 
                height={120}
                className="rounded-full"
                onError={(e) => {
                  e.currentTarget.src = "/fallback-logo.png"
                  e.currentTarget.onerror = null
                }}
              />
            </div>
            <h2 className="text-2xl font-bold text-orange-800 mb-4">로그인이 필요해요!</h2>
            <p className="text-center text-gray-600 mb-6">
              반려견의 맞춤형 운동 프로그램을 만나보세요.
            </p>
            <Link href="/login">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg">
                로그인하러 가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* 환영 헤더 */}
      <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl p-6 mb-8 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              안녕하세요, {user?.email?.split('@')[0] || '반려인'}님!
            </h1>
            <p className="text-orange-50 mt-1">
              오늘도 반려견과 함께 건강한 하루 보내세요 🐾
            </p>
          </div>
          <Button 
            onClick={handleLogout}
            className="bg-white text-orange-600 hover:bg-orange-50 rounded-full px-5 py-2 font-medium flex items-center"
          >
            <LogOut size={18} className="mr-2" />
            로그아웃
          </Button>
        </div>
      </div>

      {/* 반려견 프로필 섹션 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">나의 반려견</h2>
          <Button 
            onClick={handleAddProfile}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 flex items-center"
          >
            <Plus size={18} className="mr-1" />
            새 프로필 등록
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse flex space-x-2">
              <div className="h-3 w-3 bg-orange-400 rounded-full"></div>
              <div className="h-3 w-3 bg-orange-400 rounded-full"></div>
              <div className="h-3 w-3 bg-orange-400 rounded-full"></div>
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-8 text-center">
            <div className="inline-flex justify-center items-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <PawPrint size={32} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">아직 등록된 반려견이 없어요!</h3>
            <p className="text-gray-600 mb-6">반려견 프로필을 등록하고 맞춤형 운동 프로그램을 만나보세요.</p>
            <Button 
              onClick={handleAddProfile}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
            >
              반려견 등록하기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profiles.map(profile => (
              <Card key={profile.id} className="overflow-hidden border border-orange-100 hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold text-orange-800">
                      {profile.name}
                    </CardTitle>
                    <Badge variant="outline" className="bg-white text-orange-600 border-orange-200">
                      {profile.breed}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">나이</p>
                      <p className="font-medium">{Math.round(profile.age / 12)}세</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">체중</p>
                      <p className="font-medium">{profile.weight}kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">성별</p>
                      <p className="font-medium">{profile.sex === 'male' ? '남아' : '여아'}</p>
                    </div>
                  </div>
                  
                  {/* 운동 추천받기 버튼 - 더 눈에 띄게 강조 */}
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center py-5 mb-4 rounded-lg shadow-sm"
                    onClick={() => handleExerciseRecommendation(profile.id)}
                  >
                    <PawPrint size={20} className="mr-2" />
                    <span className="font-medium">운동 추천받기</span>
                  </Button>
                  
              
                  
                  <div className="flex justify-between items-center mt-2">
                    <Button 
                      variant="outline" 
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      onClick={() => handleEditProfile(profile.id)}
                    >
                      수정
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => { setSelectedProfile(profile); setIsDialogOpen(true); }}
                    >
                      삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {selectedProfile && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">프로필 삭제</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">정말 <span className="font-medium text-orange-600">{selectedProfile.name}</span>의 프로필을 삭제하시겠어요?</p>
              <p className="text-sm text-gray-500 mt-2">삭제된 프로필은 복구할 수 없습니다.</p>
            </div>
            <DialogFooter className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                className="border-gray-200"
                onClick={() => setIsDialogOpen(false)}
              >
                취소
              </Button>
              <Button 
                variant="destructive" 
                className="bg-red-500 hover:bg-red-600"
                onClick={() => handleDeleteProfile(selectedProfile.id)}
              >
                삭제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}