import { fetchWikipediaSummary } from '../services/wikipediaService.js';
import { generateStudyContent } from '../services/openaiService.js';
import { isMathProblem, solveMathProblem } from '../services/mathSolverService.js';
import StudyHistory from '../models/StudyHistory.js';

export async function getStudyMaterial(req, res) {
  try {
    const { topic, mode = 'normal' } = req.query;
    const userId = req.user?.userId;

    console.log(`Study request: topic="${topic}", mode="${mode}", userId="${userId}"`);

    if (!topic) {
      return res.status(400).json({ error: 'Topic parameter is required' });
    }

    // Check if it's a direct math problem
    if (isMathProblem(topic)) {
      console.log('🧮 Detected math problem, solving directly...');
      const mathSolution = await solveMathProblem(topic, mode);
      
      // Save to history if user is authenticated
      if (userId) {
        try {
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
          await historyEntry.save();
          console.log('History saved successfully');
        } catch (historyError) {
          console.error('Failed to save history:', historyError);
        }
      }
      
      return res.json(mathSolution);
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

    // Save to history if user is authenticated
    if (userId) {
      try {
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
        await historyEntry.save();
        console.log('History saved successfully');
      } catch (historyError) {
        console.error('Failed to save history:', historyError);
        // Don't fail the request if history save fails
      }
    }

    res.json(responseData);

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
