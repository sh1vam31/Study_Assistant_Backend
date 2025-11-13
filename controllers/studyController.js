import { fetchWikipediaSummary } from '../services/wikipediaService.js';
import { generateStudyContent } from '../services/openaiService.js';
import StudyHistory from '../models/StudyHistory.js';

export async function getStudyMaterial(req, res) {
  try {
    const { topic, mode = 'normal' } = req.query;
    const userId = req.user?.userId;

    if (!topic) {
      return res.status(400).json({ error: 'Topic parameter is required' });
    }

    // Fetch Wikipedia data
    const wikiData = await fetchWikipediaSummary(topic);
    
    // Generate AI content
    const studyContent = await generateStudyContent(
      topic, 
      wikiData.extract, 
      mode
    );

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
      } catch (historyError) {
        console.error('Failed to save history:', historyError);
        // Don't fail the request if history save fails
      }
    }

    res.json(responseData);

  } catch (error) {
    console.error('Error in getStudyMaterial:', error);
    res.status(500).json({ 
      error: 'Failed to generate study material',
      message: error.message 
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
