import { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, Loader2, PhoneCall, PhoneOff, AlertCircle } from 'lucide-react';
import { initiatePhoneCall, pollCallStatus, validatePhoneNumber, formatPhoneNumber } from '../lib/phoneCallApi';
import { useAuth } from '../contexts/AuthContext';

export default function PhoneCallMode() {
    const { user } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [callState, setCallState] = useState('idle'); // idle | initiating | ringing | connected | ended | error
    const [error, setError] = useState(null);
    const [callInfo, setCallInfo] = useState(null);
    const [duration, setDuration] = useState(0);
    const stopPollingRef = useRef(null);
    const durationIntervalRef = useRef(null);

    // Format duration as MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (stopPollingRef.current) {
                stopPollingRef.current();
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, []);

    const handleInitiateCall = useCallback(async () => {
        const fullNumber = `${countryCode}${phoneNumber}`;

        // Validate phone number
        if (!validatePhoneNumber(fullNumber)) {
            setError('Invalid phone number format. Please enter a valid number.');
            return;
        }

        setCallState('initiating');
        setError(null);

        try {
            const result = await initiatePhoneCall(fullNumber);

            if (result.success) {
                setCallInfo(result);
                setCallState('ringing');

                // Start polling for status if we have a dispatch ID
                if (result.dispatchId) {
                    stopPollingRef.current = pollCallStatus(result.dispatchId, (status) => {
                        if (status.error) {
                            setError(status.error);
                            setCallState('error');
                            return;
                        }

                        // Update duration
                        if (status.duration !== undefined) {
                            setDuration(status.duration);
                        }

                        // Update state based on status
                        if (status.status === 'connected') {
                            setCallState('connected');

                            // Start duration timer
                            if (!durationIntervalRef.current) {
                                durationIntervalRef.current = setInterval(() => {
                                    setDuration(prev => prev + 1);
                                }, 1000);
                            }
                        } else if (status.status === 'ended') {
                            setCallState('ended');
                            if (durationIntervalRef.current) {
                                clearInterval(durationIntervalRef.current);
                                durationIntervalRef.current = null;
                            }

                            // Save session to localStorage
                            saveCallSession(fullNumber, duration);
                        }
                    });
                }
            } else {
                throw new Error(result.error || 'Failed to initiate call');
            }
        } catch (err) {
            console.error('Call initiation error:', err);
            setError(err.message || 'Failed to initiate call. Please try again.');
            setCallState('error');
        }
    }, [phoneNumber, countryCode, duration]);

    const saveCallSession = useCallback((number, callDuration) => {
        if (!user?.email) return;

        const minutes = Math.max(1, Math.round(callDuration / 60));
        const newSession = {
            id: Date.now(),
            date: new Date().toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            summary: `Phone Call to ${formatPhoneNumber(number)} (${minutes} min)`,
            mood: 'Neutral',
            trend: 'Steady',
            duration: `${minutes} min`,
            type: 'phone',
            phoneNumber: number
        };

        const key = `mindful_sessions_${user.email}`;
        try {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            localStorage.setItem(key, JSON.stringify([newSession, ...existing]));
        } catch (e) {
            console.error('Failed to save session', e);
        }
    }, [user]);

    const resetCall = useCallback(() => {
        if (stopPollingRef.current) {
            stopPollingRef.current();
            stopPollingRef.current = null;
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
        setCallState('idle');
        setPhoneNumber('');
        setError(null);
        setCallInfo(null);
        setDuration(0);
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* IDLE STATE - Phone Input */}
            {callState === 'idle' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-primary tracking-widest uppercase mb-6">
                        Enter Your Phone Number
                    </p>

                    <div className="relative z-10 bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-8 shadow-warm">
                        <div className="space-y-6">
                            {/* Country Code + Phone Number */}
                            <div className="flex gap-3">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="w-28 px-4 py-3 bg-white border-2 border-orange-200 rounded-2xl text-text-main font-semibold focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="+91">🇮🇳 +91</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+61">🇦🇺 +61</option>
                                    <option value="+86">🇨🇳 +86</option>
                                </select>

                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="9876543210"
                                    className="flex-1 px-6 py-3 bg-white border-2 border-orange-200 rounded-2xl text-text-main text-lg font-semibold focus:outline-none focus:border-primary transition-colors"
                                    maxLength="15"
                                />
                            </div>

                            {/* Info Text */}
                            <p className="text-text-muted text-sm">
                                The AI assistant will call this number and have a conversation with you.
                            </p>

                            {/* Call Button */}
                            <button
                                onClick={handleInitiateCall}
                                disabled={phoneNumber.length < 10}
                                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-8 py-4 rounded-full text-lg font-bold shadow-warm-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PhoneCall className="w-6 h-6" />
                                Call Me
                            </button>
                        </div>
                    </div>

                    <p className="relative z-10 mt-6 text-sm text-text-muted/60 font-medium">
                        Make sure your phone is nearby and ready to answer
                    </p>
                </>
            )}

            {/* INITIATING STATE */}
            {callState === 'initiating' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-primary tracking-widest uppercase">
                        Placing Call...
                    </p>

                    <div className="relative z-10 mt-10">
                        <div className="w-36 h-36 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-orange-400 shadow-warm-lg animate-pulse mx-auto">
                            <Loader2 className="w-14 h-14 text-white animate-spin" />
                        </div>
                    </div>

                    <p className="relative z-10 mt-8 text-text-muted text-base">
                        Connecting to {formatPhoneNumber(`${countryCode}${phoneNumber}`)}...
                    </p>
                </>
            )}

            {/* RINGING STATE */}
            {callState === 'ringing' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-secondary tracking-widest uppercase">
                        Calling Your Number...
                    </p>

                    <div className="relative z-10 mt-10">
                        {/* Ripple rings */}
                        <div className="absolute inset-0 rounded-full bg-secondary/20 animate-ripple" />
                        <div className="absolute inset-0 rounded-full bg-secondary/15 animate-ripple" style={{ animationDelay: '0.5s' }} />
                        <div className="absolute inset-0 rounded-full bg-secondary/10 animate-ripple" style={{ animationDelay: '1s' }} />

                        <div className="relative w-36 h-36 rounded-full flex items-center justify-center bg-gradient-to-br from-secondary to-yellow-400 shadow-glow-intense animate-breathe mx-auto">
                            <Phone className="w-14 h-14 text-white animate-pulse" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-6 shadow-warm">
                        <p className="text-text-main text-base font-semibold">
                            📞 {formatPhoneNumber(`${countryCode}${phoneNumber}`)}
                        </p>
                        <p className="text-text-muted text-sm mt-2">
                            Please answer your phone to start the conversation
                        </p>
                    </div>
                </>
            )}

            {/* CONNECTED STATE */}
            {callState === 'connected' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-green-600 tracking-widest uppercase">
                        In Conversation
                    </p>

                    <div className="relative z-10 mt-10">
                        {/* Ripple rings */}
                        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ripple" />
                        <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ripple" style={{ animationDelay: '0.5s' }} />

                        <div className="relative w-36 h-36 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-400 shadow-glow-intense animate-breathe mx-auto">
                            <PhoneCall className="w-14 h-14 text-white" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 bg-white/80 backdrop-blur border-2 border-green-100 rounded-[2rem] p-6 shadow-warm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-text-main text-base font-semibold">
                                    📞 {formatPhoneNumber(`${countryCode}${phoneNumber}`)}
                                </p>
                                <p className="text-green-600 text-sm mt-1 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Connected
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-primary">{formatDuration(duration)}</p>
                                <p className="text-text-muted text-xs">Duration</p>
                            </div>
                        </div>
                    </div>

                    <p className="relative z-10 mt-6 text-sm text-text-muted/60 font-medium">
                        The AI assistant is listening and responding to you
                    </p>
                </>
            )}

            {/* ENDED STATE */}
            {callState === 'ended' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-text-muted tracking-widest uppercase">
                        Call Ended
                    </p>

                    <div className="relative z-10 mt-10">
                        <div className="w-36 h-36 rounded-full flex items-center justify-center bg-gray-100 border-2 border-gray-200 mx-auto">
                            <PhoneOff className="w-14 h-14 text-gray-400" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-6 shadow-warm">
                        <p className="text-text-main text-base font-semibold">
                            Call Duration: {formatDuration(duration)}
                        </p>
                        <p className="text-text-muted text-sm mt-2">
                            Your conversation has been saved to history.
                        </p>
                    </div>

                    <button
                        onClick={resetCall}
                        className="relative z-10 mt-8 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-10 py-4 rounded-full text-base font-bold shadow-warm-lg transition-all mx-auto"
                    >
                        <Phone className="w-5 h-5" />
                        New Call
                    </button>
                </>
            )}

            {/* ERROR STATE */}
            {callState === 'error' && (
                <>
                    <p className="relative z-10 text-sm font-bold text-red-500 tracking-widest uppercase">
                        Call Failed
                    </p>

                    <div className="relative z-10 mt-10">
                        <div className="w-36 h-36 rounded-full flex items-center justify-center bg-red-50 border-4 border-red-200 mx-auto">
                            <AlertCircle className="w-14 h-14 text-red-400" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 bg-red-50 border-2 border-red-200 rounded-[2rem] p-6">
                        <p className="text-red-600 text-sm font-medium">
                            {error || 'Failed to place call. Please try again.'}
                        </p>
                        <p className="text-red-500/70 text-xs mt-2">
                            Make sure the backend server and agent are running.
                        </p>
                    </div>

                    <button
                        onClick={resetCall}
                        className="relative z-10 mt-8 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-10 py-4 rounded-full text-base font-bold shadow-warm-lg transition-all mx-auto"
                    >
                        <Phone className="w-5 h-5" />
                        Try Again
                    </button>
                </>
            )}
        </div>
    );
}
