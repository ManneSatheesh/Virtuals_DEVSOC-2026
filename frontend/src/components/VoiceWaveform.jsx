import { useEffect, useRef } from 'react';

export default function VoiceWaveform({ audioTrack = null, color = '#FF6B35' }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const analyserRef = useRef(null);
    const audioContextRef = useRef(null);
    const dataArrayRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size
        canvas.width = 200 * dpr;
        canvas.height = 60 * dpr;
        canvas.style.width = '200px';
        canvas.style.height = '60px';
        ctx.scale(dpr, dpr);

        const barCount = 20;
        const barWidth = 6;
        const barGap = 4;
        const centerY = 30;

        // Setup audio analysis if we have a track
        if (audioTrack) {
            try {
                // Create audio context and analyser
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                }

                const audioContext = audioContextRef.current;

                if (!analyserRef.current) {
                    analyserRef.current = audioContext.createAnalyser();
                    analyserRef.current.fftSize = 64; // Small FFT for 32 frequency bins
                    analyserRef.current.smoothingTimeConstant = 0.8;
                }

                const analyser = analyserRef.current;

                // Connect audio track to analyser
                const mediaStream = new MediaStream([audioTrack.mediaStreamTrack]);
                const source = audioContext.createMediaStreamSource(mediaStream);
                source.connect(analyser);

                // Create data array for frequency data
                const bufferLength = analyser.frequencyBinCount;
                dataArrayRef.current = new Uint8Array(bufferLength);
            } catch (error) {
                console.error('Error setting up audio analysis:', error);
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, 200, 60);

            let volumes = [];

            if (analyserRef.current && dataArrayRef.current && audioTrack) {
                // Get frequency data from microphone
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);

                // Sample the frequency data to get bar heights
                const step = Math.floor(dataArrayRef.current.length / barCount);
                for (let i = 0; i < barCount; i++) {
                    const index = i * step;
                    const value = dataArrayRef.current[index] || 0;
                    // Normalize to 0-30 range for bar height
                    volumes.push((value / 255) * 30 + 3);
                }
            } else {
                // Default minimal bars when no audio
                volumes = Array(barCount).fill(5);
            }

            // Draw bars
            volumes.forEach((height, i) => {
                const x = i * (barWidth + barGap) + 10;
                const barHeight = Math.max(height, 3);

                // Gradient for each bar
                const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, color + '80'); // Add transparency

                ctx.fillStyle = gradient;
                ctx.fillRect(
                    x,
                    centerY - barHeight / 2,
                    barWidth,
                    barHeight
                );
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            // Don't close audio context as it might be reused
        };
    }, [audioTrack, color]);

    return (
        <canvas
            ref={canvasRef}
            className="rounded-lg"
            style={{ imageRendering: 'crisp-edges' }}
        />
    );
}
