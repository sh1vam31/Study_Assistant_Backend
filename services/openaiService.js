import { GoogleGenerativeAI } from '@google/generative-ai';

// Try Gemini first, fallback directly to Wikipedia (no OpenAI)
export async function generateStudyContent(topic, wikiExtract, mode) {
  const geminiKey = process.env.GEMINI_API_KEY;
  
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

  // Try Gemini first
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      console.log('Trying Gemini API...');
      return await generateWithGemini(geminiKey, prompt);
    } catch (error) {
      console.error('Gemini API failed:', error.message);
      
      // Always fallback to Wikipedia for any Gemini error
      console.log('🔄 Gemini failed, falling back to Wikipedia-only mode...');
      const { generateFromWikipedia } = await import('./wikipediaService.js');
      return generateFromWikipedia(topic, wikiExtract, mode);
    }
  }
  
  // No Gemini key available, use Wikipedia-only mode
  console.log('No Gemini API key configured, using Wikipedia-only mode...');
  const { generateFromWikipedia } = await import('./wikipediaService.js');
  return generateFromWikipedia(topic, wikiExtract, mode);
}

// Gemini API implementation with optimizations
async function generateWithGemini(apiKey, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.5, // Lower for faster, more focused responses
        maxOutputTokens: 1024, // Reduced from 2048 for faster generation
        topP: 0.8, // More focused responses
        topK: 40,
      }
    });
    
    // Set timeout for faster failure
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 15000) // 15 second timeout
    );
    
    const generatePromise = model.generateContent(prompt);
    
    const result = await Promise.race([generatePromise, timeoutPromise]);
    const response = result.response;
    const content = response.text().trim();
    
    console.log('✅ Gemini API response received');
    
    return parseAIResponse(content);
  } catch (error) {
    console.error('Gemini failed:', error.message);
    
    // Don't retry, fail fast and use fallback
    if (error.message.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API key');
    }
    if (error.message.includes('quota')) {
      throw new Error('Gemini API quota exceeded');
    }
    
    throw new Error('Gemini API error: ' + error.message);
  }
}

// OpenAI removed - using Gemini → Wikipedia fallback only

// Parse and validate AI response
function parseAIResponse(content) {
  // Remove markdown code blocks if present
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : cleanContent;
  
  const parsedData = JSON.parse(jsonString);
  
  // Validate required fields
  if (!parsedData.summary || !parsedData.quiz || !parsedData.studyTip) {
    throw new Error('Invalid response format from AI');
  }
  
  return parsedData;
}
