import { useState, useCallback, useEffect, useRef } from 'react';
import {
    LiveKitRoom,
    useRoomContext,
    useParticipants,
    useLocalParticipant,
    useTracks,
    RoomAudioRenderer,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { Mic, MicOff, Phone, Volume2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import VoiceWaveform from './VoiceWaveform';

const TOKEN_SERVER_URL = import.meta.env.VITE_TOKEN_SERVER_URL || 'http://localhost:3001';

// Voice Session Component - inside LiveKitRoom
function VoiceSession({ onEnd }) {
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
                    setTranscript(prev => [...prev, {
                        speaker: data.speaker || participant?.identity || 'Unknown',
                        text: data.text,
                        timestamp: new Date(),
                    }]);
                }

                if (data.type === 'mood') {
                    setCurrentMood(data.mood);
                }
            } catch (e) {
                // Not JSON data
            }
        };

        room.on(RoomEvent.DataReceived, handleDataReceived);
        return () => room.off(RoomEvent.DataReceived, handleDataReceived);
    }, [room]);

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
                mood: currentMood || 'Neutral',
                trend: 'Steady',
                duration: `${minutes} min`,
                type: 'dev',
                transcript: transcript.map(t => `${t.speaker === 'user' ? 'User' : 'Assistant'}: ${t.text}`).join('\n')
            };

            const key = `mindful_sessions_${user.email}`;
            try {
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                localStorage.setItem(key, JSON.stringify([newSession, ...existing]));
            } catch (e) {
                console.error('Failed to save session', e);
            }
        }

        room?.disconnect();
        onEnd();
    }, [room, onEnd, transcript, currentMood, user]);

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
            <p className="relative z-10 text-sm font-bold text-primary tracking-widest uppercase">
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
                    className={`relative w-52 h-52 rounded-full flex items-center justify-center transition-all cursor-pointer ${status === 'listening'
                        ? 'bg-gradient-to-br from-primary to-orange-400 shadow-glow-intense animate-breathe'
                        : status === 'responding'
                            ? 'bg-gradient-to-br from-secondary to-yellow-400 shadow-warm-lg animate-breathe'
                            : 'bg-white border-4 border-orange-200 shadow-warm-lg hover:border-primary'
                        }`}
                >
                    {status === 'responding' ? (
                        <Volume2 className="w-20 h-20 text-white drop-shadow-lg" />
                    ) : status === 'listening' ? (
                        <Mic className="w-20 h-20 text-white drop-shadow-lg" />
                    ) : (
                        <MicOff className="w-20 h-20 text-text-muted" />
                    )}
                </button>
            </div>

            {/* Mood badge */}
            {currentMood && (
                <div className="relative z-10 mt-6 inline-flex items-center gap-2 bg-white border-2 border-orange-100 rounded-full px-5 py-2 text-sm font-semibold text-text-main shadow-warm">
                    🎭 Detected mood: <span className="text-primary font-bold capitalize">{currentMood}</span>
                </div>
            )}

            {/* Connected participants */}
            <div className="relative z-10 mt-4 flex items-center gap-2 text-xs text-text-muted">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {participants.length} connected
            </div>

            {/* Live transcript area */}
            <div className="relative z-10 mt-8 w-full max-w-lg min-h-[200px] max-h-[300px] overflow-y-auto bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-6 shadow-warm">
                {transcript.length === 0 ? (
                    <p className="text-text-muted text-base italic text-center">
                        Speak naturally. The assistant is listening to you.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {transcript.slice(-10).map((entry, idx) => (
                            <div key={idx} className={`${entry.speaker === 'user' ? 'text-right' : 'text-left'}`}>
                                <p className="text-text-main text-base leading-relaxed">
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
                className="relative z-10 mt-8 flex items-center gap-2 bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 px-8 py-3 rounded-full text-sm font-bold transition-all cursor-pointer"
            >
                <Phone className="w-5 h-5" />
                End Session
            </button>
        </>
    );
}

// Dev Interaction Mode Component
export default function DevInteractionMode() {
    const { user } = useAuth();
    const [connectionState, setConnectionState] = useState('idle'); // idle | connecting | connected | error | ended
    const [token, setToken] = useState(null);
    const [serverUrl, setServerUrl] = useState(null);
    const [error, setError] = useState(null);
    const roomName = useRef(`voice-session-${Date.now()}`);

    const startSession = useCallback(async () => {
        setConnectionState('connecting');
        setError(null);

        try {
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
        <div className="w-full max-w-4xl mx-auto">
            {/* IDLE STATE */}
            {connectionState === 'idle' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-primary tracking-widest uppercase">
                        Tap to start voice session
                    </p>

                    <div className="relative z-10 mt-10">
                        <button
                            onClick={startSession}
                            className="relative w-52 h-52 rounded-full flex items-center justify-center bg-white border-4 border-orange-200 shadow-warm-lg hover:border-primary hover:shadow-glow transition-all cursor-pointer mx-auto"
                        >
                            <MicOff className="w-20 h-20 text-text-muted" />
                        </button>
                    </div>

                    <div className="relative z-10 mt-8 w-full max-w-lg min-h-[140px] bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-8 shadow-warm">
                        <p className="text-text-muted text-base font-medium">
                            Your conversation will appear here…
                        </p>
                    </div>

                    <p className="relative z-10 mt-10 text-sm text-text-muted/60 font-medium">
                        Press the microphone to begin your voice session
                    </p>
                </>
            )}

            {/* CONNECTING STATE */}
            {connectionState === 'connecting' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-primary tracking-widest uppercase">
                        Connecting…
                    </p>

                    <div className="relative z-10 mt-10">
                        <div className="w-52 h-52 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-orange-400 shadow-warm-lg animate-pulse mx-auto">
                            <Loader2 className="w-20 h-20 text-white animate-spin" />
                        </div>
                    </div>

                    <p className="relative z-10 mt-8 text-text-muted text-base">
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
                    <VoiceSession onEnd={endSession} />
                </LiveKitRoom>
            )}

            {/* ERROR STATE */}
            {connectionState === 'error' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-red-500 tracking-widest uppercase">
                        Connection Failed
                    </p>

                    <div className="relative z-10 mt-10">
                        <div className="w-52 h-52 rounded-full flex items-center justify-center bg-red-50 border-4 border-red-200 mx-auto">
                            <MicOff className="w-20 h-20 text-red-400" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 w-full max-w-lg bg-red-50 border-2 border-red-200 rounded-[2rem] p-6">
                        <p className="text-red-600 text-sm font-medium">
                            {error || 'Failed to connect to voice server. Please try again.'}
                        </p>
                        <p className="text-red-500/70 text-xs mt-2">
                            Make sure the token server is running on port 3001
                        </p>
                    </div>

                    <button
                        onClick={resetSession}
                        className="relative z-10 mt-8 flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-10 py-4 rounded-full text-base font-bold shadow-warm-lg transition-all cursor-pointer mx-auto"
                    >
                        <Mic className="w-5 h-5" />
                        Try Again
                    </button>
                </>
            )}

            {/* ENDED STATE */}
            {connectionState === 'ended' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-text-muted tracking-widest uppercase">
                        Session Ended
                    </p>

                    <div className="relative z-10 mt-10">
                        <div className="w-52 h-52 rounded-full flex items-center justify-center bg-gray-100 border-2 border-gray-200 mx-auto">
                            <MicOff className="w-20 h-20 text-gray-400" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 w-full max-w-lg min-h-[140px] bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-8 shadow-warm">
                        <p className="text-text-muted text-base">
                            Session complete. Your conversation has been saved.
                        </p>
                    </div>

                    <button
                        onClick={resetSession}
                        className="relative z-10 mt-8 flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-10 py-4 rounded-full text-base font-bold shadow-warm-lg transition-all cursor-pointer mx-auto"
                    >
                        <Mic className="w-5 h-5" />
                        New Session
                    </button>
                </>
            )}
        </div>
    );
}
