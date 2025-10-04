'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function VoiceTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        addLog('Speech recognition is supported');
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          addLog('Speech recognition result received');
          const transcript = event.results[0][0].transcript;
          addLog(`Transcribed text: "${transcript}"`);
          setTranscript(transcript);
        };

        recognitionRef.current.onerror = (event) => {
          addLog(`Speech recognition error: ${event.error} - ${event.message}`);
          setError(`${event.error}: ${event.message}`);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          addLog('Speech recognition ended');
          setIsRecording(false);
        };
      } else {
        addLog('Speech recognition is NOT supported in this browser');
        setError('Speech recognition is not supported in this browser');
      }
    }
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      addLog('Cannot start recording - speech recognition not available');
      return;
    }

    addLog('Starting recording...');
    setError('');
    setTranscript('');
    setIsRecording(true);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      addLog(`Error starting recording: ${err}`);
      setError(`Error starting recording: ${err}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    addLog('Stopping recording...');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        addLog(`Error stopping recording: ${err}`);
      }
    }
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Voice Recording Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Voice Recording</h2>
          
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-6 py-3 rounded-full text-white font-medium transition-all ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isRecording ? '🛑 Stop Recording' : '🎤 Start Recording'}
            </button>
          </div>

          {isRecording && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Listening... Speak now!</span>
              </div>
            </div>
          )}

          {transcript && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-900 mb-2">Transcribed Text:</h3>
              <p className="text-green-800">&quot;{transcript}&quot;</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-900 mb-2">Error:</h3>
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click &quot;Start Recording&quot; to begin testing.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            ← Back to Main App
          </Link>
        </div>
      </div>
    </div>
  );
}
