import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateStudyContent(topic, wikiExtract, mode) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not set in .env file. Please add your API key.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const isMathMode = mode === 'math';

  const prompt = `You are a helpful study assistant. Based on this Wikipedia summary about "${topic}":

${wikiExtract}

Generate the following in valid JSON format:
1. A "summary" array with exactly 3 concise bullet points
2. A "quiz" array with exactly 3 multiple choice questions, each having:
   - "question": the question text
   - "options": array of 4 options (A, B, C, D)
   - "correctAnswer": the letter of the correct option
3. A "studyTip": one practical study tip related to this topic
${isMathMode ? '4. A "mathQuestion" object with:\n   - "question": a quantitative or logic question\n   - "answer": the correct answer\n   - "explanation": step-by-step explanation' : ''}

Return ONLY valid JSON, no markdown formatting or code blocks.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();
    
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleanContent;
    
    return JSON.parse(jsonString);
  } catch (error) {
    if (error.message.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key. Please check: https://aistudio.google.com/app/apikey');
    }
    throw error;
  }
}
