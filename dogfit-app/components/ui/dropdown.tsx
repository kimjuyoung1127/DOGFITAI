"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // shadcn/ui의 DropdownMenu 컴포넌트 import

// Dropdown 아이템 타입 정의
export interface DropdownItem {
  id: string | number;
  label: React.ReactNode; // 라벨은 텍스트 또는 다른 React 요소가 될 수 있음
  isSeparator?: boolean; // 구분선 여부
  isLabel?: boolean; // 라벨 아이템 여부 (클릭 불가)
  onClick?: () => void; // 클릭 핸들러 (선택 사항)
}

// Dropdown 컴포넌트 Props 정의
interface CustomDropdownProps {
  trigger: React.ReactNode; // Dropdown을 열기 위한 트리거 요소 (예: 버튼)
  items: DropdownItem[]; // Dropdown 메뉴 아이템 배열
  align?: "start" | "center" | "end"; // 메뉴 정렬 방향 (선택 사항)
  sideOffset?: number; // 트리거와의 간격 (선택 사항)
}

export function CustomDropdown({
  trigger,
  items,
  align = "end", // 기본 정렬은 오른쪽 끝
  sideOffset = 4, // 기본 간격
}: CustomDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={sideOffset} className="w-56">
        {items.map((item, index) => {
          if (item.isSeparator) {
            // isSeparator가 true이면 구분선 렌더링
            return <DropdownMenuSeparator key={`sep-${index}`} />;
          }
          if (item.isLabel) {
            // isLabel이 true이면 라벨 렌더링
            return <DropdownMenuLabel key={item.id}>{item.label}</DropdownMenuLabel>;
          }
          // 일반 메뉴 아이템 렌더링
          return (
            <DropdownMenuItem key={item.id} onClick={item.onClick} className="cursor-pointer">
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
