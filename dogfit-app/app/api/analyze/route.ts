import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/supabaseClient'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const analyzePrompt = `
당신은 반려견 피트니스 및 재활 분야에서 10년 이상 경력을 가진 전문가입니다.
아래 강아지의 건강 상태, 운동 능력, 보유 기구, 견종 특성, 최근 운동 기록을 종합적으로 분석하여 보호자가 이해하기 쉬운 **분석 요약**을 작성해주세요.

강아지 정보:
- 이름: {name}
- 나이: {age}개월
- 견종: {breed}
- 체중: {weight}kg
- 건강 이슈: {healthIssues}
- 보유 기구: {equipment}
- 주요 운동 능력치: {performanceValues}
- 최근 운동 기록: {exerciseHistory}

📌 반드시 아래 조건을 지켜주세요:
1. **강점**: 평균 대비 뛰어난 능력치, 건강상 강점, 운동 수행에서 잘한 점을 구체적으로 언급
2. **약점/개선 포인트**: 평균 이하이거나 민감한 부위, 개선이 필요한 운동 능력, 주의해야 할 건강 이슈를 구체적으로 언급
3. **개선 제안**: 약점 개선을 위한 구체적이고 실현 가능한 운동 방향성, 보호자 행동 팁 제시
4. **주의사항**: 운동 시 반드시 유의해야 할 점, 피해야 할 동작, 보호자에게 필요한 안내
5. **분석 요약은 3~5문장 이내로 간결하게 작성** (불필요한 해설, 반복, 사족 금지)
6. **JSON 객체로만 반환** (아래 형식 참고, 추가 텍스트 금지)

응답 예시:
{
  "summary": "균형감각과 근력이 또래 평균보다 우수합니다. 척추와 슬개골 민감도가 높으므로 점프나 갑작스러운 방향 전환은 피해야 합니다. 유연성과 반응 속도는 추가 개선이 필요하니, 저강도 스트레칭과 반응 훈련을 병행하세요. 운동 시 보호자가 옆에서 지지해주면 안전하게 진행할 수 있습니다."
}
`;

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json()
    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
    }

    // 프로필 데이터 fetch
    const { data: profile, error } = await supabase
      .from('dog_profile')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: '프로필 데이터를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 최근 7일 운동 기록 등 추가 fetch 필요시 여기에 구현
    // 예시: const exerciseHistory = ...

    // 프롬프트에 데이터 삽입
    const prompt = analyzePrompt
      .replace('{name}', profile.name)
      .replace('{age}', String(profile.age))
      .replace('{breed}', profile.breed)
      .replace('{weight}', String(profile.weight))
      .replace('{healthIssues}', profile.health_values ? Object.keys(profile.health_values).filter(k => profile.health_values[k] > 0).join(', ') : '없음')
      .replace('{equipment}', profile.equipment_keys ? profile.equipment_keys.join(', ') : '없음')
      .replace('{performanceValues}', profile.performance_values ? JSON.stringify(profile.performance_values) : '{}')
      .replace('{exerciseHistory}', '최근 7일 운동 기록 데이터') // 실제 데이터로 대체

    // OpenAI 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "아래 프롬프트 조건을 반드시 지키세요. JSON 객체만 반환하세요." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const responseContent = completion.choices[0].message.content
    if (!responseContent) throw new Error('OpenAI 응답 없음')

    const parsed = JSON.parse(responseContent)
    return NextResponse.json({ summary: parsed.summary })
  } catch (e) {
    return NextResponse.json({ error: '분석 요약 생성 실패', details: String(e) }, { status: 500 })
  }
}