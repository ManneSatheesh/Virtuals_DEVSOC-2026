import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Clock, Bell, TrendingUp, ArrowRight, Sun, Mic } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [lastSession, setLastSession] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [moodTrend, setMoodTrend] = useState('Stable');
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setHasProfile(!!profile);

      // Fetch last session
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(1);

      if (sessions?.length > 0) {
        setLastSession(sessions[0]);
      }

      // Get total session count
      const { count } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      setSessionCount(count || 0);

      // Fetch latest weekly report
      const { data: report } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (report) {
        setWeeklyReport(report);
        setMoodTrend(report.mood_trend || 'Stable');
      }

      // Fetch pending reminders
      const { data: pendingReminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('due_date', { ascending: true })
        .limit(5);

      setReminders(pendingReminders || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  }

  // Get first name for greeting
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Format time since last session
  function formatTimeSince(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="p-10 max-w-5xl mx-auto">
        <p className="text-text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-400 rounded-2xl flex items-center justify-center shadow-warm">
          <Sun className="w-7 h-7 text-white" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <p className="mt-1 text-text-muted font-medium">
            Here's a summary of your well-being journey.
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ActionCard
          icon={<Bot className="w-6 h-6 text-white" />}
          title="Talk to AI"
          desc="Start a conversation"
          onClick={() => navigate('/ai')}
          highlight
        />
        <ActionCard
          icon={<Clock className="w-6 h-6 text-orange-500" />}
          title="Last Session"
          desc={lastSession ? formatTimeSince(lastSession.started_at) : 'No sessions yet'}
        />
        <ActionCard
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          title="Mood Trend"
          desc={moodTrend}
        />
        <ActionCard
          icon={<Bell className="w-6 h-6 text-secondary" />}
          title="Reminders"
          desc={`${reminders.length} pending`}
        />
      </div>

      {/* Recent interaction summary */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-text-main">
          {lastSession ? 'Last Session' : 'Weekly Summary'}
        </h2>
        <div className="mt-5 bg-white border-2 border-orange-100 rounded-[2rem] p-8 shadow-warm">
          {lastSession ? (
            <>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                {lastSession.mode} session · {formatTimeSince(lastSession.started_at)}
              </p>
              <p className="mt-4 text-text-main leading-relaxed">
                {lastSession.transcript_summary || 'Session completed. No transcript available.'}
              </p>
              <div className="mt-5 flex items-center gap-4 flex-wrap">
                {lastSession.mood_summary && (
                  <span className="inline-flex items-center gap-2 bg-accent-orange border border-orange-200 rounded-full px-4 py-2 text-sm font-semibold text-text-main">
                    😌 Mood: {lastSession.mood_summary}
                  </span>
                )}
                {lastSession.duration_seconds && (
                  <span className="inline-flex items-center gap-2 bg-accent-orange border border-orange-200 rounded-full px-4 py-2 text-sm font-semibold text-text-main">
                    ⏱ Duration: {Math.round(lastSession.duration_seconds / 60)}m
                  </span>
                )}
              </div>
            </>
          ) : weeklyReport ? (
            <>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                Weekly Report · {new Date(weeklyReport.created_at).toLocaleDateString()}
              </p>
              <p className="mt-4 text-text-main leading-relaxed">
                {weeklyReport.summary || 'No summary available.'}
              </p>
              <div className="mt-5 flex items-center gap-4 flex-wrap">
                {weeklyReport.mood_trend && (
                  <span className="inline-flex items-center gap-2 bg-accent-orange border border-orange-200 rounded-full px-4 py-2 text-sm font-semibold text-text-main">
                    📈 Trend: {weeklyReport.mood_trend}
                  </span>
                )}
                {weeklyReport.session_count && (
                  <span className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-sm font-semibold text-green-700">
                    {weeklyReport.session_count} sessions this week
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-text-muted">
              Start a conversation to see your session summary here.
            </p>
          )}
        </div>
      </div>

      {/* Pending reminders */}
      {reminders.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-bold text-text-main mb-4">Pending Reminders</h3>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="bg-white border-l-4 border-primary rounded-lg p-4 shadow-sm flex items-start justify-between"
              >
                <div>
                  <p className="font-semibold text-text-main">{reminder.content}</p>
                  <p className="text-sm text-text-muted mt-1">
                    Due: {new Date(reminder.due_date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                  {reminder.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-10 flex flex-wrap gap-4">
        {!hasProfile && (
          <button
            onClick={() => navigate('/questionnaire')}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-8 py-3 rounded-full text-sm font-bold shadow-warm transition-all cursor-pointer"
          >
            Complete Questionnaire
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 bg-white border-2 border-orange-200 hover:border-primary text-text-main px-8 py-3 rounded-full text-sm font-bold shadow-warm transition-all cursor-pointer"
        >
          View Full History <span className="ml-1">({sessionCount})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
          className="flex items-center gap-2 bg-white border-2 border-orange-200 hover:border-primary text-text-main px-8 py-3 rounded-full text-sm font-bold shadow-warm transition-all cursor-pointer"
        >
          View Full History
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-4 bg-white border-2 rounded-3xl p-6 shadow-warm hover:shadow-warm-lg hover:-translate-y-1 transition-all text-left cursor-pointer ${highlight ? 'border-primary' : 'border-orange-100'
        }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${highlight ? 'bg-gradient-to-br from-primary to-orange-400' : 'bg-accent-orange'
        }`}>
        {highlight ? <Mic className="w-6 h-6 text-white" /> : icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-text-main">{title}</h3>
        <p className="text-sm text-text-muted mt-1">{desc}</p>
      </div>
    </button>
  );
}
