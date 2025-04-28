"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { supabase } from "@/lib/supabase/supabaseClient"
import { Provider } from "@supabase/supabase-js"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        alert("로그인 실패: " + error.message)
      } else {
        console.log("로그인 성공:", data.user)
        router.push("/profile")
      }
    } catch (e) {
      console.error("로그인 중 오류 발생:", e)
      alert("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      })

      if (error) {
        alert("Google 로그인 실패: " + error.message)
      }
    } catch (e) {
      console.error("Google 로그인 중 오류 발생:", e)
      alert("로그인 중 오류가 발생했습니다.")
    }
  }

  const handleKakaoLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
      })

      if (error) {
        alert("Kakao 로그인 실패: " + error.message)
      }
    } catch (e) {
      console.error("Kakao 로그인 중 오류 발생:", e)
      alert("로그인 중 오류가 발생했습니다.")
    }
  }

  const handleNaverLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "naver" as Provider,
      })

      if (error) {
        alert("Naver 로그인 실패: " + error.message)
      }
    } catch (e) {
      console.error("Naver 로그인 중 오류 발생:", e)
      alert("로그인 중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">로그인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
          <div className="text-center mt-4">
            <Link href="/form">
              처음 오셨나요? 👉 시작하기
            </Link>
          </div>
          <div className="space-y-2 mt-6">
            <Button
              className="w-full flex items-center justify-center border border-gray-300"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#3C4043",
                height: "48px",
                fontSize: "16px",
                borderRadius: "8px",
              }}
              onClick={handleGoogleLogin}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F9FA")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              <img src="/google-logo.png" alt="Google" className="mr-2" />
              Google로 로그인
            </Button>
            <Button
              className="w-full flex items-center justify-center"
              style={{
                backgroundColor: "#FEE500",
                color: "#000000",
                height: "48px",
                fontSize: "16px",
                borderRadius: "8px",
              }}
              onClick={handleKakaoLogin}
            >
              <img src="/kakao-logo.png" alt="Kakao" className="mr-2" />
              카카오로 로그인
            </Button>
            <Button
              className="w-full flex items-center justify-center"
              style={{
                backgroundColor: "#03C75A",
                color: "#FFFFFF",
                height: "48px",
                fontSize: "16px",
                borderRadius: "8px",
              }}
              onClick={handleNaverLogin}
            >
              <img src="/naver-logo.png" alt="Naver" className="mr-2" />
              네이버로 로그인
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 