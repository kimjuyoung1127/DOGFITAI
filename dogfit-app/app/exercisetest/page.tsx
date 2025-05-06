"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PawPrintLoading } from "@/components/ui/paw-print-loading"

export default function ExerciseTestPage() {
  const searchParams = useSearchParams()
  const profileId = searchParams.get('profileId')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  // API 호출 함수
  const fetchExerciseRecommendations = async () => {
    if (!profileId) {
      setError("프로필 ID가 필요합니다. URL에 ?profileId=123 형식으로 추가해주세요.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setData(null)
      
      console.log(`🔍 프로필 ID ${profileId}에 대한 운동 추천 요청 중...`)
      
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      })
      
      const responseText = await response.text() // 먼저 텍스트로 받아서 확인
      console.log('📄 Raw response:', responseText)
      
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(errorData.error || `API 오류: ${response.status}`)
        } catch (e) {
          throw new Error(`API 오류: ${response.status}, 응답: ${responseText}`)
        }
      }
      
      try {
        const responseData = JSON.parse(responseText)
        console.log('✅ 응답 데이터:', responseData)
        setData(responseData)
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        throw new Error(`JSON 파싱 오류: ${errorMessage}, 원본: ${responseText}`)
      }
      
    } catch (err) {
      console.error('❌ API 호출 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 페이지 로드 시 자동 호출
  useEffect(() => {
    if (profileId) {
      fetchExerciseRecommendations()
    }
  }, [profileId])

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">운동 추천 API 테스트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              현재 프로필 ID: <span className="font-mono font-bold">{profileId || "없음"}</span>
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={fetchExerciseRecommendations} 
                disabled={loading || !profileId}
              >
                API 호출 테스트
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setData(null)
                  setError(null)
                }}
                disabled={loading}
              >
                결과 지우기
              </Button>
            </div>
          </div>
          
          {/* 프로필 ID 없음 안내 */}
          {!profileId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-yellow-800">
                URL에 <span className="font-mono">?profileId=123</span> 형식으로 프로필 ID를 추가해주세요.
              </p>
            </div>
          )}
          
          {/* 로딩 상태 */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <PawPrintLoading />
              <p className="mt-4 text-gray-600">API 응답을 기다리는 중...</p>
            </div>
          )}
          
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <h3 className="text-red-800 font-medium mb-2">오류 발생</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* API 응답 결과 */}
          {data && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">API 응답 결과</h3>
              
              {/* 추천 운동 개수 */}
              {data.recommendations && (
                <p className="mb-2 text-green-600 font-medium">
                  총 {data.recommendations.length}개의 운동이 추천되었습니다.
                </p>
              )}
              
              {/* JSON 데이터 표시 */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 overflow-auto max-h-[500px]">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 사용 방법 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">사용 방법</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>URL에 <span className="font-mono">?profileId=123</span> 형식으로 프로필 ID를 추가합니다.</li>
            <li>페이지가 로드되면 자동으로 API를 호출합니다.</li>
            <li>또는 "API 호출 테스트" 버튼을 클릭하여 수동으로 호출할 수 있습니다.</li>
            <li>응답 결과는 JSON 형식으로 화면에 표시됩니다.</li>
          </ol>
          
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-blue-800 font-medium mb-2">API 엔드포인트 정보</h3>
            <p className="text-blue-700 font-mono mb-1">POST /api/exercises</p>
            <p className="text-blue-700 mb-2">요청 본문: <span className="font-mono">{"{ profileId: string }"}</span></p>
            <p className="text-gray-600 text-sm">이 API는 지정된 프로필 ID에 대한 맞춤형 운동 추천을 생성합니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
