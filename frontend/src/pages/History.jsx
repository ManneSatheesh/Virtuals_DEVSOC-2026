import { useState, useEffect } from 'react';
import { Clock, MessageCircle, TrendingUp, History as HistoryIcon, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { QUESTIONS } from './Questionnaire';

const moodColor = {
  Energized: 'bg-green-100 text-green-700 border-green-200',
  Calm: 'bg-blue-100 text-blue-700 border-blue-200',
  Concerned: 'bg-amber-100 text-amber-700 border-amber-200',
  Distressed: 'bg-red-100 text-red-700 border-red-200',
  Neutral: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function History() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [questionnaire, setQuestionnaire] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadHistoryData();
  }, [user]);

  async function loadHistoryData() {
    try {
      setLoading(true);

      // 1. Load Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // 2. Load Questionnaire Responses
      const { data: questionnaireData } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      setQuestionnaire(questionnaireData || []);

      // 3. Load Sessions
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      // 4. For each session, load messages
      const sessionsWithMessages = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

          return {
            ...session,
            messages: messages || []
          };
        })
      );

      setSessions(sessionsWithMessages);
    } catch (err) {
      console.error('Error loading history:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggle = (id) => setSelectedId(selectedId === id ? null : id);

  // Build profile object from questionnaire responses for display
  const profileDisplay = questionnaire.reduce((acc, q) => {
    acc[q.question_id] = q.answer;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-10 max-w-3xl mx-auto">
        <p className="text-text-muted">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-3xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-400 rounded-2xl flex items-center justify-center shadow-warm">
          <HistoryIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">History & Profile</h1>
          <p className="mt-1 text-text-muted font-medium">
            Your past interactions and personal preferences.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="mb-10">
          <div
            onClick={() => setShowProfile(!showProfile)}
            className={`bg-white border-2 rounded-3xl p-7 shadow-warm transition-all cursor-pointer ${showProfile ? 'border-primary ring-4 ring-primary/5' : 'border-orange-100 hover:shadow-warm-lg hover:-translate-y-1'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-orange rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-main">{profile.name || 'My Profile'}</h2>
                  <p className="text-sm text-text-muted">{profile.email}</p>
                </div>
              </div>
              {showProfile ? <ChevronUp className="text-primary w-5 h-5" /> : <ChevronDown className="text-gray-300 w-5 h-5" />}
            </div>

            {showProfile && (
              <div className="mt-6 pt-6 border-t border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                <div className="border-b border-orange-50 pb-4">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Age</p>
                  <p className="text-base font-medium text-text-main">{profile.age || 'Not specified'}</p>
                </div>
                <div className="border-b border-orange-50 pb-4">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Support Type</p>
                  <p className="text-base font-medium text-text-main">{profile.support_type || 'Not specified'}</p>
                </div>
                {QUESTIONS.map((q) => {
                  const answer = profileDisplay[q.id];
                  if (!answer) return null;
                  return (
                    <div key={q.id} className="border-b border-orange-50 last:border-0 pb-4 last:pb-0">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{q.question}</p>
                      <p className="text-base font-medium text-text-main leading-relaxed">
                        {Array.isArray(answer) ? answer.join(', ') : answer}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-text-main px-2">Recent Sessions ({sessions.length})</h2>

        {sessions.length === 0 ? (
          <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center">
            <p className="text-text-muted font-medium">No sessions recorded yet.</p>
          </div>
        ) : (
          sessions.map((s) => {
            const isOpen = selectedId === s.id;
            const date = new Date(s.started_at);
            const duration = s.duration_seconds ? `${Math.round(s.duration_seconds / 60)}m` : 'N/A';
            const transcript = s.messages
              .map(m => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`)
              .join('\n\n');

            return (
              <div
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`bg-white border-2 rounded-3xl p-7 shadow-warm transition-all cursor-pointer ${isOpen ? 'border-primary ring-4 ring-primary/5' : 'border-orange-100 hover:shadow-warm-lg hover:-translate-y-1'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Clock className="w-4 h-4" />
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-muted bg-accent-orange px-3 py-1 rounded-full">{s.mode}</span>
                    <span className="text-sm font-medium text-text-muted bg-accent-orange px-3 py-1 rounded-full">{duration}</span>
                  </div>
                </div>

                <p className="mt-4 text-base text-text-main flex items-start gap-3 leading-relaxed font-medium">
                  <MessageCircle className="w-5 h-5 text-orange-300 mt-0.5 shrink-0" />
                  {s.transcript_summary || `${s.messages.length} messages exchanged`}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {s.mood_summary && (
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border ${moodColor[s.mood_summary] || moodColor.Neutral
                          }`}
                      >
                        🎭 {s.mood_summary}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      {s.messages.length} messages
                    </span>
                  </div>

                  {isOpen ? <ChevronUp className="text-primary w-5 h-5" /> : <ChevronDown className="text-gray-300 w-5 h-5" />}
                </div>

                {/* Expanded Transcript */}
                {isOpen && (
                  <div className="mt-6 pt-6 border-t border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Conversation Transcript</h3>
                    <div className="bg-orange-50/50 rounded-2xl p-5 text-sm leading-relaxed text-text-main whitespace-pre-line font-medium border border-orange-100/50">
                      {transcript || 'No transcript available'}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      {s.trend}
                    </span>
                  </div>

                  {isOpen ? <ChevronUp className="text-primary w-5 h-5" /> : <ChevronDown className="text-gray-300 w-5 h-5" />}
                </div>

                {/* Expanded Transcript */}
                {isOpen && (
                  <div className="mt-6 pt-6 border-t border-orange-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Conversation Transcript</h3>
                    <div className="bg-orange-50/50 rounded-2xl p-5 text-sm leading-relaxed text-text-main whitespace-pre-line font-medium border border-orange-100/50">
                      {s.transcript}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
