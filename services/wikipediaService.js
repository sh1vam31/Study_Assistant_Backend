export async function fetchWikipediaSummary(topic) {
  const encodedTopic = encodeURIComponent(topic);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTopic}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Topic "${topic}" not found on Wikipedia`);
    }
    throw new Error(`Wikipedia API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    title: data.title,
    extract: data.extract,
    content_urls: data.content_urls
  };
}

// Generate study material from Wikipedia content only (no AI needed)
export function generateFromWikipedia(topic, wikiExtract, mode) {
  console.log('Generating study material from Wikipedia only (no AI)');
  
  // Split extract into sentences
  const sentences = wikiExtract
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
  
  // Create 3-point summary from first 3 sentences
  const summary = sentences.slice(0, 3).map(s => s + '.');
  
  // Generate quiz questions from the content
  const quiz = generateQuizFromText(topic, sentences);
  
  // Generate study tip
  const studyTip = `To learn about ${topic}, start by understanding the key concepts in the summary above. Try to explain each point in your own words, and use the quiz to test your understanding.`;
  
  // Generate math question if in math mode
  const mathQuestion = mode === 'math' ? generateMathQuestion(topic, sentences) : undefined;
  
  return {
    summary,
    quiz,
    studyTip,
    mathQuestion
  };
}

function generateQuizFromText(topic, sentences) {
  const quiz = [];
  
  // Question 1: About the topic definition
  if (sentences.length > 0) {
    const firstSentence = sentences[0];
    quiz.push({
      question: `What is ${topic} primarily about?`,
      options: [
        `A) ${firstSentence.substring(0, 50)}...`,
        `B) A completely unrelated concept`,
        `C) A type of food`,
        `D) A geographical location`
      ],
      correctAnswer: 'A'
    });
  }
  
  // Question 2: Key concept from second sentence
  if (sentences.length > 1) {
    const words = sentences[1].split(' ').filter(w => w.length > 5);
    const keyWord = words[Math.floor(words.length / 2)] || 'concept';
    
    quiz.push({
      question: `Which of the following is related to ${topic}?`,
      options: [
        `A) ${keyWord}`,
        `B) Unrelated term`,
        `C) Random concept`,
        `D) None of the above`
      ],
      correctAnswer: 'A'
    });
  }
  
  // Question 3: General understanding
  quiz.push({
    question: `Based on the summary, ${topic} is best described as:`,
    options: [
      `A) A concept explained in the summary above`,
      `B) Something completely different`,
      `C) A fictional idea`,
      `D) An unrelated topic`
    ],
    correctAnswer: 'A'
  });
  
  return quiz;
}

function generateMathQuestion(topic, sentences) {
  // Simple math question related to the topic
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = num1 + num2;
  
  return {
    question: `If you study ${topic} for ${num1} hours today and ${num2} hours tomorrow, how many total hours will you have studied?`,
    answer: answer.toString(),
    explanation: `Add the hours together: ${num1} + ${num2} = ${answer} hours total.`
  };
}
