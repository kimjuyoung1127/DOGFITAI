"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PawPrintLoading } from "@/components/ui/paw-print-loading"
import { motion } from "framer-motion"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/utils"
import { StampWidget } from "@/components/ui/stamp-widget"
import Link from "next/link"
import { ArrowLeft, Clock, Trash2, Filter, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CustomDropdown, DropdownItem } from "@/components/ui/dropdown"
import type { DogProfile } from "@/lib/types"

// 히스토리 항목 타입 정의
interface HistoryItem {
  id: string
  name: string
  date: string
  duration: number
  isCustom: boolean
  difficulty: "easy" | "medium" | "hard"
  dogName: string
  equipmentUsed: string[]
  benefits: string[]
}

// 필터 타입 정의
type DateFilter = "all" | "today" | "week" | "month"
type DifficultyFilter = "all" | "easy" | "medium" | "hard"
type CustomFilter = "all" | "custom"

export default function HistoryPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<DogProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<DogProfile | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const { toast } = useToast()
  
  // 필터 상태
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")
  const [customFilter, setCustomFilter] = useState<CustomFilter>("all")

  useEffect(() => {
    loadHistoryData()
  }, [])
  
  // 필터 변경 시 히스토리 필터링
  useEffect(() => {
    filterHistory()
  }, [dateFilter, difficultyFilter, customFilter, history])

  const loadHistoryData = () => {
    const profileId = getLocalStorageItem("dogfit-selected-profile-id", null);
    console.log("[히스토리] 선택된 프로필 ID:", profileId);
    if (!profileId) {
      console.log("[히스토리] 프로필 ID가 없습니다. 기록을 불러오지 않습니다.");
      return;
    }
    
    // 프로필 ID 기반으로 히스토리 키 생성
    const historyKey = `dogfit-history-${profileId}`;
    const historyData = getLocalStorageItem<HistoryItem[]>(historyKey, []);
    console.log("[히스토리] localStorage에서 불러온 히스토리 데이터:", historyData);

    const sortedHistory = [...historyData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    console.log("[히스토리] 정렬된 히스토리 데이터:", sortedHistory);
    
    setHistory(sortedHistory);
    setFilteredHistory(sortedHistory);
    setLoading(false);
  };
  
  // 히스토리 필터링 함수
  const filterHistory = () => {
    let filtered = [...history]
    console.log("[히스토리] 필터 전 전체 데이터:", filtered);

    // 날짜 필터 적용
    if (dateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date)
        
        if (dateFilter === "today") {
          return itemDate >= today
        } else if (dateFilter === "week") {
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          return itemDate >= weekAgo
        } else if (dateFilter === "month") {
          const monthAgo = new Date(now)
          monthAgo.setDate(now.getDate() - 30)
          return itemDate >= monthAgo
        }
        return true
      })
      console.log(`[히스토리] 날짜 필터(${dateFilter}) 적용 후:`, filtered);
    }
    
    // 난이도 필터 적용
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(item => item.difficulty === difficultyFilter)
      console.log(`[히스토리] 난이도 필터(${difficultyFilter}) 적용 후:`, filtered);
    }
    
    // 커스텀 필터 적용
    if (customFilter === "custom") {
      filtered = filtered.filter(item => item.isCustom)
      console.log("[히스토리] 커스텀 운동만 필터 적용 후:", filtered);
    }
    
    setFilteredHistory(filtered)
    console.log("[히스토리] 최종 필터링 결과:", filtered);
  }

  // 날짜 포맷팅 함수 (YYYY-MM-DD 형식, 한국 시간)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)) // KST = UTC+9
    return kstDate.toISOString().split('T')[0]
  }

  // 난이도에 따른 배지 스타일 결정
  const getDifficultyBadge = (difficulty: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy":
        return <Badge variant="outline">쉬움</Badge>
      case "medium":
        return <Badge variant="secondary">중간</Badge>
      case "hard":
        return <Badge>어려움</Badge>
      default:
        return <Badge variant="outline">쉬움</Badge>
    }
  }

  // 운동 기록 초기화 함수
  const clearHistory = () => {
    const profileId = getLocalStorageItem("dogfit-selected-profile-id", null);
    if (!profileId) return;
    const historyKey = `dogfit-history-${profileId}`;
    setLocalStorageItem(historyKey, []);
    
    // UI 업데이트
    setHistory([]);
    setFilteredHistory([]);
    
    // 다이얼로그 닫기
    setIsDialogOpen(false);
    
    // 토스트 메시지 표시
    toast({
      title: "운동 기록이 초기화되었습니다!",
      description: "모든 운동 기록이 삭제되었습니다.",
      variant: "default",
    });
  }
  
  // 개별 운동 기록 삭제 함수
  const deleteHistoryItem = (item: HistoryItem) => {
    const profileId = getLocalStorageItem("dogfit-selected-profile-id", null);
    if (!profileId) return;
    const historyKey = `dogfit-history-${profileId}`;
    // 현재 히스토리 데이터 가져오기
    const currentHistory = getLocalStorageItem<HistoryItem[]>(historyKey, []);
    
    // 선택한 항목 제외한 새 배열 생성
    const updatedHistory = currentHistory.filter(
      historyItem => !(historyItem.id === item.id && historyItem.date === item.date)
    );
    
    // localStorage 업데이트
    setLocalStorageItem(historyKey, updatedHistory);
    
    // UI 업데이트
    setHistory(updatedHistory.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
    
    // 다이얼로그 닫기
    setIsItemDialogOpen(false);
    setSelectedItem(null);
    
    // 토스트 메시지 표시
    toast({
      title: "운동 기록이 삭제되었습니다",
      description: `"${item.name}" 운동 기록이 삭제되었습니다.`,
      variant: "default",
    });
  }
  
  // 삭제 다이얼로그 열기
  const openDeleteDialog = (e: React.MouseEvent, item: HistoryItem) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedItem(item)
    setIsItemDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: "#FFF6EE" }}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-xl font-bold mb-6">운동 기록을 불러오고 있어요</h2>
            <PawPrintLoading />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex flex-col items-center min-h-screen p-4" style={{ backgroundColor: "#FFF6EE" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-center flex-1 mr-9">나의 운동기록</h1>
        </div>
        <div className="mb-4">
          <Link href="/profile">
            <Button
              className="w-full bg-orange-400 hover:bg-orange-500 text-white flex items-center justify-center py-4 rounded-lg shadow-sm"
            >
              <ArrowLeft className="mr-2" size={18} />
              <span className="font-medium">프로필로 돌아가기</span>
            </Button>
          </Link>
        </div>
        
        {history.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <h3 className="text-sm font-medium">필터</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="날짜" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 기간</SelectItem>
                    <SelectItem value="today">오늘</SelectItem>
                    <SelectItem value="week">이번 주</SelectItem>
                    <SelectItem value="month">이번 달</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as DifficultyFilter)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="난이도" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 난이도</SelectItem>
                    <SelectItem value="easy">쉬움</SelectItem>
                    <SelectItem value="medium">중간</SelectItem>
                    <SelectItem value="hard">어려움</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={customFilter} onValueChange={(value) => setCustomFilter(value as CustomFilter)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="커스텀" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 운동</SelectItem>
                    <SelectItem value="custom">커스텀 운동만</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full">
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <h2 className="text-xl font-bold mb-6">아직 완료한 운동이 없어요!</h2>
                <Link href="/result">
                  <Button>추천 운동으로 돌아가기</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : filteredHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full">
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
                <h2 className="text-xl font-bold mb-6">해당 조건의 운동기록이 없어요!</h2>
                <Button onClick={() => {
                  setDateFilter("all");
                  setDifficultyFilter("all");
                  setCustomFilter("all");
                }}>
                  필터 초기화하기
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={`${item.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={`/exercise/${item.id}?from=history`}>
                    <Card className="w-full cursor-pointer hover:shadow-md transition-shadow relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7 bg-transparent text-muted-foreground hover:bg-gray-100 z-10"
                        onClick={(e) => openDeleteDialog(e, item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-bold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{formatDate(item.date)}</p>
                          </div>
                          <div className="flex items-center mr-8">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{item.duration}분</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {getDifficultyBadge(item.difficulty)}
                          {item.isCustom && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">커스텀 운동</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 w-full">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    운동 기록 초기화
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>운동 기록 초기화</DialogTitle>
                    <DialogDescription>
                      정말 모든 운동 기록을 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      취소
                    </Button>
                    <Button variant="destructive" onClick={clearHistory}>
                      삭제하기
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </div>
      
      {/* 개별 항목 삭제 다이얼로그 */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>운동 기록 삭제</DialogTitle>
            <DialogDescription>
              이 운동 기록을 삭제하시겠어요?
              {selectedItem && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{selectedItem.name}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedItem.date)}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedItem && deleteHistoryItem(selectedItem)}
            >
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <StampWidget />
    </div>
  )
}
