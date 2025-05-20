"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PawPrintLoading } from "@/components/ui/paw-print-loading"
import { motion } from "framer-motion"
import { getLocalStorageItem } from "@/lib/utils"
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
import { supabase } from "@/lib/supabase/supabaseClient"

// exercise_history 테이블 타입 정의
interface ExerciseHistoryItem {
  id: string
  profile_id: string
  exercise_name: string
  date: string
  sets: number
  repetitions: number
  steps: any // jsonb
  feedback: string | null // text or jsonb
  created_at: string
  updated_at: string
  // 확장: 아래 필드는 UI 편의상 추가
  difficulty?: "easy" | "medium" | "hard"
  duration?: number
  equipmentUsed?: string[]
  benefits?: string[]
}

type DateFilter = "all" | "today" | "week" | "month"
type DifficultyFilter = "all" | "easy" | "medium" | "hard"

export default function HistoryPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<DogProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [history, setHistory] = useState<ExerciseHistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<ExerciseHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ExerciseHistoryItem | null>(null)
  const { toast } = useToast()

  // 필터 상태
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")

  // 프로필 및 기록 불러오기
  useEffect(() => {
    const fetchProfileAndHistory = async () => {
      setLoading(true)
      // 프로필 ID는 localStorage에서 선택된 값 사용
      const profileId = getLocalStorageItem("dogfit-selected-profile-id", null)
      setSelectedProfileId(profileId)
      if (!profileId) {
        setLoading(false)
        return
      }
      // Supabase에서 운동 기록 조회
      const { data, error } = await supabase
        .from("exercise_history")
        .select("*")
        .eq("profile_id", profileId)
        .order("date", { ascending: false })
      if (error) {
        setHistory([])
        setFilteredHistory([])
        setLoading(false)
        return
      }
      setHistory(data || [])
      setFilteredHistory(data || [])
      setLoading(false)
    }
    fetchProfileAndHistory()
  }, [])

  // 필터 적용
  useEffect(() => {
    let filtered = [...history]
    // 날짜 필터
    if (dateFilter !== "all") {
      const now = new Date()
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date)
        if (dateFilter === "today") {
          return (
            itemDate.getFullYear() === now.getFullYear() &&
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getDate() === now.getDate()
          )
        }
        if (dateFilter === "week") {
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          return itemDate >= weekAgo && itemDate <= now
        }
        if (dateFilter === "month") {
          return (
            itemDate.getFullYear() === now.getFullYear() &&
            itemDate.getMonth() === now.getMonth()
          )
        }
        return true
      })
    }
    // 난이도 필터 (steps jsonb에 difficulty가 있을 경우)
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(item => {
        if (item.steps && typeof item.steps === "object" && item.steps.difficulty) {
          return item.steps.difficulty === difficultyFilter
        }
        if (item.difficulty) {
          return item.difficulty === difficultyFilter
        }
        return false
      })
    }
    setFilteredHistory(filtered)
  }, [dateFilter, difficultyFilter, history])

  // 기록 초기화 (전체 삭제)
  const handleClearHistory = async () => {
    if (!selectedProfileId) return
    await supabase
      .from("exercise_history")
      .delete()
      .eq("profile_id", selectedProfileId)
    setHistory([])
    setFilteredHistory([])
    setIsDialogOpen(false)
    toast({
      title: "운동 기록이 초기화되었습니다!",
      description: "모든 운동 기록이 삭제되었습니다.",
      variant: "default",
    })
  }

  // 개별 기록 삭제
  const handleDeleteHistoryItem = async (item: ExerciseHistoryItem) => {
    if (!selectedProfileId) return
    await supabase
      .from("exercise_history")
      .delete()
      .eq("profile_id", selectedProfileId)
      .eq("id", item.id)
      .eq("date", item.date)
    setHistory((prev) => prev.filter(
      historyItem => !(historyItem.id === item.id && historyItem.date === item.date)
    ))
    setFilteredHistory((prev) => prev.filter(
      historyItem => !(historyItem.id === item.id && historyItem.date === item.date)
    ))
    setIsItemDialogOpen(false)
    setSelectedItem(null)
    toast({
      title: "운동 기록이 삭제되었습니다",
      description: `"${item.exercise_name}" 운동 기록이 삭제되었습니다.`,
      variant: "default",
    })
  }

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000))
    return kstDate.toISOString().split('T')[0]
  }

  // 로딩 화면
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen p-4">
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
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link href="/profile">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            프로필로 돌아가기
          </Button>
        </Link>
        <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
          <Trash2 className="h-4 w-4 mr-1" />
          전체 기록 삭제
        </Button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle>운동 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="날짜" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="week">1주일</SelectItem>
                  <SelectItem value="month">이번 달</SelectItem>
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as DifficultyFilter)}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="난이도" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="easy">쉬움</SelectItem>
                  <SelectItem value="medium">중간</SelectItem>
                  <SelectItem value="hard">어려움</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((item, idx) => (
                  <Card key={item.id + item.date + idx} className="border p-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg">{item.exercise_name}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(item.date)}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{item.sets}세트</Badge>
                          <Badge variant="outline">{item.repetitions}회</Badge>
                          {item.steps?.difficulty && (
                            <Badge variant={
                              item.steps.difficulty === "easy"
                                ? "outline"
                                : item.steps.difficulty === "medium"
                                  ? "secondary"
                                  : "default"
                            }>
                              {item.steps.difficulty === "easy" ? "쉬움" : item.steps.difficulty === "medium" ? "중간" : "어려움"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item)
                            setIsItemDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* 단계/피드백 등 상세 정보 */}
                    <div className="mt-2 text-sm">
                      {Array.isArray(item.steps)
                        ? item.steps.map((step: any, i: number) => (
                            <div key={i}>
                              <span className="font-semibold">{step.step || step.description}</span>
                              {step.stepDuration && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({step.stepDuration}초)
                                </span>
                              )}
                            </div>
                          ))
                        : null}
                      {item.feedback && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          피드백: {typeof item.feedback === "string" ? item.feedback : JSON.stringify(item.feedback)}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      <StampWidget />

      {/* 전체 삭제 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>전체 기록 삭제</DialogTitle>
            <DialogDescription>모든 운동 기록을 삭제하시겠습니까?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleClearHistory}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 개별 삭제 다이얼로그 */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>운동 기록 삭제</DialogTitle>
            <DialogDescription>
              선택한 운동 기록을 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && handleDeleteHistoryItem(selectedItem)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
