import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const BACKBOARD_URL = 'http://localhost:3000';

export default function TextChat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentMood, setCurrentMood] = useState(null);
    const messagesEndRef = useRef(null);

    // Session tracking
    const sessionIdRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const messagesRef = useRef([]);
    const moodRef = useRef(null);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        moodRef.current = currentMood;
    }, [currentMood]);

    // Create session on mount
    useEffect(() => {
        async function initSession() {
            if (!user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('sessions')
                    .insert({
                        user_id: user.id,
                        mode: 'text',
                    })
                    .select()
                    .single();
                
                if (data) {
                    sessionIdRef.current = data.id;
                }
            } catch (e) {
                console.warn('Failed to create session:', e);
            }
        }
        initSession();
    }, [user?.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Save session on unmount
    useEffect(() => {
        return () => {
            const msgs = messagesRef.current;
            const hasUserMessage = msgs.some(m => m.role === 'user');

            if (user?.id && sessionIdRef.current && hasUserMessage) {
                const durationSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

                // Update session in Supabase
                supabase
                    .from('sessions')
                    .update({
                        ended_at: new Date().toISOString(),
                        duration_seconds: durationSeconds,
                        mood_summary: moodRef.current || 'Neutral',
                        transcript_summary: msgs.map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`).join('\n'),
                    })
                    .eq('id', sessionIdRef.current)
                    .then(() => console.log('✅ Session saved'));

                // Also save to localStorage for backwards compatibility
                const key = `mindful_sessions_${user.email}`;
                const newSession = {
                    id: Date.now(),
                    date: new Date().toLocaleString('en-US', {
                        hour: 'numeric', minute: 'numeric', hour12: true,
                        month: 'short', day: 'numeric', year: 'numeric'
                    }),
                    summary: `Text Chat Session (${Math.round(durationSeconds / 60)} min)`,
                    mood: moodRef.current || 'Neutral',
                    trend: 'Steady',
                    duration: `${Math.round(durationSeconds / 60)} min`,
                    transcript: msgs.map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`).join('\n')
                };
                try {
                    const existing = JSON.parse(localStorage.getItem(key) || '[]');
                    localStorage.setItem(key, JSON.stringify([newSession, ...existing]));
                } catch (e) {
                    console.error('Failed to save to localStorage', e);
                }
            }
        };
    }, [user?.id, user?.email]);

    // Load conversation history on mount (from Backboard)
    useEffect(() => {
        const loadMemory = async () => {
            try {
                const response = await fetch(`${BACKBOARD_URL}/recall-memory`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.memory) {
                        setMessages([{
                            role: 'assistant',
                            content: `Welcome back! I remember our previous conversations. ${data.memory}`,
                            timestamp: new Date(),
                        }]);
                    }
                }
            } catch (error) {
                console.error('Failed to load memory:', error);
            }
        };

        loadMemory();
    }, []);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        const userInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // Run Backboard message and emotion detection in PARALLEL
            const [backboardResponse, emotionResult] = await Promise.allSettled([
                fetch(`${BACKBOARD_URL}/send-message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: userInput }),
                }).then(r => r.ok ? r.json() : Promise.reject('Backboard failed')),
                
                fetch('http://localhost:8000/predict-text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: userInput }),
                }).then(r => r.ok ? r.json() : null).catch((err) => {
                    console.error('Emotion API error:', err);
                    return null;
                })
            ]);

            // Handle emotion result
            let emotionLabel = null;
            let emotionScore = null;
            if (emotionResult.status === 'fulfilled' && emotionResult.value) {
                console.log('🎭 Emotion detected:', emotionResult.value);
                emotionLabel = emotionResult.value.label;
                emotionScore = emotionResult.value.score;
                setCurrentMood(emotionLabel);
            } else {
                console.warn('🎭 Emotion detection failed');
            }

            // Store user message to Supabase with emotion
            if (user?.id && sessionIdRef.current) {
                supabase.from('messages').insert({
                    session_id: sessionIdRef.current,
                    user_id: user.id,
                    role: 'user',
                    content: userInput,
                    emotion_label: emotionLabel,
                    emotion_score: emotionScore,
                }).catch(e => console.warn('Failed to store user message:', e));
            }

            // Handle Backboard response
            if (backboardResponse.status === 'fulfilled') {
                const data = backboardResponse.value;
                const assistantMessage = {
                    role: 'assistant',
                    content: data.ai_response,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);

                // Store assistant message to Supabase
                if (user?.id && sessionIdRef.current) {
                    supabase.from('messages').insert({
                        session_id: sessionIdRef.current,
                        user_id: user.id,
                        role: 'assistant',
                        content: data.ai_response,
                    }).catch(e => console.warn('Failed to store assistant message:', e));
                }
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                error: true,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const moodEmojis = {
        anger: '😠',
        joy: '😊',
        sadness: '😢',
        neutral: '😐',
        fear: '😨',
        disgust: '🤢',
        surprise: '😲',
    };

    return (
        <div className="relative flex flex-col h-[90vh] max-w-4xl mx-auto p-6">
            {/* Background blurs */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
            </div>

            {/* Header */}
            <div className="relative z-10 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-primary" />
                            Text Chat
                        </h1>
                        <p className="text-text-muted mt-1">
                            Chat with your AI assistant via text
                        </p>
                    </div>

                    {currentMood && (
                        <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-full px-6 py-3 text-lg font-semibold text-text-main shadow-lg animate-pulse">
                            <span className="text-2xl">{moodEmojis[currentMood] || '😐'}</span>
                            <div className="flex flex-col">
                                <span className="text-xs text-purple-600 uppercase tracking-wide">Your Mood</span>
                                <span className="capitalize font-bold text-purple-700">{currentMood}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Container */}
            <div className="relative z-10 flex-1 bg-white/80 backdrop-blur border-2 border-orange-100 rounded-[2rem] p-6 shadow-warm overflow-y-auto mb-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Sparkles className="w-16 h-16 text-primary/30 mb-4" />
                        <p className="text-text-muted text-lg">
                            Start a conversation with your AI assistant
                        </p>
                        <p className="text-text-muted/60 text-sm mt-2">
                            I remember our past conversations and can help you with anything!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message, idx) => (
                            <div
                                key={idx}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-5 py-3 ${message.role === 'user'
                                        ? 'bg-gradient-to-r from-primary to-orange-400 text-white shadow-warm'
                                        : message.error
                                            ? 'bg-red-50 border-2 border-red-200 text-red-600'
                                            : 'bg-white border-2 border-orange-100 text-text-main shadow-sm'
                                        }`}
                                >
                                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                                        {message.content}
                                    </p>
                                    <p
                                        className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-text-muted/60'
                                            }`}
                                    >
                                        {message.timestamp.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border-2 border-orange-100 rounded-2xl px-5 py-3 shadow-sm">
                                    <div className="flex items-center gap-2 text-text-muted">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} className="relative z-10">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 bg-white border-2 border-orange-200 rounded-full px-6 py-4 text-base text-text-main placeholder-text-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-warm"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-gradient-to-r from-primary to-orange-400 hover:from-primary-dark hover:to-primary text-white px-8 py-4 rounded-full font-bold shadow-warm-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}
