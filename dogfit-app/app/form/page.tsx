"use client";

export const dynamic = 'force-dynamic';

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PawPrintLoading } from "@/components/ui/paw-print-loading";
import { motion } from "framer-motion";
import type { Breed, DogInfo, DogProfile } from "@/lib/types";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/utils";
import { StampWidget } from "@/components/ui/stamp-widget";
import { dogBreedData } from "@/Data/DogBreedData";
import { Minus, Plus, Activity as ActivityIconLucide, ChevronDown, ChevronUp, PlayIcon as Run, Zap, Mountain, Scale, Hand, Triangle, Circle, Disc, CircleDot, Square, RectangleVerticalIcon as Rectangle, Info } from "lucide-react";
import { BreedSelector } from "@/components/ui/Breed-selector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { healthCategories } from "@/Data/Health";
import { activityIcons, activityNames } from "@/Data/Activity";
import { equipmentItems } from "@/Data/EquipmentItem";
import { basicPerformanceCategories, advancedPerformanceCategories, performanceFieldMapping } from "@/Data/Performance";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getDogProfile } from "@/lib/supabase/getDogProfile";
import { upsertDogProfile } from "@/lib/supabase/upsertDogProfile";
import { supabase } from "@/lib/supabase/supabaseClient";

const stepNames = ["기본 정보", "건강 상태", "운동 능력", "활동 선호도", "운동기구"];

const initialDogInfo: DogInfo = { name: "", age: 0, breed: "", weight: 0.1, activityLevel: "medium", healthIssues: [], gender: "" };
const initialHealthValues: Record<string, number> = healthCategories.reduce((acc, category) => { acc[category.id] = 0; return acc; }, {} as Record<string, number>);
const initialPerformanceValues: Record<string, number> = Object.keys(performanceFieldMapping).reduce((acc, key) => { acc[key] = 0; return acc; }, {} as Record<string, number>);
const initialSelectedActivities: Record<string, boolean> = { running: false, jumping: false, climbing: false, balance: false, holding: false };
const initialIntensities: Record<string, number> = { running: 0, jumping: 0, climbing: 0, balance: 0, holding: 0 };
const initialSelectedEquipment: Record<string, boolean> = equipmentItems.reduce((acc, item) => { acc[item.key] = false; return acc; }, {} as Record<string, boolean>);

interface DogInfoFormContentInternalProps {
  idFromParamsProp: string | null;
  hasPendingDataInitiallyProp: boolean;
}

