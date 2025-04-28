"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { dogBreedData } from "@/Data/DogBreedData"
import type { Breed } from "@/lib/types"



interface BreedSelectorProps {
  value: Breed | ""; // 선택된 품종 값 (또는 빈 문자열)
  onValueChange: (value: Breed | "") => void; // 값 변경 시 호출될 함수
  placeholder?: string; // 플레이스홀더 텍스트 (선택 사항)
  className?: string; // 추가적인 CSS 클래스 (선택 사항)
}

export function BreedSelector({
  value,
  onValueChange,
  placeholder = "품종을 선택해주세요...",
  className,
}: BreedSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    const selectedBreed = dogBreedData.find(breed => breed === currentValue) as Breed | undefined;

    if (selectedBreed) {
      onValueChange(selectedBreed === value ? "" : selectedBreed);
    } else {
      onValueChange("");
    }
    setOpen(false)
  }

  const displayValue = value ? dogBreedData.find((breed) => breed === value as unknown as string) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
        <Command>
          <CommandInput placeholder="품종 검색..." />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <CommandGroup>
              {(dogBreedData as ReadonlyArray<string>).map((breed) => (
                <CommandItem
                  key={breed}
                  value={breed}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === breed ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {breed}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}