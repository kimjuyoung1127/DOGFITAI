"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PawPrint } from "lucide-react"

export function StampWidget() {
  const [stamps, setStamps] = useState(0)
  const [hasBadge, setHasBadge] = useState(false)

  useEffect(() => {
    // Load stamps from localStorage
    const savedStamps = localStorage.getItem("dogfit-stamps")
    if (savedStamps) {
      const count = Number.parseInt(savedStamps)
      setStamps(count)
      setHasBadge(count >= 5)
    }
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed bottom-4 right-4 bg-white rounded-full p-2 shadow-lg flex items-center gap-2 cursor-pointer">
            <PawPrint className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">{stamps}</span>
            {hasBadge && <Badge className="bg-primary text-white text-xs">뱃지 획득!</Badge>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>현재 {stamps}개의 스탬프를 모았어요!</p>
          {!hasBadge && <p>5개 모으면 뱃지를 획득할 수 있어요.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
