import { fetchWikipediaSummary } from '../services/wikipediaService.js';
import { generateStudyContent } from '../services/openaiService.js';
import { isMathProblem, solveMathProblem } from '../services/mathSolverService.js';
import { isWhatIsQuestion, extractTopicFromQuestion, generate7WsAndHow } from '../services/questionAnalyzerService.js';
import StudyHistory from '../models/StudyHistory.js';

export async function getStudyMaterial(req, res) {
  try {
    const { topic, mode = 'normal' } = req.query;
    const userId = req.user?.userId;

    console.log(`Study request: topic="${topic}", mode="${mode}", userId="${userId}"`);

    if (!topic) {
      return res.status(400).json({ error: 'Topic parameter is required' });
    }

    // Check if it's a "What is..." type question
    if (isWhatIsQuestion(topic)) {
      console.log('📝 Detected "What is..." question, using 7 W\'s framework...');
      const extractedTopic = extractTopicFromQuestion(topic);
      
      try {
        // Fetch Wikipedia data for the extracted topic
        const wikiData = await fetchWikipediaSummary(extractedTopic);
        
        // Generate 7 W's and How framework answer
        const frameworkAnswer = generate7WsAndHow(extractedTopic, wikiData.extract);
        
        const responseData = {
          ...frameworkAnswer,
          wikipediaUrl: wikiData.content_urls?.desktop?.page,
        };
        
        // Send response immediately
        res.json(responseData);
        
        // Save to history asynchronously
        if (userId) {
          const historyEntry = new StudyHistory({
            userId,
            topic: extractedTopic,
            mode: 'framework',
            studyData: {
              summary: frameworkAnswer.summary,
              quiz: frameworkAnswer.quiz,
              studyTip: frameworkAnswer.studyTip,
              wikipediaUrl: wikiData.content_urls?.desktop?.page
            }
          });
          historyEntry.save()
            .then(() => console.log('History saved successfully'))
            .catch(err => console.error('Failed to save history:', err));
        }
        
        return;
      } catch (error) {
        console.error('Framework generation failed:', error.message);
        // Continue to regular flow if framework fails
      }
    }
    
    // Check if it's a direct math problem
    if (isMathProblem(topic)) {
      console.log('🧮 Detected math problem, solving directly...');
      const mathSolution = await solveMathProblem(topic, mode);
      
      // Send response immediately
      res.json(mathSolution);
      
      // Save to history asynchronously (don't wait)
      if (userId) {
        const historyEntry = new StudyHistory({
          userId,
          topic: topic,
          mode: 'math',
          studyData: {
            summary: mathSolution.summary,
            quiz: mathSolution.quiz,
            studyTip: mathSolution.studyTip,
            mathQuestion: mathSolution.mathQuestion
          }
        });
        historyEntry.save()
          .then(() => console.log('History saved successfully'))
          .catch(err => console.error('Failed to save history:', err));
      }
      
      return;
    }

    // Regular Wikipedia-based flow
    console.log('Fetching Wikipedia data...');
    const wikiData = await fetchWikipediaSummary(topic);
    console.log('Wikipedia data fetched successfully');
    
    // Generate AI content
    console.log('Generating AI content...');
    const studyContent = await generateStudyContent(
      topic, 
      wikiData.extract, 
      mode
    );
    console.log('AI content generated successfully');

    const responseData = {
      topic: wikiData.title,
      wikipediaUrl: wikiData.content_urls?.desktop?.page,
      ...studyContent
    };

    // Send response immediately
    res.json(responseData);

    // Save to history asynchronously (don't wait)
    if (userId) {
      const historyEntry = new StudyHistory({
        userId,
        topic: wikiData.title,
        mode,
        studyData: {
          summary: studyContent.summary,
          quiz: studyContent.quiz,
          studyTip: studyContent.studyTip,
          mathQuestion: studyContent.mathQuestion,
          wikipediaUrl: wikiData.content_urls?.desktop?.page
        }
      });
      historyEntry.save()
        .then(() => console.log('History saved successfully'))
        .catch(err => console.error('Failed to save history:', err));
    }

  } catch (error) {
    console.error('Error in getStudyMaterial:', error.message);
    console.error('Stack:', error.stack);
    
    // Send more specific error messages
    if (error.message.includes('not found on Wikipedia')) {
      return res.status(404).json({ 
        error: 'Topic not found',
        message: error.message 
      });
    }
    
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        error: 'API configuration error',
        message: 'Please contact administrator' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate study material',
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred while generating content' 
        : error.message 
    });
  }
}

export async function getStudyHistory(req, res) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const history = await StudyHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('topic mode createdAt');

    res.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

export async function deleteStudyHistory(req, res) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await StudyHistory.deleteMany({ userId });

    res.json({ message: 'History cleared successfully' });
  } catch (error) {
    console.error('Error deleting history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
}
