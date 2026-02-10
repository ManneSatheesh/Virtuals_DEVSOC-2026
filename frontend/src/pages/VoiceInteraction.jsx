import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  useRoomContext,
  useParticipants,
  useLocalParticipant,
  useTracks,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { Mic, MicOff, Phone, Volume2, Loader2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import VoiceWaveform from '../components/VoiceWaveform';
import { QUESTIONS } from './Questionnaire';

const TOKEN_SERVER_URL = import.meta.env.VITE_TOKEN_SERVER_URL || 'http://localhost:3001';
const BACKBOARD_URL = 'http://localhost:3000';

// Voice Session Component - inside LiveKitRoom
function VoiceSession({ onEnd, sessionIdRef }) {
  const room = useRoomContext();
  const { user } = useAuth();
  const startTime = useRef(Date.now());
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [currentMood, setCurrentMood] = useState(null);
  const [agentSpeaking, setAgentSpeaking] = useState(false);

  // Track agent audio
  const agentTracks = useTracks([Track.Source.Microphone], {
    onlySubscribed: true,
  }).filter(track => track.participant.identity !== localParticipant?.identity);

  // Track local microphone for waveform
  const localMicTrack = useTracks([Track.Source.Microphone], {
    onlySubscribed: false,
  }).find(track => track.participant.identity === localParticipant?.identity);

  // Listen for data messages (transcripts, mood updates)
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));

        if (data.type === 'transcript') {
          const transcriptEntry = {
            speaker: data.speaker || participant?.identity || 'Unknown',
            text: data.text,
            timestamp: new Date(),
            emotion: data.emotion || null,
          };
          setTranscript(prev => [...prev, transcriptEntry]);

          // Store to Supabase
          if (user?.id && sessionIdRef.current) {
            supabase.from('messages').insert({
              session_id: sessionIdRef.current,
              user_id: user.id,
              role: data.speaker === 'user' ? 'user' : 'assistant',
              content: data.text,
              emotion_label: data.emotion?.label || null,
              emotion_score: data.emotion?.score || null,
            }).catch(e => console.warn('Failed to store transcript:', e));
          }
        }

        if (data.type === 'mood' || data.type === 'emotion') {
          const moodData = data.mood || data;
          setCurrentMood(moodData);
          console.log('🎭 Emotion detected:', moodData);
        }
      } catch (e) {
        // Not JSON data
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => room.off(RoomEvent.DataReceived, handleDataReceived);
  }, [room, user?.id, sessionIdRef]);

  // Detect when agent is speaking
  useEffect(() => {
    setAgentSpeaking(agentTracks.length > 0 && agentTracks.some(t => !t.isMuted));
  }, [agentTracks]);

  const toggleMute = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [localParticipant, isMuted]);

  // Save session when ending
  const endSession = useCallback(() => {
    if (user?.id && transcript.length > 0 && sessionIdRef.current) {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startTime.current) / 1000));

      // Update session in Supabase
      supabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          mood_summary: currentMood?.label || 'Neutral',
          transcript_summary: transcript.map(t => `${t.speaker === 'user' ? 'User' : 'Assistant'}: ${t.text}`).join('\n'),
        })
        .eq('id', sessionIdRef.current)
        .then(() => console.log('✅ Voice session saved to Supabase'));
    }

    // Also save to localStorage for backwards compatibility
    if (user?.email && transcript.length > 0) {
      const durationMs = Date.now() - startTime.current;
      const minutes = Math.max(1, Math.round(durationMs / 60000));

      const newSession = {
        id: Date.now(),
        date: new Date().toLocaleString('en-US', {
          hour: 'numeric', minute: 'numeric', hour12: true,
          month: 'short', day: 'numeric', year: 'numeric'
        }),
        summary: `Voice Interaction (${minutes} min)`,
        mood: currentMood?.label || 'Neutral',
        trend: 'Steady',
        duration: `${minutes} min`,
        transcript: transcript.map(t => `${t.speaker === 'user' ? 'User' : 'Assistant'}: ${t.text}`).join('\n')
      };

      const key = `mindful_sessions_${user.email}`;
      try {
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([newSession, ...existing]));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }

    room?.disconnect();
    onEnd();
  }, [room, onEnd, transcript, currentMood, user, sessionIdRef]);

  const status = agentSpeaking ? 'responding' : isMuted ? 'muted' : 'listening';

  const statusLabel = {
    listening: 'Listening…',
    responding: 'Responding…',
    muted: 'Muted',
  };

  return (
    <>
      {/* Audio renderer for agent */}
      <RoomAudioRenderer />

      {/* Status */}
      <p className="relative z-10 text-xl font-bold text-primary tracking-widest uppercase">
        {statusLabel[status]}
      </p>

      {/* Waveform visualization - shows when listening or responding */}
      <div className="relative z-10 mt-4 flex items-center justify-center">
        <VoiceWaveform
          audioTrack={!isMuted && localMicTrack ? localMicTrack.track : null}
          color={status === 'responding' ? '#FDB022' : '#FF6B35'}
        />
      </div>

      {/* Mic orb with ripple */}
      <div className="relative z-10 mt-10">
        {/* Ripple rings - only when active */}
        {(status === 'listening' || status === 'responding') && (
          <>
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ripple" />
            <div className="absolute inset-0 rounded-full bg-primary/15 animate-ripple" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ripple" style={{ animationDelay: '1s' }} />
          </>
        )}

        <button
          onClick={toggleMute}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all cursor-pointer ${status === 'listening'
            ? 'bg-gradient-to-br from-primary to-orange-400 shadow-glow-intense animate-breathe'
            : status === 'responding'
              ? 'bg-gradient-to-br from-secondary to-yellow-400 shadow-warm-lg animate-breathe'
              : 'bg-white border-4 border-orange-200 shadow-warm-lg hover:border-primary'
            }`}
        >
          {status === 'responding' ? (
            <Volume2 className="w-14 h-14 text-white drop-shadow-lg" />
          ) : status === 'listening' ? (
            <Mic className="w-14 h-14 text-white drop-shadow-lg" />
          ) : (
            <MicOff className="w-14 h-14 text-text-muted" />
          )}
        </button>
      </div>

      {/* Mood badge */}
      {currentMood && (
        <div className="relative z-10 mt-6 inline-flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-full px-6 py-3 text-lg font-semibold text-text-main shadow-lg">
          <span className="text-2xl">
            {currentMood.label === 'energized' && '😊'}
            {currentMood.label === 'calm' && '😌'}
            {currentMood.label === 'neutral' && '😐'}
            {currentMood.label === 'concerned' && '😟'}
            {currentMood.label === 'distressed' && '😢'}
            {!['energized', 'calm', 'neutral', 'concerned', 'distressed'].includes(currentMood.label) && '🎭'}
          </span>
          <div className="flex flex-col items-start">
            <span className="text-sm text-purple-600 uppercase tracking-wide">Detected Mood</span>
            <span className="text-primary font-bold capitalize">{currentMood.label}</span>
            {currentMood.trend && (
              <span className="text-xs text-purple-500">
                {currentMood.trend === 'improving' && '↗ Improving'}
                {currentMood.trend === 'slipping' && '↘ Declining'}
                {currentMood.trend === 'steady' && '→ Steady'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Connected participants */}
      <div className="relative z-10 mt-4 flex items-center gap-2 text-base text-text-muted">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        {participants.length} connected
      </div>

      {/* Live transcript area */}
      <div className="relative z-10 mt-8 w-full max-w-lg min-h-[200px] max-h-[300px] overflow-y-auto bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-6 shadow-warm">
        {transcript.length === 0 ? (
          <p className="text-text-muted text-xl italic text-center">
            Speak naturally. The assistant is listening to you.
          </p>
        ) : (
          <div className="space-y-4">
            {transcript.slice(-10).map((entry, idx) => (
              <div key={idx} className={`${entry.speaker === 'user' ? 'text-right' : 'text-left'}`}>
                <p className="text-text-main text-lg leading-relaxed">
                  <span className={`font-bold ${entry.speaker === 'user' ? 'text-secondary' : 'text-primary'}`}>
                    {entry.speaker === 'user' ? 'You' : 'Assistant'}:
                  </span>{' '}
                  {entry.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* End button */}
      <button
        onClick={endSession}
        className="relative z-10 mt-8 flex items-center gap-2 bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 px-8 py-3 rounded-full text-lg font-bold transition-all cursor-pointer"
      >
        <Phone className="w-5 h-5" />
        End Session
      </button>
    </>
  );
}

// Main VoiceInteraction Component
export default function VoiceInteraction() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState('idle'); // idle | connecting | connected | error | ended
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [error, setError] = useState(null);
  const roomName = useRef(`voice-session-${Date.now()}`);
  const sessionIdRef = useRef(null);

  const startSession = useCallback(async () => {
    setConnectionState('connecting');
    setError(null);

    try {
      // Create session in Supabase
      if (user?.id) {
        const { data, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            mode: 'voice',
          })
          .select()
          .single();
        
        if (data) {
          sessionIdRef.current = data.id;
          console.log('📝 Voice session created:', data.id);
        } else if (sessionError) {
          console.warn('Failed to create session:', sessionError);
        }
      }

      // Load user profile from Supabase first, fallback to localStorage
      let profileText = '';
      
      try {
        const { data: responses } = await supabase
          .from('questionnaire_responses')
          .select('question_id, answer')
          .eq('user_id', user?.id);
        
        if (responses && responses.length > 0) {
          profileText = responses
            .map(r => {
              const question = QUESTIONS.find(q => q.id === r.question_id);
              if (question) {
                return `${question.question}\n  → ${r.answer}`;
              }
              return null;
            })
            .filter(Boolean)
            .join('\n\n');
        }
      } catch (e) {
        console.warn('Supabase load failed, trying localStorage:', e);
      }

      // Fallback to localStorage if Supabase didn't work
      if (!profileText) {
        const profileKey = `mindful_profile_${user?.email}`;
        const savedProfile = localStorage.getItem(profileKey);
        
        if (savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            profileText = Object.entries(profile)
              .filter(([key]) => key !== 'completed')
              .map(([questionId, answer]) => {
                const question = QUESTIONS.find(q => q.id === parseInt(questionId));
                if (question && answer) {
                  const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
                  return `${question.question}\n  → ${answerText}`;
                }
                return null;
              })
              .filter(Boolean)
              .join('\n\n');
          } catch (e) {
            console.error('Failed to parse localStorage profile:', e);
          }
        }
      }

      // Send profile to Backboard
      if (profileText) {
        console.log('📤 Sending user profile to Backboard...');
        await fetch(`${BACKBOARD_URL}/api/memory/store`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'voice-session-init',
            content: `User Profile for ${user?.name || user?.email}:\n\n${profileText}\n\nThis is the user's questionnaire responses. Use this information to provide personalized, context-aware support during the voice conversation.`
          })
        });
        console.log('✅ User profile synced to Backboard');
      }

      const response = await fetch(`${TOKEN_SERVER_URL}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.current,
          participantName: user?.name || user?.email || 'User',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      const data = await response.json();
      setToken(data.token);
      setServerUrl(data.url);
      setConnectionState('connected');
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
      setConnectionState('error');
    }
  }, [user]);

  const endSession = useCallback(() => {
    setConnectionState('ended');
    setToken(null);
  }, []);

  const resetSession = useCallback(() => {
    setConnectionState('idle');
    setToken(null);
    setError(null);
    roomName.current = `voice-session-${Date.now()}`;
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[90vh] p-8 text-center overflow-hidden">
      {/* Profile Button */}
      <button
        onClick={() => navigate('/questionnaire', { state: { editMode: true } })}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-white/80 hover:bg-white text-text-muted hover:text-primary px-4 py-2 rounded-full text-base font-bold shadow-sm border border-orange-100 transition-all cursor-pointer"
      >
        <User className="w-4 h-4" />
        Profile
      </button>

      {/* Background blurs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      </div>

      {/* IDLE STATE */}
      {connectionState === 'idle' && (
        <>
          <p className="relative z-10 text-xl font-bold text-primary tracking-widest uppercase">
            Tap to start voice session
          </p>

          <div className="relative z-10 mt-10">
            <button
              onClick={startSession}
              className="relative w-36 h-36 rounded-full flex items-center justify-center bg-white border-4 border-orange-200 shadow-warm-lg hover:border-primary hover:shadow-glow transition-all cursor-pointer"
            >
              <MicOff className="w-14 h-14 text-text-muted" />
            </button>
          </div>

          <div className="relative z-10 mt-8 w-full max-w-lg min-h-[140px] bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-8 shadow-warm">
            <p className="text-text-muted text-xl font-medium">
              Your conversation will appear here…
            </p>
          </div>

          <p className="relative z-10 mt-10 text-lg text-text-muted/60 font-medium">
            Press the microphone to begin your voice session
          </p>
        </>
      )}

      {/* CONNECTING STATE */}
      {connectionState === 'connecting' && (
        <>
          <p className="relative z-10 text-xl font-bold text-primary tracking-widest uppercase">
            Connecting…
          </p>

          <div className="relative z-10 mt-10">
            <div className="w-36 h-36 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-orange-400 shadow-warm-lg animate-pulse">
              <Loader2 className="w-14 h-14 text-white animate-spin" />
            </div>
          </div>

          <p className="relative z-10 mt-8 text-text-muted text-lg">
            Setting up your voice session…
          </p>
        </>
      )}

      {/* CONNECTED STATE - LiveKit Room */}
      {connectionState === 'connected' && token && serverUrl && (
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={() => setConnectionState('ended')}
          onError={(err) => {
            console.error('Room error:', err);
            setError(err.message);
            setConnectionState('error');
          }}
        >
          <VoiceSession onEnd={endSession} sessionIdRef={sessionIdRef} />
        </LiveKitRoom>
      )}

      {/* ERROR STATE */}
      {connectionState === 'error' && (
        <>
          <p className="relative z-10 text-xl font-bold text-red-500 tracking-widest uppercase">
            Connection Failed
          </p>

          <div className="relative z-10 mt-10">
            <div className="w-36 h-36 rounded-full flex items-center justify-center bg-red-50 border-4 border-red-200">
              <MicOff className="w-14 h-14 text-red-400" />
            </div>
          </div>

          <div className="relative z-10 mt-8 w-full max-w-lg bg-red-50 border-2 border-red-200 rounded-[2rem] p-6">
            <p className="text-red-600 text-lg font-medium">
              {error || 'Failed to connect to voice server. Please try again.'}
            </p>
            <p className="text-red-500/70 text-base mt-2">
              Make sure the token server is running on port 3001
            </p>
          </div>

          <button
            onClick={resetSession}
            className="relative z-10 mt-8 flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-10 py-4 rounded-full text-lg font-bold shadow-warm-lg transition-all cursor-pointer"
          >
            <Mic className="w-5 h-5" />
            Try Again
          </button>
        </>
      )}

      {/* ENDED STATE */}
      {connectionState === 'ended' && (
        <>
          <p className="relative z-10 text-xl font-bold text-text-muted tracking-widest uppercase">
            Session Ended
          </p>

          <div className="relative z-10 mt-10">
            <div className="w-36 h-36 rounded-full flex items-center justify-center bg-gray-100 border-2 border-gray-200">
              <MicOff className="w-14 h-14 text-gray-400" />
            </div>
          </div>

          <div className="relative z-10 mt-8 w-full max-w-lg min-h-[140px] bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-8 shadow-warm">
            <p className="text-text-muted text-lg">
              Session complete. Your conversation has been saved.
            </p>
          </div>

          <button
            onClick={resetSession}
            className="relative z-10 mt-8 flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-10 py-4 rounded-full text-lg font-bold shadow-warm-lg transition-all cursor-pointer"
          >
            <Mic className="w-5 h-5" />
            New Session
          </button>
        </>
      )}
    </div>
  );
}
