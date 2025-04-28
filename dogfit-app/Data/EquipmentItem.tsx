import { Circle, CircleDot, Disc, RectangleVerticalIcon as Rectangle, Square, Triangle } from "lucide-react"


const equipmentItems = [
    {
      key: "cone_bar",
      label: "콘 + 바 세트",
      description: "콘과 가벼운 바를 조합 – 보폭 조절 운동",
      icon: <Triangle className="h-6 w-6" />,
    },
    {
      key: "balance_cushion",
      label: "밸런스 쿠션",
      description: "푹신한 쿠션",
      icon: <Circle className="h-6 w-6" />,
    },
    {
      key: "balance_disc",
      label: "밸런스 디스크",
      description: "흔들리는 원형 디스크 – 중심 잡기 운동",
      icon: <Disc className="h-6 w-6" />,
    },
    {
      key: "donut_ball",
      label: "도넛 / 짐볼",
      description: "불안정한 도넛형 공 – 균형 & 전신 근력 운동",
      icon: <CircleDot className="h-6 w-6" />,
    },
    {
      key: "yoga_block",
      label: "요가 블록",
      description: "단단한 네모 블록 – 발 위치 인식 운동",
      icon: <Square className="h-6 w-6" />,
    },
    {
      key: "platform_board",
      label: "단단한 플랫폼",
      description: "올라가서 앉고 기다리는 운동용 발판",
      icon: <Rectangle className="h-6 w-6" />,
    },
  ]

  export { equipmentItems }