import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const QUESTIONS = [
  {
    id: 1,
    question: 'What should we call you?',
    type: 'text',
    placeholder: 'Enter your name',
  },
  {
    id: 2,
    question: 'How old are you?',
    type: 'number',
    placeholder: 'Enter your age',
  },
  {
    id: 3,
    question: 'Which support would you like to access?',
    type: 'multi',
    options: ['Voice Care', 'Elderly Support'],
  },
  // Set A: Behavioral & Lifestyle (Age <= 40)
  {
    id: 4,
    question: 'How do you usually feel by the end of a workday?',
    type: 'choice',
    options: ['Energized', 'Productive but tired', 'Completely drained', 'Stressed/Overwhelmed'],
  },
  {
    id: 5,
    question: 'How many hours of sleep do you average per night?',
    type: 'choice',
    options: ['7-9 hours', '5-6 hours', 'Irregular/Varies', 'Less than 5 hours'],
  },
  {
    id: 6,
    question: 'When you feel anxious, what is your primary "coping" habit?',
    type: 'choice',
    options: ['Exercise/Yoga', 'Socializing', 'Scrolling Social Media', 'Working more'],
  },
  {
    id: 7,
    question: 'How often do you take a "digital detox" (no phone/PC)?',
    type: 'choice',
    options: ['Weekly', 'Rarely', 'Never', 'Only when I sleep'],
  },
  {
    id: 8,
    question: 'Do you feel like you have a healthy work-life balance?',
    type: 'choice',
    options: ['Yes', 'Mostly', 'No, work dominates', 'I am currently struggling'],
  },
  {
    id: 9,
    question: 'How often do you experience "Brain Fog" or trouble concentrating?',
    type: 'choice',
    options: ['Never', 'Occasionally', 'Daily', 'Mostly during stress'],
  },
  {
    id: 10,
    question: 'Who is your main support system when things get tough?',
    type: 'choice',
    options: ['Family', 'Friends/Partners', 'I handle it alone', 'Professional help'],
  },
  {
    id: 11,
    question: 'How often do you feel "FOMO" (Fear Of Missing Out) while on social media?',
    type: 'choice',
    options: ['Never', 'Sometimes', 'Frequently', 'It affects my mood'],
  },
  {
    id: 12,
    question: 'Do you prioritize physical activity in your week?',
    type: 'choice',
    options: ['4+ times', '1-2 times', 'I want to, but no time', 'Not at all'],
  },
  {
    id: 13,
    question: 'How often do you skip meals due to a busy schedule?',
    type: 'choice',
    options: ['Never', 'Once in a while', 'Often', 'Almost every day'],
  },
  // Set B: Baseline Emotional State (Voice Care > 40)
  {
    id: 14,
    question: 'How would you rate your sleep quality over the last week?',
    type: 'choice',
    options: ['Deep and restful', 'Toss and turn often', 'Hard to fall asleep', 'Wake up too early'],
  },
  {
    id: 15,
    question: 'In the past month, how often have you felt lonely?',
    type: 'choice',
    options: ['Never', 'Rarely', 'Sometimes', 'Most of the time'],
  },
  {
    id: 16,
    question: 'How do you feel when you wake up in the morning?',
    type: 'choice',
    options: ['Eager for the day', 'Just another day', 'A bit tired/low', 'Anxious about the day'],
  },
  {
    id: 17,
    question: 'How often do you speak with friends or family?',
    type: 'choice',
    options: ['Daily', '2-3 times a week', 'Once a week', 'Rarely'],
  },
  {
    id: 18,
    question: 'Do you find yourself forgetting small things (like keys or names) recently?',
    type: 'choice',
    options: ['Not at all', 'Occasionally', 'Often', 'It worries me'],
  },
  {
    id: 19,
    question: 'How often do you feel you lack companionship?',
    type: 'choice',
    options: ['Hardly ever', 'Occasionally', 'Frequently'],
  },
  {
    id: 20,
    question: 'When you feel stressed, what is your first reaction?',
    type: 'choice',
    options: ['I talk to someone', 'I keep it to myself', 'I get frustrated/angry', 'I feel helpless'],
  },
  {
    id: 21,
    question: 'How comfortable are you using technology to stay connected?',
    type: 'choice',
    options: ['Very comfortable', 'I manage okay', 'I find it difficult', 'I avoid it'],
  },
  {
    id: 22,
    question: 'Do you feel your daily routine has a clear purpose?',
    type: 'choice',
    options: ['Yes, definitely', 'Somewhat', 'Not really', 'I feel aimless'],
  },
  {
    id: 23,
    question: 'In the last two weeks, have you lost interest in things you usually enjoy?',
    type: 'choice',
    options: ['No changes', 'A little bit', 'Yes, significantly'],
  },
  // Set C: Elderly Support (New Questions)
  {
    id: 24,
    question: 'How have you been feeling emotionally recently?',
    type: 'choice',
    options: ['Happy', 'Calm', 'Sad', 'Anxious'],
  },
  {
    id: 25,
    question: 'How well are you sleeping at night?',
    type: 'choice',
    options: ['Very well', 'Sometimes disturbed', 'Poor sleep', 'Hardly sleeping'],
  },
  {
    id: 26,
    question: 'How is your appetite lately?',
    type: 'choice',
    options: ['Normal', 'Eating more than usual', 'Eating less than usual', 'No appetite'],
  },
  {
    id: 27,
    question: 'How interested are you in daily activities or hobbies?',
    type: 'choice',
    options: ['Very interested', 'Somewhat interested', 'Little interest', 'No interest'],
  },
  {
    id: 28,
    question: 'How often do you feel lonely?',
    type: 'choice',
    options: ['Never', 'Sometimes', 'Often', 'Always'],
  },
  {
    id: 29,
    question: 'How is your memory and concentration?',
    type: 'choice',
    options: ['Very good', 'Slightly forgetful', 'Often forgetful', 'Very difficult to remember'],
  },
  {
    id: 30,
    question: 'How safe do you feel in your environment?',
    type: 'choice',
    options: ['Very safe', 'Mostly safe', 'Sometimes unsafe', 'Unsafe'],
  },
  {
    id: 31,
    question: 'What is your energy level during the day?',
    type: 'choice',
    options: ['Energetic', 'Normal', 'Tired', 'Very exhausted'],
  },
  {
    id: 32,
    question: 'How do you prefer to spend your time?',
    type: 'choice',
    options: ['With family/friends', 'Group activities', 'Alone sometimes', 'Mostly alone'],
  },
  {
    id: 33,
    question: 'How often do you feel stressed or irritated?',
    type: 'choice',
    options: ['Never', 'Rarely', 'Often', 'Very often'],
  },
];

