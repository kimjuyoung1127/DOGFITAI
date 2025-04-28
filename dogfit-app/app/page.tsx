import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PawPrint } from "lucide-react"
import Link from "next/link"
import { StampWidget } from "@/components/ui/stamp-widget"

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <div className="bg-primary p-6 text-white text-center">
            <div className="flex justify-center mb-4">
              <PawPrint className="h-16 w-16" />
            </div>
            <h1 className="text-3xl font-bold mb-2">DogFit</h1>
            <p className="text-lg">강아지 맞춤형 운동 추천</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-bold">반려견을 위한 맞춤형 운동 솔루션</h2>
              <p>
                DogFit은 당신의 반려견에게 딱 맞는 운동을 추천해드립니다. 강아지의 나이, 품종, 건강 상태에 맞춰 최적의
                운동을 찾아보세요.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4 text-center">
                <h3 className="font-bold mb-2">맞춤형 추천</h3>
                <p className="text-sm">반려견 정보에 맞는 운동 추천</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <h3 className="font-bold mb-2">스탬프 수집</h3>
                <p className="text-sm">운동 완료 시 스탬프 획득</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <h3 className="font-bold mb-2">단계별 가이드</h3>
                <p className="text-sm">쉽게 따라할 수 있는 운동 가이드</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <h3 className="font-bold mb-2">SNS 공유</h3>
                <p className="text-sm">친구들과 운동 성과 공유</p>
              </div>
            </div>

            <Link href="/login" className="block">
              <Button className="w-full text-lg py-6" size="lg" style={{ backgroundColor: '#FFA94D' }}>
                이미 정보를 입력하셨나요? 👉 로그인
              </Button>
            </Link>

            <Link href="/form" className="block">
              <Button className="w-full text-lg py-6" size="lg">
                시작하기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <StampWidget />
    </div>
  )
}
