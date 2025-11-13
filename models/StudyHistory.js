import mongoose from 'mongoose';

const studyHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ['normal', 'math'],
    default: 'normal'
  },
  studyData: {
    summary: [String],
    quiz: [{
      question: String,
      options: [String],
      correctAnswer: String
    }],
    studyTip: String,
    mathQuestion: {
      question: String,
      answer: String,
      explanation: String
    },
    wikipediaUrl: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
studyHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('StudyHistory', studyHistorySchema);
