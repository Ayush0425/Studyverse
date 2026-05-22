import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PomodoroTimer from '../components/PomodoroTimer';
import api from '../services/api';
import { 
  Flame, 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  Plus, 
  Check, 
  Trash2, 
  Quote 
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your talent determines what you can do. Your motivation determines how much you are willing to do.", author: "Lou Holtz" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
];

const Dashboard = () => {
  const { user, updateSubjects } = useAuth();
  const [stats, setStats] = useState(null);
  const [notesCount, setNotesCount] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quote, setQuote] = useState({ text: '', author: '' });
  
  // Custom onboarding subjects state
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [customSubject, setCustomSubject] = useState('');
  const [savingSubjects, setSavingSubjects] = useState(false);

  const SUBJECT_PRESETS = [
    'DSA', 
    'Web Technology', 
    'DBMS', 
    'Python', 
    'Machine Learning', 
    'Computer Networks', 
    'Operating Systems', 
    'Mathematics'
  ];

  const handleSaveSubjects = async () => {
    if (selectedSubjects.length === 0) {
      alert('Please select or add at least one subject!');
      return;
    }
    setSavingSubjects(true);
    try {
      await updateSubjects(selectedSubjects);
    } catch (err) {
      console.error('Failed to update subjects:', err);
    } finally {
      setSavingSubjects(false);
    }
  };

  const handleAddCustomSubject = (e) => {
    e.preventDefault();
    const trimmed = customSubject.trim();
    if (trimmed && !selectedSubjects.includes(trimmed)) {
      setSelectedSubjects([...selectedSubjects, trimmed]);
      setCustomSubject('');
    }
  };
  
  // Local task list states (saved in localStorage)
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('studyverse_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Review DSA Graphs & Trees', completed: false },
      { id: 2, text: 'Build API routes for Auth', completed: true },
      { id: 3, text: 'Complete Web Tech assignment', completed: false },
    ];
  });
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    // Select daily random quote
    const index = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[index]);

    const fetchDashboardData = async () => {
      try {
        // Fetch focus statistics
        const focusData = await api.get('/focus/stats');
        setStats(focusData);

        // Fetch notes count
        const notes = await api.get('/notes');
        setNotesCount(notes.length);

        // Fetch quiz performance
        const quizzes = await api.get('/quizzes');
        if (quizzes.length > 0) {
          const totalScore = quizzes.reduce((acc, q) => acc + (q.score / q.totalQuestions), 0);
          setQuizScore(Math.round((totalScore / quizzes.length) * 100));
        } else {
          setQuizScore(0);
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Sync tasks to localStorage
  useEffect(() => {
    localStorage.setItem('studyverse_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: newTaskText, completed: false }
    ]);
    setNewTaskText('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Mock charts if loading stats is empty
  const defaultChartLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const defaultChartData = [1.2, 2.5, 0.8, 3.4, 1.5, 0.0, 2.0];
  const defaultSubjects = ['DSA', 'Web Tech', 'DBMS', 'Python'];
  const defaultSubjectTimes = [120, 90, 45, 60];

  const barChartData = {
    labels: stats?.weeklyHours?.labels || defaultChartLabels,
    datasets: [
      {
        label: 'Hours Studied',
        data: stats?.weeklyHours?.data || defaultChartData,
        backgroundColor: 'rgba(157, 78, 221, 0.6)',
        borderColor: '#9D4EDD',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const doughnutChartData = {
    labels: stats?.subjectBreakdown?.labels.length ? stats.subjectBreakdown.labels : defaultSubjects,
    datasets: [
      {
        data: stats?.subjectBreakdown?.data.length ? stats.subjectBreakdown.data : defaultSubjectTimes,
        backgroundColor: [
          'rgba(157, 78, 221, 0.65)',
          'rgba(0, 240, 255, 0.65)',
          'rgba(255, 0, 122, 0.65)',
          'rgba(255, 159, 64, 0.65)',
        ],
        borderColor: [
          '#9D4EDD',
          '#00F0FF',
          '#FF007A',
          '#FF9F40',
        ],
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { color: 'rgba(157, 78, 221, 0.05)' }, ticks: { color: '#9B8CB4' } },
      y: { grid: { color: 'rgba(157, 78, 221, 0.05)' }, ticks: { color: '#9B8CB4' } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#F1EBF9', font: { size: 11 } },
      },
    },
  };

  return (
    <div className="flex-1 min-h-screen bg-brand-bg px-8 py-8 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Welcome Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-text tracking-wide">
            Hi, {user?.name || 'Ayush'} 👋
          </h1>
          <p className="text-brand-textMuted text-sm mt-1">
            Ready to break limits today? Let's check your focus.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-brand-accent/20 bg-brand-surface/40 p-3 rounded-2xl">
          <TrendingUp className="w-5 h-5 text-brand-neonCyan" />
          <span className="text-sm font-semibold text-brand-text">
            Today's Focus:{' '}
            <span className="text-brand-neonCyan">
              {user?.subjects && user.subjects.length > 0 
                ? user.subjects.slice(0, 3).join(' + ') + (user.subjects.length > 3 ? '...' : '')
                : 'General Study'}
            </span>
          </span>
        </div>
      </div>

      {/* Streaks & KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-brand-neonPink/15 border border-brand-neonPink/30 flex items-center justify-center text-brand-neonPink shadow-neon-pink">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-xs text-brand-textMuted font-semibold uppercase tracking-wider block">Study Streak</span>
            <span className="text-2xl font-black text-brand-text mt-0.5">{user?.streak || 0} days</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-neonPurple/15 border border-brand-neonPurple/30 flex items-center justify-center text-brand-neonPurple shadow-neon-purple">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-brand-textMuted font-semibold uppercase tracking-wider block">Notes Uploaded</span>
            <span className="text-2xl font-black text-brand-text mt-0.5">{notesCount}</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-neonCyan/15 border border-brand-neonCyan/30 flex items-center justify-center text-brand-neonCyan shadow-neon-cyan">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-brand-textMuted font-semibold uppercase tracking-wider block">Quiz Accuracy</span>
            <span className="text-2xl font-black text-brand-text mt-0.5">{quizScore}%</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Quote className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-brand-textMuted font-semibold uppercase tracking-wider block">Completed Focus</span>
            <span className="text-2xl font-black text-brand-text mt-0.5">{stats?.summary?.sessionsCount || 0} sessions</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Timer & Deadlines */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          {/* Pomodoro Timer Compact */}
          <PomodoroTimer compact={true} onSessionCompleted={() => {}} />

          {/* Today's Tasks */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col h-[320px]">
            <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center justify-between">
              <span>Today's Tasks</span>
              <span className="text-[11px] bg-brand-accent/20 border border-brand-accent/30 text-brand-neonPurple px-2.5 py-0.5 rounded-full font-bold">
                {tasks.filter(t => !t.completed).length} Left
              </span>
            </h3>

            {/* Tasks scrollable container */}
            <div className="flex-1 overflow-y-auto mb-4 pr-1 flex flex-col gap-2.5">
              {tasks.length === 0 ? (
                <div className="text-center text-brand-textMuted text-xs my-auto">
                  All done! Add some tasks below.
                </div>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                      task.completed 
                        ? 'bg-brand-surface/20 border-brand-accent/5 opacity-50' 
                        : 'bg-brand-surface/50 border-brand-accent/15 hover:border-brand-accent/30'
                    }`}
                  >
                    <div 
                      onClick={() => toggleTask(task.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        task.completed 
                          ? 'bg-brand-neonPurple border-brand-neonPurple text-white' 
                          : 'border-brand-textMuted/40 hover:border-brand-neonPurple'
                      }`}>
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <span className={`text-xs text-brand-text font-medium ${task.completed ? 'line-through' : ''}`}>
                        {task.text}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-brand-textMuted hover:text-brand-neonPink p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Task Add Form */}
            <form onSubmit={addTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs"
              />
              <button 
                type="submit"
                className="p-2.5 rounded-xl bg-brand-accent hover:bg-brand-neonPurple text-white transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Columns: Analytics & Quote */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Study Hours */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col h-[280px]">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-brand-textMuted mb-4">
                Weekly Study Time (Hours)
              </h3>
              <div className="flex-1 relative">
                <Bar data={barChartData} options={barOptions} />
              </div>
            </div>

            {/* Subject Distribution */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col h-[280px]">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-brand-textMuted mb-4">
                Subject Focus (Minutes)
              </h3>
              <div className="flex-1 relative flex items-center justify-center">
                <Doughnut data={doughnutChartData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Daily Quote Card */}
          <div className="glass-panel p-6 rounded-3xl bg-radial-glow relative overflow-hidden flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-accent/25 border border-brand-accent/30 flex items-center justify-center text-brand-neonPurple flex-shrink-0 animate-float">
              <Quote className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold italic text-brand-text leading-relaxed">
                "{quote.text}"
              </p>
              <span className="text-xs text-brand-neonCyan font-bold tracking-wide uppercase mt-1 block">
                — {quote.author}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Onboarding Modal */}
      {user && (!user.subjects || user.subjects.length === 0) && (
        <div className="fixed inset-0 bg-brand-bg/90 backdrop-filter backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg glass-panel-heavy rounded-3xl p-8 shadow-glass-glow relative border border-brand-accent/20 animate-fade-in">
            <div className="flex flex-col items-center text-center mb-6">
              <BookOpen className="w-12 h-12 text-brand-neonPurple mb-3 animate-pulse-glow" />
              <h2 className="text-2xl font-extrabold text-brand-text tracking-wide">
                Welcome to Studyverse! 📚
              </h2>
              <p className="text-brand-textMuted text-xs mt-1.5 max-w-sm leading-relaxed">
                Let's personalize your portal. Which subjects are you studying this semester? (Select at least one)
              </p>
            </div>

            {/* Preset selection grid */}
            <div className="flex flex-wrap gap-2.5 justify-center mb-6">
              {SUBJECT_PRESETS.map((preset) => {
                const isSelected = selectedSubjects.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSubjects(selectedSubjects.filter(s => s !== preset));
                      } else {
                        setSelectedSubjects([...selectedSubjects, preset]);
                      }
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
                      isSelected
                        ? 'bg-brand-neonPurple/25 border-brand-neonPurple text-brand-neonPurple shadow-neon-purple scale-105'
                        : 'bg-brand-surface/40 border-brand-accent/15 text-brand-textMuted hover:text-brand-text hover:border-brand-accent/30'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            {/* Custom subject input */}
            <form onSubmit={handleAddCustomSubject} className="flex gap-2 mb-6">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Add custom subject (e.g. History)"
                className="flex-1 px-4 py-3 rounded-xl glass-input text-xs"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-brand-surface border border-brand-accent/25 text-brand-neonPurple text-xs font-bold hover:bg-brand-accent/10 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>

            {/* Selected Subjects list */}
            {selectedSubjects.length > 0 && (
              <div className="mb-6">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-textMuted block mb-2 text-center">Selected Subjects</span>
                <div className="flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto p-1.5 rounded-xl bg-brand-bg/35 border border-brand-accent/10">
                  {selectedSubjects.map(sub => (
                    <span 
                      key={sub}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-lg text-xs text-brand-text"
                    >
                      {sub}
                      <button 
                        type="button" 
                        onClick={() => setSelectedSubjects(selectedSubjects.filter(s => s !== sub))}
                        className="text-brand-neonPink hover:text-white font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Save Action Button */}
            <button
              type="button"
              onClick={handleSaveSubjects}
              disabled={savingSubjects || selectedSubjects.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-accent to-brand-neonPurple text-white text-xs font-bold tracking-wider uppercase shadow-glass transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer text-center block"
            >
              {savingSubjects ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
