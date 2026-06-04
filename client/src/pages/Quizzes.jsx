import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, HelpCircle, AlertCircle, ArrowRight, Award, CheckCircle, XCircle, RotateCcw, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

const Quizzes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  
  // Available notes to select
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(location.state?.noteId || '');
  const [quizHistory, setQuizHistory] = useState([]);
  
  // Quiz states
  const [quiz, setQuiz] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Session tracking
  const [selectedOption, setSelectedOption] = useState(null); // Selected MCQ/TF index or text
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [shortAnswerUserText, setShortAnswerUserText] = useState('');
  
  // Finish States
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [levelUp, setLevelUp] = useState(false);

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const notesList = await api.get('/notes');
        setNotes(notesList);
        if (notesList.length > 0 && !selectedNoteId) {
          setSelectedNoteId(notesList[0]._id);
        }

        const history = await api.get('/quizzes');
        setQuizHistory(history);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitData();
  }, [user]);

  const handleGenerateQuiz = async () => {
    if (!selectedNoteId) return;
    setGenerating(true);
    setQuiz(null);
    setActiveStep(0);
    setScore(0);
    setFinished(false);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setShortAnswerUserText('');
    
    try {
      const data = await api.post('/quizzes/generate', { noteId: selectedNoteId });
      setQuiz(data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate quiz. Make sure note has sufficient text context.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOptionClick = (option) => {
    if (isAnswerRevealed) return;
    setSelectedOption(option);
    setIsAnswerRevealed(true);
    
    const correctAns = quiz.questions[activeStep].answer;
    if (option === correctAns) {
      setScore(prev => prev + 1);
    }
  };

  const handleShortReveal = () => {
    setIsAnswerRevealed(true);
  };

  const handleShortAnswerEvaluate = (isCorrect) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    // Advance step or complete
    handleNextStep();
  };

  const handleNextStep = () => {
    // Reset answers states
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setShortAnswerUserText('');
    
    if (activeStep < quiz.questions.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    setFinished(true);
    setSubmitting(true);
    
    // Explode confetti
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.55 }
    });

    try {
      const res = await api.post('/quizzes/submit', {
        quizId: quiz._id,
        score
      });
      setXpEarned(res.xpEarned);
      setLevelUp(res.leveledUp);
      
      // Update history
      const history = await api.get('/quizzes');
      setQuizHistory(history);
      await refreshProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuizSession = () => {
    setQuiz(null);
    setFinished(false);
    setActiveStep(0);
    setScore(0);
  };

  return (
    <div className="flex-1 min-h-screen bg-brand-bg px-4 md:px-8 py-6 md:py-8 relative flex">
      {/* Background neon glows */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Area */}
      <div className="flex-1 pr-0 md:pr-4">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-neonCyan to-brand-neonPurple flex items-center justify-center shadow-glass-glow text-white animate-float">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide bg-gradient-to-r from-white via-brand-neonPurple to-brand-neonCyan bg-clip-text text-transparent pb-1">
              AI Quiz Generator
            </h1>
            <p className="text-brand-textMuted text-sm mt-0.5">
              Transform notes into interactive study challenges using Gemini.
            </p>
          </div>
        </div>

        {/* 1. Quiz Generator Setup */}
        {!quiz && !generating && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Control Panel */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-textMuted mb-2">
                  Generate Quiz settings
                </h3>

                {notes.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-brand-neonPink/10 border border-brand-neonPink/25 text-brand-neonPink text-xs leading-normal">
                    You don't have any notes. Create one in the Notes Hub first!
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-brand-textMuted ml-1">SELECT NOTE</label>
                      <select
                        value={selectedNoteId}
                        onChange={(e) => setSelectedNoteId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl glass-input text-xs bg-brand-surface cursor-pointer"
                      >
                        {notes.map(note => (
                          <option key={note._id} value={note._id}>{note.title}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateQuiz}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-brand-neonCyan to-brand-neonPurple text-brand-bg font-black text-xs uppercase tracking-wider shadow-neon-cyan hover:scale-[1.02] transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 fill-current" />
                      Generate AI Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quiz History List */}
            <div className="lg:col-span-2">
              <div className="glass-panel p-6 rounded-3xl min-h-[360px] flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-textMuted mb-4">
                  Past Quizzes History
                </h3>
                
                {quizHistory.length === 0 ? (
                  <div className="my-auto text-center text-brand-textMuted text-xs">
                    You haven't completed any quizzes yet. Generate one above to test your skills!
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {quizHistory.map((q) => (
                      <div 
                        key={q._id}
                        className="flex items-center justify-between p-4 rounded-xl border border-brand-accent/10 bg-brand-surface/40"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-brand-text">{q.title}</h4>
                          <span className="text-[10px] text-brand-textMuted mt-1 block">
                            Attempted on: {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-brand-text">
                            Score: <span className={q.score === q.totalQuestions ? 'text-brand-neonCyan' : 'text-brand-neonPurple'}>{q.score}/{q.totalQuestions}</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-accent/20 border border-brand-accent/30 text-brand-neonPurple font-extrabold uppercase">
                            {Math.round((q.score / q.totalQuestions) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 2. Generating Loading State */}
        {generating && (
          <div className="glass-panel p-6 sm:p-12 rounded-3xl max-w-xl mx-auto text-center flex flex-col items-center justify-center min-h-[350px] sm:min-h-[400px]">
            {/* Pulse generator logo */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-3xl bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-brand-neonPurple shadow-glass animate-ping absolute" />
              <div className="w-16 h-16 rounded-3xl bg-brand-accent border border-brand-accent/50 flex items-center justify-center text-white relative z-10">
                <Sparkles className="w-8 h-8 fill-current" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-brand-text mb-2">Analyzing Study Notes</h3>
            <p className="text-brand-textMuted text-xs max-w-xs mb-4 animate-pulse">
              Gemini is digesting note concepts and formulating customized MCQs, True/False, and short questions...
            </p>
            <span className="text-[10px] uppercase tracking-widest text-brand-neonCyan font-bold">
              Connecting AI core
            </span>
          </div>
        )}

        {/* 3. Active Quiz Question Stepper */}
        {quiz && !finished && (
          <div className="glass-panel p-5 sm:p-8 rounded-3xl max-w-2xl mx-auto flex flex-col justify-between min-h-[400px] sm:min-h-[480px]">
            <div>
              {/* Stepper info */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-brand-accent/15">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-neonCyan block">
                    Active Quiz session
                  </span>
                  <h4 className="font-extrabold text-sm text-brand-text truncate max-w-[150px] sm:max-w-md">{quiz.title}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-brand-text font-semibold font-mono">
                    Question {activeStep + 1} of {quiz.totalQuestions}
                  </span>
                  <div className="w-24 h-1.5 bg-brand-bg rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-brand-neonPurple transition-all"
                      style={{ width: `${((activeStep + 1) / quiz.totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="flex gap-4 items-start mb-6">
                <HelpCircle className="w-6 h-6 text-brand-neonPurple flex-shrink-0 mt-0.5" />
                <h3 className="font-bold text-base text-brand-text">
                  {quiz.questions[activeStep].question}
                </h3>
              </div>

              {/* MCQ & TF OPTIONS */}
              {quiz.questions[activeStep].type !== 'short' ? (
                <div className="flex flex-col gap-3">
                  {quiz.questions[activeStep].options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    const correctAns = quiz.questions[activeStep].answer;
                    const isCorrect = option === correctAns;
                    
                    let cardStyle = 'border-brand-accent/15 bg-brand-surface/40 hover:border-brand-accent/40';
                    let iconNode = null;

                    if (isAnswerRevealed) {
                      if (isCorrect) {
                        cardStyle = 'border-brand-neonCyan bg-brand-neonCyan/10 text-brand-text';
                        iconNode = <CheckCircle className="w-5 h-5 text-brand-neonCyan flex-shrink-0" />;
                      } else if (isSelected) {
                        cardStyle = 'border-brand-neonPink bg-brand-neonPink/10 text-brand-text';
                        iconNode = <XCircle className="w-5 h-5 text-brand-neonPink flex-shrink-0" />;
                      } else {
                        cardStyle = 'border-brand-accent/5 bg-brand-surface/20 opacity-40';
                      }
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => handleOptionClick(option)}
                        className={`flex items-center justify-between p-4 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all duration-300 ${cardStyle}`}
                      >
                        <span>{option}</span>
                        {iconNode}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* SHORT ANSWER WORKSPACE */
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-brand-textMuted ml-1 uppercase">Write your definition / key concept</label>
                    <textarea
                      value={shortAnswerUserText}
                      onChange={(e) => setShortAnswerUserText(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full p-4 rounded-xl glass-input text-xs min-h-[100px] resize-none"
                      disabled={isAnswerRevealed}
                    />
                  </div>

                  {!isAnswerRevealed ? (
                    <button
                      onClick={handleShortReveal}
                      disabled={!shortAnswerUserText.trim()}
                      className="py-3 px-5 rounded-xl bg-gradient-to-r from-brand-neonCyan to-brand-neonPurple text-brand-bg font-black text-xs uppercase tracking-wider shadow-neon-cyan hover:scale-105 transition-all disabled:opacity-40 cursor-pointer self-start"
                    >
                      Compare Answer
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl border border-brand-neonCyan/25 bg-brand-neonCyan/5 flex flex-col gap-3 animate-fade-in">
                      <div className="flex gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-neonCyan flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs text-brand-text uppercase block tracking-wider">Correct AI Keyphrase:</span>
                          <p className="text-xs text-brand-textMuted mt-1">{quiz.questions[activeStep].answer}</p>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-brand-neonCyan/15 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-brand-textMuted uppercase">Did you hit the key concepts? Evaluate honestly:</span>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleShortAnswerEvaluate(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-brand-neonCyan/20 text-brand-neonCyan hover:bg-brand-neonCyan/30 text-xs font-bold rounded-lg border border-brand-neonCyan/35 text-center"
                          >
                            Yes, I was correct! (+1 pt)
                          </button>
                          <button
                            onClick={() => handleShortAnswerEvaluate(false)}
                            className="w-full sm:w-auto px-4 py-2 bg-brand-neonPink/20 text-brand-neonPink hover:bg-brand-neonPink/30 text-xs font-bold rounded-lg border border-brand-neonPink/35 text-center"
                          >
                            No, missed key concepts (0 pt)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stepper Footer Action */}
            {isAnswerRevealed && quiz.questions[activeStep].type !== 'short' && (
              <button
                onClick={handleNextStep}
                className="mt-6 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-brand-neonCyan to-brand-neonPurple text-brand-bg font-black rounded-xl text-xs uppercase tracking-wider shadow-neon-cyan hover:scale-105 transition-all duration-300 self-end cursor-pointer"
              >
                Next Question
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* 4. Complete Quiz Session Overview */}
        {quiz && finished && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md mx-auto text-center flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px]">
            <div className="w-16 h-16 rounded-full bg-brand-neonCyan/15 border border-brand-neonCyan/35 flex items-center justify-center text-brand-neonCyan shadow-neon-cyan mb-4 animate-float">
              <Award className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-brand-text">Quiz Complete!</h2>
            <p className="text-brand-textMuted text-xs mt-1.5">{quiz.title}</p>
            
            <div className="my-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-textMuted block">Your Final Score</span>
              <span className="text-5xl font-black text-brand-text">{score} / {quiz.totalQuestions}</span>
              <span className="block text-brand-neonCyan font-bold text-xs uppercase tracking-widest mt-2">{Math.round((score / quiz.totalQuestions) * 100)}% Accuracy</span>
            </div>

            {submitting ? (
              <span className="text-xs text-brand-textMuted">Uploading session records...</span>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="p-3 bg-brand-surface border border-brand-accent/25 rounded-2xl w-full flex items-center justify-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-brand-neonPurple fill-current" />
                  <span className="text-xs text-brand-text font-bold">XP Awarded: <span className="text-brand-neonCyan font-extrabold">+{xpEarned} XP</span></span>
                </div>

                {levelUp && (
                  <div className="px-4 py-2 bg-gradient-to-r from-brand-neonPurple to-brand-neonPink border border-white/20 text-white text-xs font-black uppercase rounded-full animate-bounce">
                    🎉 LEVEL UP! NEW LEVEL ACHIVED! 🎉
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleGenerateQuiz}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3.5 border border-brand-accent/20 bg-brand-surface/40 hover:text-brand-text text-brand-textMuted rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                  </button>
                  <button
                    onClick={resetQuizSession}
                    className="flex-1 py-3.5 bg-gradient-to-r from-brand-neonCyan to-brand-neonPurple text-brand-bg font-black rounded-xl text-xs uppercase tracking-wider shadow-neon-cyan hover:scale-105 transition-all cursor-pointer"
                  >
                    All Quizzes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quizzes;
