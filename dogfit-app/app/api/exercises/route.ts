import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
6. **분석 요약은 'summary' 필드에 문자열로 포함되어야 합니다.**
`;


export async function POST(request: Request) {
  try {
    // 요청 본문에서 profileId 추출
    const { profileId } = await request.json();
    
    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 프로필 ID ${profileId}에 대한 운동 추천 요청 처리 중...`);
    
    // Supabase에서 프로필 데이터 가져오기
    const { data: profile, error } = await supabase
      .from('dog_profile')
      .select('*')
      .eq('id', profileId)
      .single();
    
    if (error) {
      console.error('❌ Supabase에서 프로필 데이터 가져오기 실패:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile data' },
        { status: 500 }
      );
    }
    
    if (!profile) {
      console.error(`❌ 프로필 ID ${profileId}에 해당하는 데이터가 없습니다.`);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ 프로필 데이터 가져오기 성공:', profile);
    
    // 프로필 데이터 형식 변환 (OpenAI 프롬프트용)
    const dogProfile = {
      name: profile.name,
      age: {
        years: Math.floor(profile.age / 12),
        months: profile.age % 12
      },
      weight: profile.weight,
      gender: profile.sex,
      breed: profile.breed,
      preferredActivities: profile.preferences?.selected || [],
      availableEquipment: profile.equipment_keys || [],
      healthValues: profile.health_values || {},
      performanceValues: profile.performance_values || {}
    };
    
    // OpenAI API 호출을 위한 프롬프트 수정
    const prompt = `
당신은 강아지 피트니스 분야에서 10년 이상의 경험을 가진 트레이너이며, 동물 생리학 및 병리학을 전공한 전문가입니다.  
해부학, 운동 생리학, 행동학, 재활 트레이닝에 기반하여 각 강아지의 **건강 상태, 기구 보유 여부, 운동 능력, 견종 특성**을 종합적으로 고려한 운동을 추천하고, 강아지에 대한 **분석 요약**도 함께 제공해주세요.
 "다음 강아지 프로필에 맞는 운동 추천 및 분석 요약을 JSON 형식으로 제공해주세요:
 "운동"은 신체 부위의 움직임, 지지력, 균형, 근력, 유연성 등을 강화하기 위해 수행되는 구조화된 신체 활동입니다.

강아지 정보:
- 이름: ${dogProfile.name}
- 나이: ${dogProfile.age.years}년 ${dogProfile.age.months}개월
- 체중: ${dogProfile.weight}kg
- 성별: ${dogProfile.gender}
- 견종: ${dogProfile.breed}
- 선호 활동: ${dogProfile.preferredActivities.join(', ') || '없음'}
- 사용 가능한 장비: ${dogProfile.availableEquipment.join(', ') || '없음'}
- 건강 값: ${JSON.stringify(dogProfile.healthValues)}
- 운동 능력 값: ${JSON.stringify(dogProfile.performanceValues)}


📌 다음 조건을 반드시 지켜주세요:

1. 관절(슬개골, 고관절), 척추, 심장, 기력 등에 민감함이 있다면 해당 부위에 **무리가 가지 않는 운동**으로 대체해주세요.
2. 사용 가능한 기구가 있다면 이를 활용한 운동을, 없다면 맨몸 운동(bodyweight only)을 제안해주세요.
3. 운동 난이도는 나이, 건강 민감도, 운동 능력 수치를 고려하여 현실적으로 조정해주세요.
4. 운동은 **총 3가지**, **서로 다른 목적(예: 균형감각 / 근력 / 유연성 등)**을 가지도록 구성해주세요.
5. 각 운동은 **총 소요시간(totalDuration) 기준으로 5~15분(300~900초)** 이내로 보호자가 실내에서 함께 진행 가능한 수준이어야 합니다.
6. 각 운동의 steps는 최소 **5단계 이상**으로 구성하며, 
   **구체적이고 보호자가 따라 하기 쉬운 언어로 작성**해주세요.
   각 단계에는 "어떻게 시도해야 하는지", "어떤 보조 동작이 필요한지", "반려견의 반응에 따라 조절하는 팁"을 포함하세요.
   - 예: "강아지가 불안해하면 손으로 살짝 지지해 주세요." 또는 "앞발이 떨리면 쉬었다가 다시 시도합니다."
7. 다음 메타데이터 contact 필드를 꼭 포함해주세요:
   - "frontlegs" | "hindlegs" | "wholebody" | "bodyweight"
   - 예시: 강아지가 도넛에 앞발만 올리면 → "contact": "frontlegs"
8. 반드시 아래 형식에 맞는 **JSON 객체만** 응답하세요. **추가 텍스트나 사족은 포함하지 마세요.**
9. 다음과 같은 활동은 제외해주세요:
   - 노즈워크, 페치, 장난감 던지기 등 **정신 자극 또는 일상 놀이에 가까운 활동**
   - 산책, 계단 오르내리기 등 **일반 생활에 포함된 비전문적인 활동**
   - 별도의 준비물이나 트레이닝이 없어도 누구나 바로 할 수 있는 **비운동성 활동**
10. 강아지의 민감하거나 약한 부위가 있어도 **절대 회피하지 말고**, 해당 부위를 **강화하고 개선할 수 있는 안전한 범위 내의 운동**을 제안해주세요.
   - 단, 직접적인 부담은 피하고, **저강도·간접 강화·지속 가능한 구조**로 접근해주세요.
   - 예: 척추 민감 시 무거운 운동은 피하고, 코어 강화나 체중 분산 운동부터 시작
   - 예: 무릎 민감 시 점프는 피하되, 쿠션 위 앉았다 일어나기, 체중 이동 연습 등은 가능


✏️ 추가 조건 - id 필드에 대한 규칙:
- 각 운동에는 고유한 '고유한 ID**가 있어야 합니다.
'id' 필드는 운동 이름을 기반으로 생성되어야 합니다.
- 운동 이름은 영어로 작성하고, 공백은 하이픈(-)으로 대체합니다.
- 예: "Donut Balance" → "donut-balance"


🛠 **추가 요구 사항 - 타이머 기능 적용 (본 운동에만 적용)**
기존 운동 추천 시스템을 개선하여 **각 운동 단계(\`steps\`)에만 타이머 기능을 추가**하고, 이를 앱의 UI와 연동할 수 있도록 운동 데이터를 제공해주세요.

📌 다음 타이머 관련 조건을 반드시 포함해주세요:
1️⃣ **운동 전체 소요 시간(\`totalDuration\`)을 제공해야 합니다.**
   - \`totalDuration\` 값은 본 운동(\`steps\`)의 각 \`stepDuration\` 합으로 계산하며, 단위는 초(seconds)입니다.
   - 웜업(\`warmupSteps\`)과 쿨다운(\`cooldownSteps\`) 단계의 시간은 \`totalDuration\`에 포함하지 않습니다. (참고: 현재 프롬프트에서는 웜업/쿨다운 단계를 명시적으로 요구하고 있지 않으나, 향후 확장성을 고려한 규칙입니다.)

2️⃣ **각 운동 단계(\`steps\`)에 \`stepDuration\` 값을 추가해야 합니다.**
   - \`steps\` 배열 내부의 각 단계별 수행 시간을 **초(\`seconds\`) 단위**로 \`stepDuration\` 필드에 명시하세요.
   - 웜업(\`warmupSteps\`)과 쿨다운(\`cooldownSteps\`)에는 \`stepDuration\`을 포함하지 않습니다.

3️⃣ **운동 진행 상태(\`status\`)는 본 운동(\`steps\`)에만 적용해야 합니다.**
   - 각 운동 객체에 \`status\` 필드를 추가하고, 값은 초기에 항상 "notStarted"로 설정합니다. ("notStarted" | "inProgress" | "completed" 중 하나)
   - 웜업(\`warmupSteps\`)과 쿨다운(\`cooldownSteps\`)에는 상태 관리가 적용되지 않습니다.

📝 **추가 요구 사항 - 분석 요약 (summary 필드)**
${analyzePrompt // analyzePromptText에서 analyzePrompt로 수정
  .replace('{name}', dogProfile.name)
  .replace('{age}', `${dogProfile.age.years * 12 + dogProfile.age.months}`) // 개월 수로 변환
  .replace('{breed}', dogProfile.breed)
  .replace('{weight}', String(dogProfile.weight))
  .replace('{healthIssues}', dogProfile.healthValues ? Object.keys(dogProfile.healthValues).filter(k => dogProfile.healthValues[k] > 0).join(', ') : '없음')
  .replace('{equipment}', dogProfile.availableEquipment.join(', ') || '없음')
  .replace('{performanceValues}', dogProfile.performanceValues ? JSON.stringify(dogProfile.performanceValues) : '{}')
  .replace('{exerciseHistory}', '최근 7일 운동 기록 데이터') // 실제 데이터로 대체 필요
}


📦 응답 형식:

{
  "summary": "여기에 분석 요약 텍스트가 들어갑니다. (3-5 문장)",
  "recommendations": [
    {
      "id": "donut-balance", // 👈 반드시 소문자 + 하이픈
      "name": "Donut Ball Balance",
      "description": "도넛 기구를 활용한 균형 감각 향상 운동",
      "difficulty": "easy" | "medium" | "hard",
      "duration": 10, // 단위: 분
      "equipment": ["donut_ball"],
      "steps": [ // 각 step은 객체로 변경되어 stepDuration 포함
        { "step": "운동 시작 전에 기구를 평평한 바닥에 놓습니다.", "stepDuration": 30 },
        { "step": "강아지가 기구를 향해 다가올 수 있도록 간식으로 유도합니다.", "stepDuration": 60 },
        { "step": "앞발을 기구 위에 올릴 수 있도록 유도하며, 발이 떨리면 잠시 멈췄다가 재시도합니다.", "stepDuration": 120 },
        { "step": "균형을 잡는 동안 보호자가 허리를 받쳐줍니다.", "stepDuration": 120 },
        { "step": "자세를 유지한 후 발을 내리게 하고, 간식으로 칭찬합니다.", "stepDuration": 60 }
      ],
      "totalDuration": 390, // 초 단위, steps의 stepDuration 합계
      "status": "notStarted", // "notStarted" | "inProgress" | "completed"
      "benefits": ["균형감각 향상", "코어 안정성", "근육 조절력 증가"],
      "contact": "frontlegs" // "frontlegs" | "hindlegs" | "wholebody" | "bodyweight"
    }
    // 여기에 두 번째 운동 추천 객체
    // 여기에 세 번째 운동 추천 객체 (총 3개의 운동 추천)
  ]
}


🎯 목적: 해당 JSON은 앱의 UI 카드와 매핑되며, contact 정보는 미리 준비된 이미지와 자동 연결됩니다.
반드시 위의 구조만 반환해주세요. 사족이나 부가 설명은 절대 포함하지 마세요.
🎯 목적: 앱은 강아지의 피트니스 트레이닝을 위한 **전문적이고 구조화된 운동**만을 추천해야 합니다.
🎯 목적: 이 앱은 **강아지의 약한 부분을 회복시키고 개선하는 피트니스 훈련**을 제공해야 하며, 단순히 회피하거나 보호적인 운동만 추천하면 안 됩니다.

`;



    console.log('🤖 OpenAI API 호출 중...');
    
    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          role: "system", 
          content: "가능한 운동은 실내 또는 실외 공간에서 보호자와 함께 수행할 수 있도록 구성해주세요. 운동 구성 시 한 가지 운동이 여러 목적(예: 유산소 + 균형)을 동시에 충족할 수 있다면 그렇게 구성해주세요.슬개골/고관절 문제가 있는 경우 점프, 빠른 방향 전환, 무리한 계단 오르기 등은 피해야 합니다. 응답은 반드시 'recommendations' 배열만 포함된 JSON으로 구성해주세요. 배열 외 텍스트, 제목, 해석 등은 절대 포함하지 마세요."

        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    // OpenAI 응답 처리
    const responseContent = completion.choices[0].message.content;
    console.log('✅ OpenAI 응답 수신:', responseContent);
    
    if (!responseContent) {
      throw new Error('OpenAI API에서 유효한 응답을 받지 못했습니다.');
    }
    
    try {
      // JSON 파싱
      const parsedResponse = JSON.parse(responseContent);
      
      // 단일 객체인 경우 배열로 변환
      let recommendations;
      
      if (Array.isArray(parsedResponse)) {
        recommendations = parsedResponse;
      } else if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
        recommendations = parsedResponse.recommendations;
      } else if (parsedResponse.exercises && Array.isArray(parsedResponse.exercises)) {
        recommendations = parsedResponse.exercises;
      } else if (parsedResponse.id) {
        // 단일 객체인 경우 배열로 변환
        recommendations = [parsedResponse];
        console.log('⚠️ 단일 객체를 배열로 변환했습니다');
      } else {
        console.error('❌ 예상치 못한 응답 구조:', parsedResponse);
        throw new Error('응답이 예상된 형식이 아닙니다.');
      }
      
      console.log(`✅ ${recommendations.length}개의 운동 추천 생성 완료`);
      
      // 결과 반환
      return NextResponse.json({
        success: true,
        profile: dogProfile,
        summary: parsedResponse.summary, // 👈 이 부분을 추가합니다.
        recommendations
      });
      
    } catch (parseError) {
      console.error('❌ OpenAI 응답 파싱 실패:', parseError);
      console.log('원본 응답:', responseContent);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: responseContent },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ 운동 추천 API 처리 중 오류 발생:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}