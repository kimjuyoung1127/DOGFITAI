/* app/api/exercises/route.ts */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

export const runtime = 'nodejs'; // Changed to nodejs

// Prompts defined here as per previous step (turn 45)
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
6. **분석 요약은 반드시 'summary' 필드에 문자열로 포함**
7. **분석 요약은 반드시 한글로 작성하고, 모든 영어 용어는 쉬운 한국어로 풀어쓰거나 적절한 한국어 용어로 번역**`;

const recommendPrompt = `
당신은 강아지 피트니스 분야에서 10년 이상의 경험을 가진 트레이너이며,
동물 생리학 및 병리학을 전공한 전문가입니다.
해부학·운동 생리학·행동학·재활 트레이닝에 기반하여
각 강아지의 건강 상태, 기구 보유 여부, 운동 능력, 견종 특성을 종합적으로 고려한
**운동 3가지를 추천**하고, 분석 요약도 함께 제공해주세요.

// 중요: recommendPrompt는 이전과 동일하게 영어 키를 사용합니다.
// recommendPrompt 결과는 반드시 한글로 작성하고, 모든 영어 용어는 쉬운 한국어로 풀어쓰거나 적절한 한국어 용어로 번역

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

/*
  Vertex AI Initialization:
  Credentials can be managed via GOOGLE_APPLICATION_CREDENTIALS_JSON env var
  or other Application Default Credentials methods.
*/
const credentialsEnvJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
let credentials;
if (credentialsEnvJson) {
  try {
    credentials = JSON.parse(credentialsEnvJson);
  } catch (e) {
    console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
    // Depending on policy, might throw error or let ADC handle it
  }
} else {
  console.warn('GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. Vertex AI client will use default ADC if available.');
}

const vertex = new VertexAI({
  project: process.env.GCP_PROJECT_ID  || 'gen-lang-client-0617005764',
  location: process.env.GCP_LOCATION   || 'us-central1',
  credentials // This will be undefined if JSON is not set/parsed, letting VertexAI use ADC
});

const model = vertex.getGenerativeModel({
  model: 'gemini-2.0-flash-lite-001', // Corrected model name based on previous context if needed
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
  generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
});

