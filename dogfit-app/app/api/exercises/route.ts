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
다음 강아지 프로필에 맞는 운동 추천을 JSON 형식으로 제공해주세요:

강아지 정보:
- 이름: ${dogProfile.name}
- 나이: ${dogProfile.age.years}년 ${dogProfile.age.months}개월
- 체중: ${dogProfile.weight}kg
- 성별: ${dogProfile.gender}
- 견종: ${dogProfile.breed}
- 선호 활동: ${dogProfile.preferredActivities.join(', ') || '없음'}
- 사용 가능한 장비: ${dogProfile.availableEquipment.join(', ') || '없음'}

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
    // 총 5개의 운동 추천
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
          content: "당신은 반려견 운동 전문가입니다. 요청에 따라 JSON 배열 형식으로만 응답하세요. 배열 외의 텍스트나 설명은 포함하지 마세요." 
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