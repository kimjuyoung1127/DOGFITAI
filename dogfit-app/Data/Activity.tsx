import { Hand, Mountain, Scale, Zap, PlayIcon as Run } from "lucide-react"

const activityIcons = {
    running: <Run className="h-6 w-6" />,
    jumping: <Zap className="h-6 w-6" />,
    climbing: <Mountain className="h-6 w-6" />,
    balance: <Scale className="h-6 w-6" />,
    holding: <Hand className="h-6 w-6" />,
  }

  const activityNames = {
    running: "달리기",
    jumping: "점프",
    climbing: "오르기",
    balance: "균형 잡기",
    holding: "버티기",
  }

  export { activityIcons, activityNames }