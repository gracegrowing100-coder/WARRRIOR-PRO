import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  label?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ 
  onTranscript, 
  className = "", 
  label = "Voice Type" 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const toggleListening = () => {
    setErrorMessage('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setErrorMessage("Voice speech recognition is not supported in this browser. Please type manually.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText('Listening... speak clearly');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
        }
        if (currentInterim) {
          setInterimText(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage("Microphone access was denied. Please allow microphone permissions.");
        } else if (event.error === 'no-speech') {
          setErrorMessage("No speech was detected. Please try speaking again.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition", err);
      setIsListening(false);
      setErrorMessage("Could not activate voice input.");
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={toggleListening}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm ${
          isListening 
            ? 'bg-rose-600 text-white animate-pulse border border-rose-400 ring-2 ring-rose-500/50' 
            : 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
        } ${className}`}
        title="Speak to dictate your symptoms or journal entry"
      >
        {isListening ? (
          <>
            <MicOff className="w-3.5 h-3.5 animate-bounce text-white" />
            <span>Recording...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Interim Listening status toast */}
      {isListening && interimText && (
        <span className="text-[10px] text-rose-500 font-bold animate-pulse flex items-center gap-1">
          <Volume2 className="w-3 h-3" /> {interimText}
        </span>
      )}

      {errorMessage && (
        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errorMessage}
        </span>
      )}
    </div>
  );
};
