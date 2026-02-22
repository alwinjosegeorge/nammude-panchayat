/**
 * useSpeechToText.ts
 * Custom hook wrapping the browser's Web Speech API.
 * Supports English (en-IN), Malayalam (ml-IN), and Hindi (hi-IN).
 * No external libraries required.
 */
import { useState, useRef, useCallback } from 'react';

export type SpeechLang = 'en-IN' | 'ml-IN' | 'hi-IN';

export const SPEECH_LANGS: { code: SpeechLang; label: string; flag: string }[] = [
    { code: 'en-IN', label: 'English', flag: '🇬🇧' },
    { code: 'ml-IN', label: 'മലയാളം', flag: '🇮🇳' },
    { code: 'hi-IN', label: 'हिंदी', flag: '🇮🇳' },
];

interface UseSpeechToTextOptions {
    onResult: (text: string) => void;
    onError?: (err: string) => void;
}

interface UseSpeechToTextReturn {
    isListening: boolean;
    lang: SpeechLang;
    setLang: (l: SpeechLang) => void;
    supported: boolean;
    start: () => void;
    stop: () => void;
}

export function useSpeechToText({ onResult, onError }: UseSpeechToTextOptions): UseSpeechToTextReturn {
    const [isListening, setIsListening] = useState(false);
    const [lang, setLang] = useState<SpeechLang>('en-IN');
    const recognitionRef = useRef<any>(null);

    // Check browser support
    const SpeechRecognitionAPI =
        typeof window !== 'undefined'
            ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            : null;

    const supported = !!SpeechRecognitionAPI;

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const start = useCallback(() => {
        if (!SpeechRecognitionAPI) {
            onError?.('Speech recognition is not supported in this browser.');
            return;
        }

        // Stop any existing session first
        recognitionRef.current?.stop();

        const recognition: any = new SpeechRecognitionAPI();
        recognition.lang = lang;
        recognition.continuous = false;       // single utterance
        recognition.interimResults = false;   // only final results
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0]?.[0]?.transcript ?? '';
            if (transcript) onResult(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            const msg =
                event.error === 'not-allowed'
                    ? 'Microphone access denied. Please allow mic permission.'
                    : event.error === 'no-speech'
                        ? 'No speech detected. Please try again.'
                        : `Speech error: ${event.error}`;
            onError?.(msg);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    }, [SpeechRecognitionAPI, lang, onResult, onError]);

    return { isListening, lang, setLang, supported, start, stop };
}
