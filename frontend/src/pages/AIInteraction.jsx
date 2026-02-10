import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Monitor, Phone } from 'lucide-react';
import DevInteractionMode from '../components/DevInteractionMode';
import PhoneCallMode from '../components/PhoneCallMode';

export default function AIInteraction() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('dev'); // 'dev' | 'phone'

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[90vh] p-8 text-center overflow-hidden">
            {/* Profile Button */}
            <button
                onClick={() => navigate('/questionnaire', { state: { editMode: true } })}
                className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-white/80 hover:bg-white text-text-muted hover:text-primary px-4 py-2 rounded-full text-sm font-bold shadow-sm border border-orange-100 transition-all cursor-pointer"
            >
                <User className="w-4 h-4" />
                Profile
            </button>

            {/* Background blurs */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
            </div>

            {/* Title */}
            <h1 className="relative z-10 text-4xl md:text-5xl font-bold font-serif text-text-main mb-8">
                Voice <span className="text-primary">Assistant</span>
            </h1>

            {/* Mode Toggle */}
            <div className="relative z-10 mb-10 inline-flex bg-white/80 backdrop-blur border-2 border-orange-100 rounded-full p-2 shadow-warm">
                <button
                    onClick={() => setMode('dev')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold transition-all ${mode === 'dev'
                        ? 'bg-gradient-to-r from-primary to-orange-400 text-white shadow-md'
                        : 'text-text-muted hover:text-primary'
                        }`}
                >
                    <Monitor className="w-5 h-5" />
                    Dev Mode
                </button>
                <button
                    onClick={() => setMode('phone')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold transition-all ${mode === 'phone'
                        ? 'bg-gradient-to-r from-primary to-orange-400 text-white shadow-md'
                        : 'text-text-muted hover:text-primary'
                        }`}
                >
                    <Phone className="w-5 h-5" />
                    Phone Call
                </button>
            </div>

            {/* Mode Description */}
            <div className="relative z-10 mb-8 max-w-3xl">
                {mode === 'dev' ? (
                    <p className="text-text-muted text-lg font-medium">
                        Interact with the AI assistant directly through your browser using voice. <br />
                        Experience seamless, real-time conversation.
                    </p>
                ) : (
                    <p className="text-text-muted text-lg font-medium">
                        Receive a phone call from the AI assistant on your mobile device. <br />
                        Perfect for on-the-go interactions.
                    </p>
                )}
            </div>

            {/* Mode Content */}
            {mode === 'dev' ? <DevInteractionMode /> : <PhoneCallMode />}
        </div>
    );
}