function DogInfoFormContentInternal({ idFromParamsProp, hasPendingDataInitiallyProp }: DogInfoFormContentInternalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dogInfo, setDogInfo] = useState<DogInfo>(initialDogInfo);
  const [healthValues, setHealthValues] = useState<Record<string, number>>(initialHealthValues);
  const [performanceValues, setPerformanceValues] = useState<Record<string, number>>(initialPerformanceValues);
  const [selectedActivities, setSelectedActivities] = useState<Record<string, boolean>>(initialSelectedActivities);
  const [intensities, setIntensities] = useState<Record<string, number>>(initialIntensities);
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, boolean>>(initialSelectedEquipment);
  const [profiles, setProfiles] = useState<DogProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(idFromParamsProp);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const key = selectedProfileId ? `dogfit-form-temp-${selectedProfileId}` : "dogfit-form-temp-new";
      setLocalStorageItem(key, { dogInfo, healthValues, performanceValues, selectedActivities, intensities, selectedEquipment, step });
    }
  }, [selectedProfileId, dogInfo, healthValues, performanceValues, selectedActivities, intensities, selectedEquipment, step, isLoading]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const loadData = async () => {
      try {
        const { data: fetchedProfiles = [], error: profileError } = await getDogProfile();
        if (profileError) throw profileError;
        setProfiles(fetchedProfiles);

        const currentId = idFromParamsProp;
        const tempKey = currentId ? `dogfit-form-temp-${currentId}` : "dogfit-form-temp-new";
        const temp = getLocalStorageItem(tempKey, null) as any;

        if (currentId) {
          setSelectedProfileId(currentId);
          const profileToLoad = fetchedProfiles.find(p => p.id === currentId);
          if (profileToLoad) {
            setDogInfo(temp?.dogInfo !== undefined ? temp.dogInfo : { name: profileToLoad.name || "", age: profileToLoad.age ? profileToLoad.age / 12 : 0, breed: profileToLoad.breed || "", weight: profileToLoad.weight || 0.1, activityLevel: (profileToLoad as any).activityLevel || "medium", healthIssues: [], gender: profileToLoad.sex || "" });
            setHealthValues(temp?.healthValues !== undefined ? temp.healthValues : profileToLoad.health_values || initialHealthValues);
            setPerformanceValues(temp?.performanceValues !== undefined ? temp.performanceValues : profileToLoad.performance_values || initialPerformanceValues);
            setSelectedActivities(temp?.selectedActivities !== undefined ? temp.selectedActivities : profileToLoad.preferences?.selected?.reduce((acc: Record<string, boolean>, key: string) => { acc[key] = true; return acc; }, { ...initialSelectedActivities }) || initialSelectedActivities);
            setIntensities(temp?.intensities !== undefined ? temp.intensities : profileToLoad.preferences?.intensity || initialIntensities);
            setSelectedEquipment(temp?.selectedEquipment !== undefined ? temp.selectedEquipment : (profileToLoad.equipment_keys || []).reduce((acc: Record<string, boolean>, key: string) => { acc[key] = true; return acc; }, { ...initialSelectedEquipment }));
            setStep(temp?.step !== undefined ? temp.step : 1);
          } else {
            toast({ title: "프로필을 찾을 수 없습니다.", variant: "destructive" });
            router.replace("/form");
          }
        } else {
          setSelectedProfileId(null);
          if (temp) {
            setDogInfo(temp.dogInfo || initialDogInfo);
            setHealthValues(temp.healthValues || initialHealthValues);
            setPerformanceValues(temp.performanceValues || initialPerformanceValues);
            setSelectedActivities(temp.selectedActivities || initialSelectedActivities);
            setIntensities(temp.intensities || initialIntensities);
            setSelectedEquipment(temp.selectedEquipment || initialSelectedEquipment);
            setStep(temp.step || 1);
          } else {
            setDogInfo(initialDogInfo); setHealthValues(initialHealthValues); setPerformanceValues(initialPerformanceValues);
            setSelectedActivities(initialSelectedActivities); setIntensities(initialIntensities); setSelectedEquipment(initialSelectedEquipment); setStep(1);
          }
        }
      } catch (e: any) {
        console.error("Data loading error:", e);
        toast({ title: "데이터 로딩 중 오류", description: e.message, variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [idFromParamsProp, toast, router]);

  useEffect(() => {
    if (isAuthenticated && hasPendingDataInitiallyProp) {
      const pendingData = getLocalStorageItem('dogfit-pending-profile', null) as any;
      if (pendingData) {
        setDogInfo(pendingData.dogInfo || initialDogInfo);
        setHealthValues(pendingData.healthValues || initialHealthValues);
        setPerformanceValues(pendingData.performanceValues || initialPerformanceValues);
        setSelectedActivities(pendingData.selectedActivities || initialSelectedActivities);
        setIntensities(pendingData.intensities || initialIntensities);
        setSelectedEquipment(pendingData.selectedEquipment || initialSelectedEquipment);
        
        localStorage.removeItem('dogfit-pending-profile');
        toast({ title: "✅ 임시 저장된 데이터를 불러왔습니다"});
        
        const currentPathWithoutPending = idFromParamsProp ? `/form?id=${idFromParamsProp}` : '/form';
        router.replace(currentPathWithoutPending, undefined);

        if (pendingData.step === 5) {
          setStep(5);
          setTimeout(() => saveFullProfile(true), 500);
        } else {
          setStep(pendingData.step || 1);
        }
      }
    }
  }, [isAuthenticated, hasPendingDataInitiallyProp, router, toast, idFromParamsProp]);

  const handleProfileSelect = (profileIdValue: string) => {
    const oldKey = selectedProfileId ? `dogfit-form-temp-${selectedProfileId}` : "dogfit-form-temp-new";
    if(!isLoading) {
        setLocalStorageItem(oldKey, { dogInfo, healthValues, performanceValues, selectedActivities, intensities, selectedEquipment, step });
    }
    router.replace(profileIdValue === "__new__" ? "/form" : `/form?id=${profileIdValue}`);
  };

  const saveFullProfile = async (isFromPendingData = false) => {
    const tempKey = selectedProfileId ? `dogfit-form-temp-${selectedProfileId}` : "dogfit-form-temp-new";
    if (!isFromPendingData && !isLoading) {
        localStorage.removeItem(tempKey);
    }

    if (!isAuthenticated) {
      const pendingData = { step: 5, dogInfo, healthValues, performanceValues, selectedActivities, intensities, selectedEquipment };
      setLocalStorageItem('dogfit-pending-profile', pendingData);
      toast({ title: "⚠️ 로그인이 필요합니다", description: "데이터가 임시 저장되었습니다." });
      const formIdQuery = selectedProfileId ? `id=${selectedProfileId}&` : '';
      router.push(`/login?redirect=/form&${formIdQuery}pending_data=true`);
      return;
    }
    setIsSaving(true); setIsLoading(true);
    try {
      const profileDataToSave: any = {
        name: dogInfo.name, sex: dogInfo.gender, age: Math.round(dogInfo.age * 12),
        weight: dogInfo.weight, breed: dogInfo.breed, health_values: healthValues,
        performance_values: performanceValues,
        preferences: { selected: Object.keys(selectedActivities).filter(act => selectedActivities[act]), intensity: intensities },
        equipment_keys: Object.keys(selectedEquipment).filter(eq => selectedEquipment[eq])
      };
      if (selectedProfileId) profileDataToSave.id = selectedProfileId;
      
      const { data: savedProfile, error } = await upsertDogProfile(profileDataToSave);
      if (error) throw error;
      
      if (!isLoading) localStorage.removeItem(tempKey);
      toast({ title: "✅ 프로필이 저장되었습니다!" });
      router.push("/profile");
    } catch (e: any) {
      toast({ title: "❌ 프로필 저장 실패", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false); setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && (!dogInfo.name || !dogInfo.gender || !dogInfo.breed)) {
      toast({ title: "❌ 필수 정보를 입력해주세요.", variant: "destructive" }); return;
    }
    if (step < 5) setStep(s => s + 1); else await saveFullProfile();
  };
  const handleBack = () => setStep(s => s - 1);
  const handleSubmit = () => saveFullProfile();
  const handleStepClick = (targetStep: number) => {
      if (!isLoading) setStep(targetStep);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number = value;
    if (name === "age") { processedValue = Math.max(0.1, Math.round(parseFloat(value) * 10) / 10) || 0.1; }
    else if (name === "weight") { processedValue = Math.max(0.1, parseFloat(value) || 0.1); }
    setDogInfo(prev => ({ ...prev, [name]: processedValue }));
  };
  const handleGenderChange = (gender: string) => setDogInfo(prev => ({ ...prev, gender }));
  const handleAgeChange = (increment: number) => setDogInfo(prev => ({ ...prev, age: Math.max(0.1, Math.round((prev.age + increment) * 10) / 10) }));
  const handleWeightChange = (increment: number) => setDogInfo(prev => ({ ...prev, weight: Math.max(0.1, Math.round((prev.weight + increment) * 10) / 10) }));
  const handleBreedSelect = (selectedBreedValue: Breed | "") => setDogInfo(prev => ({ ...prev, breed: selectedBreedValue as string }));

  const handleSliderChange = (category: string, value: number) => setHealthValues(prev => ({ ...prev, [category]: value }));
  const handlePerformanceSliderChange = (category: string, value: number) => setPerformanceValues(prev => ({ ...prev, [category]: value }));

  const toggleActivity = (activity: string) => setSelectedActivities(prev => ({ ...prev, [activity]: !prev[activity] }));
  const updateIntensity = (activity: string, value: number[]) => setIntensities(prev => ({ ...prev, [activity]: value[0] }));
  const toggleEquipment = (key: string) => setSelectedEquipment(prev => ({ ...prev, [key]: !prev[key] }));
  const formatAgeDisplay = (age: number) => age < 1 ? `${Math.round(age * 12)}개월` : `${age.toFixed(1)}세`;

  if (isLoading && profiles.length === 0 && !idFromParamsProp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <PawPrintLoading /> <p className="mt-4">데이터를 준비 중입니다...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-md">
          <Card>
            <CardHeader><CardTitle>반려견 정보 입력 ({step}/5)</CardTitle></CardHeader>
            <div className="flex justify-center gap-2 mb-4 px-6 flex-wrap">
              {stepNames.map((name, index) => (
                <Button key={index} variant={step === index + 1 ? "default" : "outline"} onClick={() => handleStepClick(index + 1)} size="sm" disabled={isLoading}>{name}</Button>
              ))}
            </div>
            <CardContent>
              {(isLoading && (idFromParamsProp || profiles.length > 0)) && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50"><PawPrintLoading /></div>}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <Select onValueChange={handleProfileSelect} value={selectedProfileId || "__new__"} disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="프로필 선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__new__">+ 새 프로필 추가</SelectItem>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.breed})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="space-y-2"><Label htmlFor="name">이름</Label><Input id="name" name="name" value={dogInfo.name} onChange={handleInputChange} required /></div>
                  <div className="space-y-2"><Label>성별</Label><div className="flex space-x-4">{[ "male", "female" ].map(g => (<button key={g} type="button" onClick={() => handleGenderChange(g)} className={`flex items-center justify-center w-full p-3 rounded-lg transition-all ${dogInfo.gender === g ? "bg-[#FFF0E5] border-2 border-[#FFA94D] text-[#FFA94D]" : "bg-white border border-gray-200"}`}><span className="mr-2">{g === "male" ? "♂️" : "♀️"}</span>{g === "male" ? "남아" : "여아"}</button>))}</div></div>
                  <div><Label htmlFor="age" className="text-sm font-medium text-gray-700 flex items-center">나이 (세)<Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="ml-1 h-6 w-6 p-0"><Info className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>※ 예: 1.1 = 1세 1개월</p></TooltipContent></Tooltip></Label><div className="flex items-center gap-2 mt-1"><Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => handleAgeChange(-0.1)} disabled={dogInfo.age <= 0.1}><Minus className="h-4 w-4" /></Button><Input id="age" name="age" type="number" value={dogInfo.age.toFixed(1)} onChange={handleInputChange} className="w-full text-center appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" step="0.1" min="0.1" /><Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => handleAgeChange(0.1)}><Plus className="h-4 w-4" /></Button><span className="text-muted-foreground">{formatAgeDisplay(dogInfo.age)}</span></div></div>
                  <div className="space-y-2"><Label htmlFor="weight">체중</Label><div className="flex items-center space-x-1.5"><Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => handleWeightChange(-0.1)} disabled={dogInfo.weight <= 0.1}><Minus className="h-4 w-4" /></Button><Input id="weight" name="weight" type="number" placeholder="체중" value={dogInfo.weight.toFixed(1)} onChange={handleInputChange} min="0.1" step="0.1" required className="flex-1 text-center" /><Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => handleWeightChange(0.1)}><Plus className="h-4 w-4" /></Button><span className="text-muted-foreground">kg</span></div></div>
                  <div className="space-y-2"><Label>견종</Label><BreedSelector value={dogInfo.breed} onValueChange={handleBreedSelect} placeholder="견종을 선택해주세요..." /></div>
                </motion.div>
              )}
              {step === 2 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">{healthCategories.map(cat => (<div key={cat.id} className="space-y-2"><Label>{cat.title}</Label><div className="flex items-center"><input type="range" min="0" max="5" step="1" value={healthValues[cat.id] || 0} onChange={(e) => handleSliderChange(cat.id, Number(e.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-rose-500" /><span className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-sm font-medium text-rose-700">{healthValues[cat.id] || 0}</span></div><div className="mt-1 flex justify-between text-xs text-gray-400"><span>건강함</span><span>심각함</span></div></div>))}</motion.div>)}
              {step === 3 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4"><div className="mb-6 flex items-center justify-center"><ActivityIconLucide className="mr-2 h-6 w-6 text-blue-500" /><h1 className="text-2xl font-bold text-blue-700">강아지 운동 능력</h1></div><p className="mb-8 text-center text-sm text-blue-600">각 항목을 0(매우 낮음)부터 5(매우 뛰어남)까지 평가해주세요</p><div className="space-y-4">{basicPerformanceCategories.map(cat => (<div key={cat.id} className="space-y-2"><Label>{cat.title}</Label><div className="flex items-center"><input type="range" min="0" max="5" step="1" value={performanceValues[cat.id] || 0} onChange={(e) => handlePerformanceSliderChange(cat.id, Number(e.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-500" /><span className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">{performanceValues[cat.id] || 0}</span></div><div className="mt-1 flex justify-between text-xs text-gray-400"><span>낮음</span><span>높음</span></div></div>))}</div><button type="button" className="mt-6 mb-4 w-full flex items-center justify-center rounded-xl bg-blue-50 p-3 text-blue-700 shadow-sm transition-all hover:bg-blue-100" onClick={() => setShowAdvanced(!showAdvanced)}>{showAdvanced ? <><ChevronUp className="mr-1 h-5 w-5" />고급 항목 접기</> : <><ChevronDown className="mr-1 h-5 w-5" />고급 항목 펼치기</>}</button>{showAdvanced && (<div className="space-y-4 mb-6">{advancedPerformanceCategories.map(cat => (<div key={cat.id} className="space-y-2"><Label>{cat.title}</Label><div className="flex items-center"><input type="range" min="0" max="5" step="1" value={performanceValues[cat.id] || 0} onChange={(e) => handlePerformanceSliderChange(cat.id, Number(e.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-500" /><span className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">{performanceValues[cat.id] || 0}</span></div><div className="mt-1 flex justify-between text-xs text-gray-400"><span>낮음</span><span>높음</span></div></div>))}</div>)}</motion.div>)}
              {step === 4 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4"><div className="mb-6 flex items-center justify-center"><h1 className="text-2xl font-bold text-orange-700">활동 선호도</h1></div><p className="mb-8 text-center text-sm text-orange-600">아이가 좋아하는 활동을 선택하고 강도를 조절하세요</p><div className="space-y-6 mb-8">{Object.keys(selectedActivities).map(act => (<div key={act} className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm hover:shadow-md transition-all"><button onClick={() => toggleActivity(act)} className={`w-full rounded-lg flex items-center gap-3 transition-all p-3 ${selectedActivities[act] ? "bg-orange-50 border-2 border-orange-400" : "bg-white border border-gray-100"}`}><div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">{activityIcons[act as keyof typeof activityIcons]}</div><span className="font-medium text-lg">{activityNames[act as keyof typeof activityNames]}</span></button>{selectedActivities[act] && (<div className="px-4 py-4 mt-3 bg-orange-50 rounded-lg"><div className="flex justify-between mb-3"><span className="text-sm font-medium text-orange-700">강도</span><span className="text-sm font-bold text-orange-700">{intensities[act] || 0}/5</span></div><input type="range" value={intensities[act] || 0} min={0} max={5} step={1} onChange={(e) => updateIntensity(act, [parseInt(e.target.value)])} className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500" /><div className="mt-2 flex justify-between text-xs text-orange-600"><span>약함</span><span>강함</span></div></div>)}</div>))}</div></motion.div>)}
              {step === 5 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4"><div className="mb-6 flex items-center justify-center"><h1 className="text-2xl font-bold text-orange-700">운동기구 선택</h1></div><p className="mb-8 text-center text-sm text-orange-600">사용 중인 운동기구를 선택해주세요</p><div className="space-y-4 mb-8">{equipmentItems.map(item => (<button key={item.key} onClick={() => toggleEquipment(item.key)} className={`w-full p-4 rounded-lg flex items-start gap-3 transition-all text-left ${selectedEquipment[item.key] ? "bg-orange-100 border-2 border-orange-400" : "bg-white border border-gray-200"}`}><div className="w-10 h-10 rounded-full bg-orange-50 flex-shrink-0 flex items-center justify-center text-orange-500 mt-1">{item.icon}</div><div><span className="font-medium block">{item.label}</span><span className="text-sm text-gray-500">{item.description}</span></div></button>))}</div></motion.div>)}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              {step > 1 ? (<Button variant="outline" onClick={handleBack} disabled={isLoading || isSaving}>이전</Button>) : (<div />)}
              {step < 5 ? (<Button onClick={handleNext} disabled={isLoading || isSaving}>다음</Button>) : (<Button onClick={handleSubmit} disabled={isLoading || isSaving}>{isSaving ? "저장 중..." : "완료"}</Button>)}
            </CardFooter>
          </Card>
        </motion.div>
        <StampWidget />
      </div>
    </TooltipProvider>
  );
}

export default function DogInfoFormPage() {
  const searchParams = useSearchParams();
  const idFromParams = searchParams.get("id");
  const hasPendingDataInitially = searchParams.get('pending_data') === 'true';

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <PawPrintLoading />
        <p className="mt-4">폼을 불러오는 중...</p>
      </div>
    }>
      <DogInfoFormContentInternal
        idFromParamsProp={idFromParams}
        hasPendingDataInitiallyProp={hasPendingDataInitially}
      />
    </Suspense>
  );
}
