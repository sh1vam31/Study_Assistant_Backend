import { GoogleGenerativeAI } from '@google/generative-ai';

// Detect if the query is a direct math problem
export function isMathProblem(query) {
  const mathKeywords = [
    'solve', 'calculate', 'compute', 'find', 'what is',
    'mean', 'median', 'mode', 'average', 'sum', 'product',
    'derivative', 'integral', 'equation', 'simplify',
    'factor', 'expand', 'evaluate', 'prove'
  ];
  
  const queryLower = query.toLowerCase();
  
  // Check for math keywords
  const hasMathKeyword = mathKeywords.some(keyword => queryLower.includes(keyword));
  
  // Check for numbers and operators
  const hasNumbers = /\d/.test(query);
  const hasMathOperators = /[\+\-\*\/\=\^\(\)\[\]√∫∑]/.test(query);
  
  // Check for common math patterns
  const mathPatterns = [
    /\d+\s*[\+\-\*\/]\s*\d+/, // Basic arithmetic: 2+3, 5*4
    /mean|average|median|mode.*\d/, // Statistics with numbers
    /solve.*[x-z]/, // Solve for variable
    /derivative|integral/, // Calculus
    /\d+\s*,\s*\d+/, // List of numbers: 2,3,4,5
  ];
  
  const matchesPattern = mathPatterns.some(pattern => pattern.test(queryLower));
  
  return (hasMathKeyword && hasNumbers) || hasMathOperators || matchesPattern;
}

// Solve math problem directly with Gemini
export async function solveMathProblem(problem, mode) {
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `You are a helpful math tutor. Solve this math problem step by step:

Problem: ${problem}

Provide your response in valid JSON format with the following structure:
{
  "summary": [
    "Brief explanation of what the problem is asking",
    "Key concepts or formulas needed",
    "Final answer with units if applicable"
  ],
  "solution": {
    "steps": [
      "Step 1: ...",
      "Step 2: ...",
      "Step 3: ..."
    ],
    "answer": "The final answer",
    "explanation": "Brief explanation of the solution method"
  },
  "quiz": [
    {
      "question": "A similar practice question",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A"
    },
    {
      "question": "Another practice question",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "B"
    },
    {
      "question": "One more practice question",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "C"
    }
  ],
  "studyTip": "A helpful tip for solving similar problems"
}

Return ONLY valid JSON, no markdown formatting or code blocks.`;

  // Try with retries
  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries - 1} for math problem...`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }

      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.3, // Lower temperature for more accurate math
          maxOutputTokens: 2048,
        }
      });
      
      console.log('🧮 Solving math problem with Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text().trim();
      
      // Parse JSON response
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanContent;
      const parsedData = JSON.parse(jsonString);
      
      console.log('✅ Math problem solved successfully');
      
      // Transform to match expected format
      return {
        topic: problem,
        summary: parsedData.summary || [],
        quiz: parsedData.quiz || [],
        studyTip: parsedData.studyTip || 'Practice similar problems to master this concept.',
        mathQuestion: parsedData.solution ? {
          question: problem,
          answer: parsedData.solution.answer,
          explanation: parsedData.solution.steps ? parsedData.solution.steps.join('\n') : parsedData.solution.explanation
        } : undefined,
        isMathSolution: true
      };
      
    } catch (error) {
      lastError = error;
      console.error(`Math solver attempt ${attempt + 1} failed:`, error.message);
      
      // If it's a 503 or overload error, retry
      if (error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('Service Unavailable')) {
        if (attempt < maxRetries - 1) {
          continue; // Retry
        }
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }
  
  // If all retries failed, return a basic fallback solution
  console.log('⚠️ Gemini failed after retries, using basic fallback...');
  return generateBasicMathSolution(problem);
}

// Basic fallback solution when Gemini is unavailable
function generateBasicMathSolution(problem) {
  console.log('📝 Generating basic math solution...');
  
  // Try to solve simple arithmetic
  let answer = 'Unable to solve automatically';
  let steps = [];
  
  // Check for simple mean/average calculation
  const meanMatch = problem.match(/mean|average.*?(\d+(?:\s*,\s*\d+)+)/i);
  if (meanMatch) {
    const numbers = meanMatch[1].split(',').map(n => parseFloat(n.trim()));
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    answer = mean.toString();
    steps = [
      `Add all numbers: ${numbers.join(' + ')} = ${sum}`,
      `Count the numbers: ${numbers.length} numbers`,
      `Divide sum by count: ${sum} ÷ ${numbers.length} = ${mean}`
    ];
  }
  
  // Check for simple arithmetic
  const arithmeticMatch = problem.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
  if (arithmeticMatch && steps.length === 0) {
    const num1 = parseFloat(arithmeticMatch[1]);
    const operator = arithmeticMatch[2];
    const num2 = parseFloat(arithmeticMatch[3]);
    
    switch (operator) {
      case '+':
        answer = (num1 + num2).toString();
        steps = [`Add the numbers: ${num1} + ${num2} = ${answer}`];
        break;
      case '-':
        answer = (num1 - num2).toString();
        steps = [`Subtract: ${num1} - ${num2} = ${answer}`];
        break;
      case '*':
        answer = (num1 * num2).toString();
        steps = [`Multiply: ${num1} × ${num2} = ${answer}`];
        break;
      case '/':
        answer = (num1 / num2).toString();
        steps = [`Divide: ${num1} ÷ ${num2} = ${answer}`];
        break;
    }
  }
  
  // Check for simple linear equation: ax + b = c
  const equationMatch = problem.match(/(\d+)x\s*\+\s*(\d+)\s*=\s*(\d+)/i);
  if (equationMatch && steps.length === 0) {
    const a = parseFloat(equationMatch[1]);
    const b = parseFloat(equationMatch[2]);
    const c = parseFloat(equationMatch[3]);
    const x = (c - b) / a;
    answer = `x = ${x}`;
    steps = [
      `Start with: ${a}x + ${b} = ${c}`,
      `Subtract ${b} from both sides: ${a}x = ${c - b}`,
      `Divide by ${a}: x = ${x}`
    ];
  }
  
  return {
    topic: problem,
    summary: [
      'This is a basic solution generated without AI assistance.',
      steps.length > 0 ? 'The problem has been solved using basic arithmetic.' : 'For complex problems, please try again when the AI service is available.',
      `Answer: ${answer}`
    ],
    quiz: [
      {
        question: 'What type of problem is this?',
        options: ['A) Mathematical problem', 'B) History question', 'C) Science question', 'D) Literature question'],
        correctAnswer: 'A'
      },
      {
        question: 'Why might the AI service be unavailable?',
        options: ['A) High server load', 'B) Maintenance', 'C) Network issues', 'D) All of the above'],
        correctAnswer: 'D'
      },
      {
        question: 'What should you do if the service is unavailable?',
        options: ['A) Try again later', 'B) Check your internet connection', 'C) Verify the problem format', 'D) All of the above'],
        correctAnswer: 'D'
      }
    ],
    studyTip: 'For complex math problems, try breaking them down into smaller steps. If the AI service is unavailable, you can use online calculators or math tools as alternatives.',
    mathQuestion: steps.length > 0 ? {
      question: problem,
      answer: answer,
      explanation: steps.join('\n')
    } : undefined,
    isMathSolution: true,
    isBasicFallback: true
  };
}
