import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
해부학, 운동 생리학, 행동학, 재활 트레이닝에 기반하여 각 강아지의 **건강 상태, 기구 보유 여부, 운동 능력, 견종 특성**을 종합적으로 고려한 운동을 추천해주세요.
 "다음 강아지 프로필에 맞는 운동 추천을 JSON 형식으로 제공해주세요:

강아지 정보:
- 이름: ${dogProfile.name}
- 나이: ${dogProfile.age.years}년 ${dogProfile.age.months}개월
- 체중: ${dogProfile.weight}kg
- 성별: ${dogProfile.gender}
- 견종: ${dogProfile.breed}
- 선호 활동: ${dogProfile.preferredActivities.join(', ') || '없음'}
- 사용 가능한 장비: ${dogProfile.availableEquipment.join(', ') || '없음'}


📌 반드시 다음 조건을 지켜주세요:
1. 관절(특히 슬개골, 고관절), 심장, 기력 등에 민감함이 있다면 해당 부위에 **무리가 가지 않는 운동**으로 대체해주세요.
2. 사용 가능한 장비가 있을 경우 이를 활용한 운동을, 없다면 맨몸으로 가능한 운동만 추천해주세요.
3. 나이, 체력, 집중력, 민감도 등 전반적인 운동 능력에 따라 난이도(difficulty)를 조절해주세요.
4. 유산소, 균형감각, 근력, 유연성 등 다양한 목적의 운동이 포함되도록 구성해주세요.
5. 각 운동은 5~15분 내에 보호자와 함께 실내외에서 진행 가능한 수준으로 구성해주세요.
6. 동작은 현실적으로 가능한 범위 내에서 구성하고, 단계별 설명이 쉽고 명확해야 합니다.
7. 추천 운동은 **총 3가지**, 각각 서로 다른 유형으로 제안해주세요.


반드시 다음 형식의 JSON으로 응답해주세요:
{
  "recommendations": [
    {
      "id": "1",
      "name": "운동 이름",
      "description": "운동에 대한 간략한 설명",
      "difficulty": "easy/medium/hard 중 하나",
      "duration": 숫자(분 단위),
      "equipment": ["필요한 장비1", "필요한 장비2"],
      "steps": ["1단계 설명", "2단계 설명", "3단계 설명"],
      "benefits": ["효과1", "효과2", "효과3"]
    },
    // 총 3개의 운동 추천
  ]
}

사용 가능한 장비가 있다면 이를 활용한 운동을, 없다면 맨몸으로 할 수 있는 운동을 추천해주세요.
반드시 위 형식의 JSON 객체로만 응답해주세요. 추가 설명이나 다른 텍스트는 포함하지 마세요.
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