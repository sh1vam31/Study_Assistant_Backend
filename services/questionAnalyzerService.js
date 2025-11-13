// Detect if the query is a "What is..." type question
export function isWhatIsQuestion(query) {
  const queryLower = query.toLowerCase().trim();
  
  // Patterns for "What is..." questions
  const whatIsPatterns = [
    /^what\s+is\s+/i,
    /^what\s+are\s+/i,
    /^what's\s+/i,
    /^define\s+/i,
    /^explain\s+/i,
    /^describe\s+/i,
    /^tell\s+me\s+about\s+/i,
    /^who\s+is\s+/i,
    /^who\s+are\s+/i,
    /^who's\s+/i,
    /^when\s+is\s+/i,
    /^when\s+was\s+/i,
    /^where\s+is\s+/i,
    /^where\s+are\s+/i,
    /^why\s+is\s+/i,
    /^why\s+are\s+/i,
    /^how\s+does\s+/i,
    /^how\s+do\s+/i,
    /^which\s+is\s+/i,
    /^which\s+are\s+/i,
  ];
  
  return whatIsPatterns.some(pattern => pattern.test(queryLower));
}

// Extract the topic from "What is..." question
export function extractTopicFromQuestion(query) {
  const queryLower = query.toLowerCase().trim();
  
  // Remove question patterns
  let topic = queryLower
    .replace(/^what\s+is\s+/i, '')
    .replace(/^what\s+are\s+/i, '')
    .replace(/^what's\s+/i, '')
    .replace(/^define\s+/i, '')
    .replace(/^explain\s+/i, '')
    .replace(/^describe\s+/i, '')
    .replace(/^tell\s+me\s+about\s+/i, '')
    .replace(/^who\s+is\s+/i, '')
    .replace(/^who\s+are\s+/i, '')
    .replace(/^who's\s+/i, '')
    .replace(/^when\s+is\s+/i, '')
    .replace(/^when\s+was\s+/i, '')
    .replace(/^where\s+is\s+/i, '')
    .replace(/^where\s+are\s+/i, '')
    .replace(/^why\s+is\s+/i, '')
    .replace(/^why\s+are\s+/i, '')
    .replace(/^how\s+does\s+/i, '')
    .replace(/^how\s+do\s+/i, '')
    .replace(/^which\s+is\s+/i, '')
    .replace(/^which\s+are\s+/i, '')
    .replace(/\?+$/, '') // Remove trailing question marks
    .trim();
  
  // Capitalize first letter
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

// Generate 7 W's and How framework content
export function generate7WsAndHow(topic, wikiExtract) {
  console.log('📝 Generating 7 W\'s and How framework...');
  
  // Extract key information from Wikipedia
  const sentences = wikiExtract
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
  
  // Create structured answer using 7 W's and How
  const framework = {
    what: `${topic} is ${sentences[0] || 'a concept that requires further study'}.`,
    why: `Understanding ${topic} is important because it ${sentences[1] ? sentences[1].toLowerCase() : 'helps in various applications'}.`,
    when: sentences.length > 2 ? sentences[2] : `The concept of ${topic} has evolved over time.`,
    where: `${topic} can be found or applied in various contexts and fields.`,
    who: `Researchers, professionals, and students study ${topic}.`,
    which: `Different aspects and types of ${topic} exist depending on the context.`,
    whom: `${topic} affects and benefits various groups of people and organizations.`,
    how: sentences.length > 3 ? sentences[3] : `${topic} works through specific mechanisms and processes.`
  };
  
  // Create summary from framework
  const summary = [
    `WHAT: ${framework.what}`,
    `WHY: ${framework.why}`,
    `HOW: ${framework.how}`
  ];
  
  // Generate quiz based on the framework
  const quiz = [
    {
      question: `What is ${topic}?`,
      options: [
        `A) ${framework.what.substring(0, 60)}...`,
        `B) A type of food or cuisine`,
        `C) A geographical location`,
        `D) A fictional character`
      ],
      correctAnswer: 'A'
    },
    {
      question: `Why is understanding ${topic} important?`,
      options: [
        `A) It has no practical use`,
        `B) ${framework.why.substring(0, 60)}...`,
        `C) It's only for entertainment`,
        `D) It's a historical artifact`
      ],
      correctAnswer: 'B'
    },
    {
      question: `Who studies or uses ${topic}?`,
      options: [
        `A) Only children`,
        `B) Only celebrities`,
        `C) Researchers, professionals, and students`,
        `D) Nobody studies it`
      ],
      correctAnswer: 'C'
    }
  ];
  
  // Study tip
  const studyTip = `To understand ${topic} better, use the 7 W's and How framework: What it is, Why it matters, When it's used, Where it applies, Who uses it, Which types exist, Whom it affects, and How it works. This comprehensive approach helps you grasp the complete picture.`;
  
  return {
    topic,
    summary,
    quiz,
    studyTip,
    framework, // Include the full framework
    isFrameworkAnswer: true
  };
}
