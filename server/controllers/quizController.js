import { GoogleGenerativeAI } from '@google/generative-ai';
import Note from '../models/Note.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';

// Init Gemini AI (if key is present)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

// Mock quiz generator fallback helper
const generateMockQuiz = (title) => {
  return [
    {
      question: `What is the primary topic of ${title}?`,
      options: ["Core Concepts", "Advanced Theories", "Historical Context", "Practical Utilities"],
      answer: "Core Concepts",
      type: "mcq"
    },
    {
      question: `True or False: Mastering ${title} is crucial for web developers and software engineers.`,
      options: ["True", "False"],
      answer: "True",
      type: "tf"
    },
    {
      question: `Define the primary goal or purpose of ${title} in one sentence.`,
      options: [],
      answer: "To organize, manage, and optimize resource performance effectively.",
      type: "short"
    },
    {
      question: `Which of the following is a common issue when dealing with ${title}?`,
      options: ["Resource leak", "Infinite efficiency", "Perfect compatibility", "Instant compilation"],
      answer: "Resource leak",
      type: "mcq"
    },
    {
      question: `True or False: ${title} only applies to small-scale application scenarios.`,
      options: ["True", "False"],
      answer: "False",
      type: "tf"
    }
  ];
};

// @desc    Generate a quiz from a note
// @route   POST /api/quizzes/generate
// @access  Private
export const generateQuiz = async (req, res) => {
  const { noteId } = req.body;

  try {
    const note = await Note.findOne({ _id: noteId, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    let questions = [];
    const ai = getGeminiClient();

    if (!ai) {
      console.log('No GEMINI_API_KEY found. Generating mock quiz instead.');
      questions = generateMockQuiz(note.title);
    } else {
      try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        let textContent = note.content;
        if (note.fileType !== 'text') {
          textContent = `Note file URL: ${note.content}. This note is about: ${note.title}. Please generate questions directly related to ${note.title}.`;
        }

        const prompt = `
          You are an expert AI quiz generator. Generate a study quiz based on the text below. 
          Create 5 distinct questions: 2 Multiple Choice Questions (mcq), 2 True/False (tf), and 1 Short Answer (short).
          
          Respond ONLY with a valid JSON array matching this exact format:
          [
            {
              "question": "Question text here?",
              "options": ["Option A", "Option B", "Option C", "Option D"], // Provide 4 options for mcq. For true/false provide ["True", "False"]. For short, provide empty array.
              "answer": "Option A", // The exact correct option text for mcq and tf. For short, provide a brief correct definition or keyphrase.
              "type": "mcq" // "mcq", "tf", or "short"
            }
          ]

          Text to generate quiz from:
          ${textContent.substring(0, 4000)}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean JSON response (strip markdown wrappers if model outputted them)
        let cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        questions = JSON.parse(cleaned);
      } catch (err) {
        console.error('Gemini API execution failed, falling back to mock generator:', err);
        questions = generateMockQuiz(note.title);
      }
    }

    // Save initial quiz structure (before scoring)
    const quiz = await Quiz.create({
      title: `${note.title} AI Quiz`,
      user: req.user._id,
      note: note._id,
      questions,
      totalQuestions: questions.length,
    });

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit quiz score and update user stats
// @route   POST /api/quizzes/submit
// @access  Private
export const submitQuiz = async (req, res) => {
  const { quizId, score } = req.body;

  try {
    const quiz = await Quiz.findOne({ _id: quizId, user: req.user._id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    quiz.score = score;
    await quiz.save();

    // Award XP: 10 XP for completing + 10 XP per correct answer
    const user = await User.findById(req.user._id);
    const xpEarned = 10 + (score * 10);
    user.xp += xpEarned;

    // Check level up
    const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
    const leveledUp = newLevel > user.level;
    user.level = newLevel;

    // Badge triggers
    let badgeEarned = null;
    const newBadges = [...user.badges];
    
    // Perfect score badge
    if (score === quiz.totalQuestions && !newBadges.includes('quiz_perfect')) {
      newBadges.push('quiz_perfect');
      badgeEarned = 'quiz_perfect';
    }

    // First quiz complete badge
    if (!newBadges.includes('quiz_starter')) {
      newBadges.push('quiz_starter');
      if (!badgeEarned) badgeEarned = 'quiz_starter';
    }

    user.badges = newBadges;
    user.lastActive = new Date();
    await user.save();

    res.json({
      message: 'Quiz submitted successfully',
      score,
      xpEarned,
      newXp: user.xp,
      newLevel: user.level,
      leveledUp,
      badgeEarned,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user quiz history
// @route   GET /api/quizzes
// @access  Private
export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