/* ------------------------------------------------------------------
   Util Functions
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
            .filter((k: string) => profile.healthValues[k] > 0) // Added type for k
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
    .replace('{exerciseHistory}', '최근 7일 운동 기록 데이터'); // Placeholder for now
}

function buildFullPrompt(profile: any) {
  // Note: The original reconstruction combined recommendPrompt and analyzeText.
  // This assumes analyzeText is part of the input to the model that then also handles recommendations.
  // If analyzePrompt was meant to be a separate call, this would need adjustment.
  // For now, sticking to the observed structure where analyzePrompt seems to be for context.
  // The recommendPrompt is what's actually sent for exercise recommendations.
  // To make this more robust, we'd ideally have a clearer separation or prompt chaining logic.
  // However, based on the user's provided prompts, recommendPrompt is the one that specifies the JSON output for recommendations.

  // For this reconstruction, we'll assume the model takes the dog's full profile and generates recommendations.
  // The `buildAnalyzeText` content is effectively part of the context provided within `recommendPrompt`'s structure.
  // So, we will format the profile information and insert it into the recommendPrompt.

  // This is a simplified interpretation. The original might have had a more complex way
  // of using analyzePrompt and recommendPrompt (e.g., two separate calls to the model).
  // For now, we are restoring the primary functionality of the POST handler.

  // Reconstructing based on the structure of `buildAnalyzeText` being used to fill placeholders
  // in a larger prompt template that includes the request for recommendations.
  // The `recommendPrompt` already contains placeholders like {name}, {age} etc. if we follow its literal text.
  // However, the original commented-out code showed `buildFullPrompt` calling `buildAnalyzeText`
  // and then prepending `recommendPrompt`. This implies `recommendPrompt` might be the main instruction
  // and `buildAnalyzeText` provides the context block.

  // Let's assume recommendPrompt is the main instruction set and the profile data is context.
  // The original `buildFullPrompt` was: return `${recommendPrompt}\n\n${buildAnalyzeText(profile)}`;
  // This means the `recommendPrompt` itself doesn't have placeholders for profile data, but expects
  // that data to be appended. The `analyzePrompt` structure was for building that appended data.

  // The user-provided `recommendPrompt` in turn 45 does *not* have {name} etc. placeholders.
  // The `analyzePrompt` *does*.
  // The original code (before stubbing) had `buildFullPrompt` calling `buildAnalyzeText`.
  // Let's ensure `buildAnalyzeText` is used to provide context.

  // The original `VertexAI` call used `prompt` which was `buildFullPrompt(dogProfile)`.
  // `buildFullPrompt` was `return \`\${recommendPrompt}\n\n\${buildAnalyzeText(profile)}\`;`
  // This means `recommendPrompt` is the main instruction, and `analyzePrompt` (via `buildAnalyzeText`)
  // is used to structure the dog's data block that follows the main instruction.

  return `${recommendPrompt}\n\n${buildAnalyzeText(profile)}`;
}

/* ------------------------------------------------------------------
   POST Handler
------------------------------------------------------------------ */
export async function POST(request: Request) {
  console.log(`Received request: ${request.method} ${request.url}`);
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON && !credentials) { // Check both env var and parsed creds
    console.error('Error: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set, and no credentials parsed. Authentication will fail.');
    // Potentially return a 500 error here if credentials are absolutely mandatory
    // For now, allowing it to proceed to VertexAI which might use ADC or fail.
  }

  try {
    const { profileId } = await request.json();
    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    const { data: profileData, error: supabaseError } = await supabase // Renamed 'profile' to 'profileData' to avoid conflict
      .from('dog_profile')
      .select('*')
      .eq('id', profileId)
      .single();

    if (supabaseError || !profileData) {
      console.error('Error fetching profile from Supabase:', supabaseError);
      return NextResponse.json({ error: 'Profile not found or Supabase error' }, { status: 404 });
    }

    const dogProfile = buildDogProfile(profileData);
    const fullPrompt = buildFullPrompt(dogProfile); // Use the corrected buildFullPrompt

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    });

    // Ensure result.response and other properties exist before trying to access them
    if (!result.response || !result.response.candidates || !result.response.candidates[0] || !result.response.candidates[0].content || !result.response.candidates[0].content.parts || !result.response.candidates[0].content.parts[0]) {
      console.error('Invalid response structure from Vertex AI:', result);
      return NextResponse.json({ error: 'Invalid or incomplete response from Vertex AI' }, { status: 502 });
    }

    const responseText = result.response.candidates[0].content.parts[0].text;

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response text from Vertex AI API' },
        { status: 502 },
      );
    }

    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response from Vertex AI:', responseText, e);
      return NextResponse.json(
        { error: 'Invalid JSON from Vertex AI API', detail: responseText },
        { status: 502 },
      );
    }

    return NextResponse.json(responseJson);
  } catch (error: any) {
    console.error(`Error in POST /api/exercises:`, error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred during request processing.', success: false, errorDetails: String(error) }, { status: 500 });
  }
}

// Adding a GET handler as a stub, as it was present in the stubbed version.
// Or remove if no GET functionality was originally intended.
export async function GET(request: Request) {
  console.log(`Received request: ${request.method} ${request.url}`);
  // This GET handler is a stub if the original code only had POST.
  // If GET had specific functionality, that should be restored here.
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON && !credentials) {
    console.error('Error: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set (GET), and no credentials parsed. Authentication will fail.');
  }
  return NextResponse.json({ message: 'GET endpoint for /api/exercises. Currently a stub. Actual functionality might be POST-only.', success: true }, { status: 200 });
}
