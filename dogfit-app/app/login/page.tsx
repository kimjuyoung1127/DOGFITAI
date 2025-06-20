"use client"

export const dynamic = 'force-dynamic'; // Add this line

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { supabase } from "@/lib/supabase/supabaseClient"
import { Provider } from "@supabase/supabase-js"

interface LoginContentProps {
  pendingDataInitially: boolean;
  redirectPathInitially: string;
}

function LoginContent({ pendingDataInitially, redirectPathInitially }: LoginContentProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("로그인 실패: " + error.message);
        setIsLoading(false);
        return;
      }

      router.push(`${redirectPathInitially}${pendingDataInitially ? '?pending_data=true' : ''}`);
    } catch (e) {
      console.error("로그인 중 오류 발생:", e);
      alert("로그인 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectPathInitially}${pendingDataInitially ? '&pending_data=true' : ''}`,
        }
      });
      
      if (error) {
        alert("Google 로그인 실패: " + error.message);
      }
    } catch (e) {
      console.error("Google 로그인 중 오류 발생:", e);
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  const handleKakaoLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectPathInitially}${pendingDataInitially ? '&pending_data=true' : ''}`,
        }
      });

      if (error) {
        alert("Kakao 로그인 실패: " + error.message);
      }
    } catch (e) {
      console.error("Kakao 로그인 중 오류 발생:", e);
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  const handleNaverLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "naver" as Provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectPathInitially}${pendingDataInitially ? '&pending_data=true' : ''}`,
        }
      });

      if (error) {
        alert("Naver 로그인 실패: " + error.message);
      }
    } catch (e) {
      console.error("Naver 로그인 중 오류 발생:", e);
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      {pendingDataInitially && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
          <p className="text-orange-700">
            <strong>입력 중인 데이터가 있습니다.</strong> 로그인하시면 이전에 입력하던 내용을 이어서 진행할 수 있습니다.
          </p>
        </div>
      )}
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
            {/* Google Button */}
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
            {/* Kakao Button */}
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
            {/* Naver Button */}
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
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const pendingDataInitially = searchParams.get('pending_data') === 'true';
  const redirectPathInitially = searchParams.get('redirect') || '/profile';

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>페이지를 불러오는 중...</p></div>}>
      <LoginContent
        pendingDataInitially={pendingDataInitially}
        redirectPathInitially={redirectPathInitially}
      />
    </Suspense>
  );
}