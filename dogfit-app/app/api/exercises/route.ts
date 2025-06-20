/* app/api/exercises/route.ts */
import { NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase/supabaseClient';
// import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai'; // Keep this import commented if VertexAI is not used in stub

export const runtime = 'edge';

/*
  Vertex AI Initialization Example using GOOGLE_APPLICATION_CREDENTIALS_JSON:

  1. Ensure '@google-cloud/vertexai' is in your package.json dependencies.
  2. Set the GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable with the
     JSON content of your service account key.

  const credentialsEnvJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  let credentials;
  if (credentialsEnvJson) {
    try {
      credentials = JSON.parse(credentialsEnvJson);
    } catch (e) {
      console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
    }
  } else {
    console.warn('GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. Vertex AI client will use default ADC if available or fail if not configured.');
  }

  // If you were to use VertexAI directly (currently commented out):
  // import { VertexAI } from '@google-cloud/vertexai'; // Make sure this import is active if using the client
  const vertex_ai = new VertexAI({ // Assuming VertexAI is imported/required
    project: process.env.GCP_PROJECT_ID || 'YOUR_PROJECT_ID', // Replace with actual project ID
    location: process.env.GCP_LOCATION || 'YOUR_LOCATION',   // Replace with actual location
    credentials // Pass the parsed credentials here if available
  });
*/


// Original commented-out VertexAI initialization (kept for reference, but the example above is preferred for env var usage)
// const vertex = new VertexAI({
//   project: process.env.GCP_PROJECT_ID  || 'gen-lang-client-0617005764',
//   location: process.env.GCP_LOCATION   || 'us-central1',
// });

// const model = vertex.getGenerativeModel({
//   model: 'gemini-2.0-flash-lite-001',
//   safetySettings: [
//     { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//     { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//     { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//     { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//   ],
//   generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
// });

/* ------------------------------------------------------------------
   3) 프롬프트 템플릿 (Commented out)
------------------------------------------------------------------ */
// const analyzePrompt = `...`;
// const recommendPrompt = `...`;

/* ------------------------------------------------------------------
   4) 유틸 함수 (Commented out)
------------------------------------------------------------------ */
// function buildDogProfile(p: any) { /* ... */ }
// function buildAnalyzeText(profile: any) { /* ... */ }
// function buildFullPrompt(profile: any) { /* ... */ }

/* ------------------------------------------------------------------
   5) POST 핸들러
------------------------------------------------------------------ */
export async function POST(request: Request) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    console.warn('Warning: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. API will not be able to authenticate with Google Cloud if real functionality is enabled.');
  }
  // Original functionality is commented out.
  // try {
  //   const { profileId } = await request.json();
  //   // ... rest of the original code
  // } catch (e) {
  //   // ... original error handling
  // }
  return NextResponse.json({ message: 'API endpoint temporarily disabled due to build incompatibility.', success: false }, { status: 503 });
}

export async function GET(request: Request) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    console.warn('Warning: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. API will not be able to authenticate with Google Cloud if real functionality is enabled.');
  }
  return NextResponse.json({ message: 'API endpoint temporarily disabled due to build incompatibility.', success: false }, { status: 503 });
}