export default function Questionnaire() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved answers on mount (from Supabase first, localStorage fallback)
  useEffect(() => {
    if (!user?.email) return;

    async function loadAnswers() {
      try {
        // Try Supabase first
        const { data: rows } = await supabase
          .from('questionnaire_responses')
          .select('question_id, answer')
          .eq('user_id', user.id);

        if (rows && rows.length > 0) {
          const loaded = {};
          rows.forEach(r => {
            // Try to parse JSON arrays, otherwise use string
            try {
              loaded[r.question_id] = JSON.parse(r.answer);
            } catch {
              loaded[r.question_id] = r.answer;
            }
          });
          loaded.completed = true;
          setAnswers(loaded);
          return;
        }
      } catch (e) {
        console.warn('Supabase load failed, trying localStorage', e);
      }

      // Fallback to localStorage
      const key = `mindful_profile_${user.email}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setAnswers(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved profile', e);
        }
      } else {
        setAnswers({});
        setDone(false);
        setStep(0);
      }
    }

    loadAnswers();
  }, [user]);

  const saveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);

    const dataToSave = { ...answers };
    if (done) dataToSave.completed = true;

    // 1. localStorage cache
    const key = `mindful_profile_${user.email}`;
    localStorage.setItem(key, JSON.stringify(dataToSave));

    // 2. Save to Supabase
    try {
      // Delete old responses first
      await supabase
        .from('questionnaire_responses')
        .delete()
        .eq('user_id', user.id);

      // Determine which set each question belongs to
      const getSetName = (qId) => {
        if (qId <= 3) return 'intro';
        if (qId <= 13) return 'set_a';
        if (qId <= 23) return 'set_b';
        return 'set_c';
      };

      // Insert all responses
      const rows = QUESTIONS
        .filter(q => dataToSave[q.id] !== undefined)
        .map(q => ({
          user_id: user.id,
          question_id: q.id,
          question_text: q.question,
          answer: typeof dataToSave[q.id] === 'object' ? JSON.stringify(dataToSave[q.id]) : String(dataToSave[q.id]),
          set_name: getSetName(q.id),
        }));

      if (rows.length > 0) {
        await supabase.from('questionnaire_responses').insert(rows);
      }

      // Update profile with name, age, support_type
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: dataToSave[1] || user.name,
        age: parseInt(dataToSave[2]) || null,
        support_type: Array.isArray(dataToSave[3]) ? dataToSave[3].join(', ') : dataToSave[3] || null,
      });

      console.log('✅ Saved questionnaire to Supabase');
    } catch (e) {
      console.error('Supabase save error:', e);
    }

    // 3. Send to AI Memory (Backboard) — keep for AI recall
    try {
      await fetch('http://localhost:3000/api/memory/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'questionnaire',
          content: `User Profile Updated (${user.email}):\n${JSON.stringify(dataToSave, null, 2)}`
        })
      });
    } catch (e) {
      // Non-critical
    }

    setSaving(false);
  };

  // Trigger save when done
  useEffect(() => {
    if (done) {
      saveProfile();
    }
  }, [done]);

  // Read-Only View (Profile Summary)
  // ONLY if completed flag is true
  if (answers.completed && !done && step === 0) {
    return (
      <div className="max-w-2xl mx-auto p-10 min-h-[80vh]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-400 rounded-2xl flex items-center justify-center shadow-warm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-main">Your Profile</span>
          </div>
        </div>

        <div className="space-y-6 bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-8 shadow-warm">
          {QUESTIONS.map((q) => {
            const answer = answers[q.id];
            if (!answer) return null; // Skip unanswered
            return (
              <div key={q.id} className="border-b border-orange-50 last:border-0 pb-4 last:pb-0">
                <p className="text-sm font-semibold text-text-muted mb-1">{q.question}</p>
                <p className="text-lg font-bold text-text-main">
                  {Array.isArray(answer) ? answer.join(', ') : answer}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const current = QUESTIONS[step];

  const set = (val) => setAnswers((prev) => ({ ...prev, [current.id]: val }));

  const toggleMulti = (opt) => {
    const prev = answers[current.id] || [];
    const next = prev.includes(opt)
      ? prev.filter((o) => o !== opt)
      : [...prev, opt];
    set(next);
  };

  const next = () => {
    // 1. Age Logic (ID 2)
    if (current.id === 2) {
      const age = parseInt(answers[2]);
      if (age && age <= 40) {
        setAnswers((prev) => ({ ...prev, 3: ['Voice Care'] }));
        setStep(3); // Start Set A (ID 4)
        return;
      }
    }

    // 2. Support Logic (ID 3)
    if (current.id === 3) {
      const chosen = answers[3] || [];
      const hasVoice = chosen.includes('Voice Care');
      const hasElderly = chosen.includes('Elderly Support');

      if (hasVoice) {
        setStep(13); // Start Set B (ID 14)
        return;
      } else if (hasElderly) {
        setStep(23); // Start Set C (ID 24)
        return;
      }
    }

    // 3. End of Set A (ID 13) -> Finish
    if (current.id === 13) {
      setDone(true);
      return;
    }

    // 4. End of Set B (ID 23) -> Check if we need Set C
    if (current.id === 23) {
      const chosen = answers[3] || [];
      if (chosen.includes('Elderly Support')) {
        setStep(23); // Start Set C (ID 24)
        return;
      } else {
        setDone(true);
        return;
      }
    }

    // 5. End of Set C (ID 33 now) -> Finish
    if (current.id === 33) {
      setDone(true);
      return;
    }

    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setDone(true);
  };

  const prev = () => {
    // 1. If at start of Set A (ID 4, index 3) -> Go back to Age (Index 1)
    if (step === 3 && parseInt(answers[2]) <= 40) {
      setStep(1);
      return;
    }

    // 2. If at start of Set B (ID 14, index 13) -> Go back to Support (Index 2)
    if (step === 13) {
      setStep(2);
      return;
    }

    // 3. If at start of Set C (ID 24, index 23)
    if (step === 23) {
      const chosen = answers[3] || [];
      // If we came from Set B (Voice Care was selected), go back to end of Set B
      if (chosen.includes('Voice Care')) {
        setStep(22);
        return;
      }
      // Else (only Elderly), go back to Support
      setStep(2);
      return;
    }

    setStep(Math.max(0, step - 1));
  };

  // Dynamic progress calculation
  const getProgress = () => {
    // Phase 1: Intro (Name, Age)
    if (step < 2) {
      return { current: step + 1, total: 2, percent: ((step + 1) / 2) * 100 };
    }

    const age = parseInt(answers[2]);

    // Phase 2: Path Selection (Age > 40 only)
    if (step === 2) {
      return { current: 0, total: 0, percent: 50, label: 'Customizing...' };
    }

    // Phase 3: The Questions (Reset count)

    // Path A: Age <= 40 (Set A: 10 Questions, Indices 3-12)
    if (age <= 40) {
      const current = step - 2;
      return { current, total: 10, percent: (current / 10) * 100 };
    }

    // Path B/C: Age > 40
    const chosen = answers[3] || [];
    const hasVoice = chosen.includes('Voice Care');
    const hasElderly = chosen.includes('Elderly Support');

    let total = 0;
    if (hasVoice) total += 10;
    if (hasElderly) total += 10; // Updated to 10 for Set C

    let current = 0;

    // If we are in Set B (Indices 13-22)
    if (step >= 13 && step <= 22) {
      current = step - 12;
    }
    // If we are in Set C (Indices 23-32)
    else if (step >= 23 && step <= 32) {
      const setBOffset = hasVoice ? 10 : 0;
      current = setBOffset + (step - 22);
    }

    return { current, total, percent: (current / total) * 100 };
  };

  const progressInfo = getProgress();

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-warm-lg animate-breathe">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="mt-8 text-3xl font-extrabold text-text-main">All set!</h2>
        <p className="mt-3 text-text-muted max-w-md text-lg">
          Thanks for sharing. The assistant will use your answers to provide more
          personalized support.
        </p>
        <button
          onClick={() => navigate('/ai')}
          className="mt-10 flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-10 py-4 rounded-full font-bold text-lg shadow-warm-lg transition-all cursor-pointer"
        >
          Talk to AI Assistant
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-400 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-text-main">Personalization</span>
      </div>

      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between text-sm text-text-muted font-semibold mb-2">
          {progressInfo.label ? (
            <span>{progressInfo.label}</span>
          ) : (
            <span>Question {progressInfo.current} of {progressInfo.total}</span>
          )}
          <span>{Math.round(progressInfo.percent)}%</span>
        </div>
        <div className="w-full h-3 bg-orange-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ width: `${progressInfo.percent}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-2xl font-extrabold text-text-main">{current.question}</h2>

      <div className="mt-8 space-y-4">
        {(current.type === 'text' || current.type === 'number') && (
          <input
            type={current.type}
            value={answers[current.id] || ''}
            onChange={(e) => set(e.target.value)}
            placeholder={current.placeholder}
            className="w-full border-2 border-orange-200 rounded-2xl px-5 py-4 text-base font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
        )}

        {current.type === 'choice' &&
          current.options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                set(opt);
                // Auto-advance after a short delay for visual feedback
                setTimeout(() => next(), 300);
              }}
              className={`w-full text-left px-6 py-4 rounded-2xl text-base font-semibold border-2 transition-all cursor-pointer ${answers[current.id] === opt
                ? 'border-primary bg-gradient-to-r from-primary to-orange-400 text-white shadow-warm'
                : 'border-orange-200 hover:border-primary bg-white text-text-main'
                }`}
            >
              {opt}
            </button>
          ))}

        {current.type === 'multi' && (
          <div className="flex flex-wrap gap-3">
            {current.options.map((opt) => {
              const selected = (answers[current.id] || []).includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleMulti(opt)}
                  className={`px-5 py-3 rounded-full text-sm font-bold border-2 transition-all cursor-pointer ${selected
                    ? 'border-primary bg-gradient-to-r from-primary to-orange-400 text-white shadow-warm'
                    : 'border-orange-200 hover:border-primary bg-white text-text-main'
                    }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="mt-12 flex items-center justify-between">
        <button
          onClick={prev}
          disabled={step === 0}
          className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary disabled:opacity-30 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {/* Only show Next button for text, number, and multi-select */}
        {(current.type === 'text' || current.type === 'number' || current.type === 'multi') && (
          <button
            onClick={next}
            disabled={!answers[current.id] || (Array.isArray(answers[current.id]) && answers[current.id].length === 0)}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary disabled:opacity-40 text-white px-8 py-3 rounded-full text-sm font-bold shadow-warm transition-all cursor-pointer"
          >
            {step === QUESTIONS.length - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
