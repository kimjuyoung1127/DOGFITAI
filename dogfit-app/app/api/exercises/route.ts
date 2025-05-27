/* app/api/exercises/route.ts */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

export const runtime = 'nodejs';

/* Vertex 초기화 – 추가 옵션 없이 */
const vertex = new VertexAI({
  project: process.env.GCP_PROJECT_ID  || 'gen-lang-client-0617005764',
  location: process.env.GCP_LOCATION   || 'us-central1',
});

const model = vertex.getGenerativeModel({
  model: 'gemini-2.0-flash-lite-001',
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
  generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
});

/* ------------------------------------------------------------------
   3) 프롬프트 템플릿
------------------------------------------------------------------ */
const analyzePrompt = `
당신은 반려견 피트니스 및 재활 분야에서 10년 이상 경력을 가진 전문가입니다.
아래 강아지의 건강 상태, 운동 능력, 보유 기구, 견종 특성, 최근 운동 기록을 종합적으로 분석하여
보호자가 이해하기 쉬운 **분석 요약**을 작성해주세요.

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
5. **분석 요약은 3~5문장 이내로 간결하게 작성** (불필요한 해설·사족 금지)
6. **분석 요약은 반드시 'summary' 필드에 문자열로 포함**`;

const recommendPrompt = `
당신은 강아지 피트니스 분야에서 10년 이상의 경험을 가진 트레이너이며,
동물 생리학 및 병리학을 전공한 전문가입니다.
해부학·운동 생리학·행동학·재활 트레이닝에 기반하여
각 강아지의 건강 상태, 기구 보유 여부, 운동 능력, 견종 특성을 종합적으로 고려한
**운동 3가지를 추천**하고, 분석 요약도 함께 제공해주세요.

📌 필수 규칙
1. 관절·척추·심장 등 민감 부위는 무리 없는 방식으로 강화
2. 기구가 있으면 활용, 없으면 맨몸(body-weight) 운동
3. 총 3가지 운동은 서로 다른 목적(예: 균형 / 근력 / 유연성)
4. **steps**는 단계별 지침 + stepDuration(초) 포함, 최소 5단계
5. 각 운동 **totalDuration** = steps stepDuration 합계 (300~900초)
6. **status**: "notStarted" 로 초기화
7. **contact**: frontlegs | hindlegs | wholebody | bodyweight
8. 반드시 **JSON 객체만** 반환 (추가 텍스트 금지)
9. 노즈워크·산책 같은 일반적 활동은 제외
10. 약점을 회피하지 말고, 안전 범위 내에서 강화 전략 제시

📦 반환 형식:
{
  "summary": "... (3~5문장)",
  "recommendations": [
    {
      "id": "donut-balance",
      "name": "Donut Balance",
      "description": "...",
      "difficulty": "easy" | "medium" | "hard",
      "duration": 10,          // 분
      "equipment": ["donut_ball"],
      "steps": [
        { "step": "...", "stepDuration": 60 },
        ...
      ],
      "totalDuration": 420,    // 초
      "status": "notStarted",
      "benefits": ["균형감각", "..."],
      "contact": "frontlegs"
    },
    ... (총 3개)
  ]
}`;

/* ------------------------------------------------------------------
   4) 유틸 함수
------------------------------------------------------------------ */
function buildDogProfile(p: any) {
  return {
    name: p.name,
    age: { years: Math.floor(p.age / 12), months: p.age % 12 },
    weight: p.weight,
    gender: p.sex,
    breed: p.breed,
    preferredActivities: p.preferences?.selected ?? [],
    availableEquipment: p.equipment_keys ?? [],
    healthValues: p.health_values ?? {},
    performanceValues: p.performance_values ?? {},
  };
}

function buildAnalyzeText(profile: any) {
  return analyzePrompt
    .replace('{name}', profile.name)
    .replace('{age}', `${profile.age.years * 12 + profile.age.months}`)
    .replace('{breed}', profile.breed)
    .replace('{weight}', String(profile.weight))
    .replace(
      '{healthIssues}',
      profile.healthValues
        ? Object.keys(profile.healthValues)
            .filter((k) => profile.healthValues[k] > 0)
            .join(', ')
        : '없음',
    )
    .replace(
      '{equipment}',
      profile.availableEquipment.length
        ? profile.availableEquipment.join(', ')
        : '없음',
    )
    .replace(
      '{performanceValues}',
      JSON.stringify(profile.performanceValues ?? {}),
    )
    .replace('{exerciseHistory}', '최근 7일 운동 기록 데이터');
}

function buildFullPrompt(profile: any) {
  return `${recommendPrompt}\n\n${buildAnalyzeText(profile)}`;
}

/* ------------------------------------------------------------------
   5) POST 핸들러
------------------------------------------------------------------ */
export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();
    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from('dog_profile')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const dogProfile = buildDogProfile(profile);
    const prompt = buildFullPrompt(dogProfile);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from Gemini API' },
        { status: 502 },
      );
    }

    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON from Gemini API', detail: responseText },
        { status: 502 },
      );
    }

    return NextResponse.json(responseJson);
  } catch (e) {
    console.error('[API] 예외:', e);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: (e as Error).message },
      { status: 500 },
    );
  }
}
