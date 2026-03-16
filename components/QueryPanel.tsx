'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { type GazeTarget } from '@/lib/gaze-utils';
import { type Chunk } from '@/lib/paper-parser';
import { buildContext } from '@/lib/context-builder';

interface QAPair {
  question: string;
  answer: string;
  chunkId: string;
}

interface QueryPanelProps {
  currentTarget: GazeTarget | null;
  chunks: Chunk[];
  paperTitle: string;
  paperAbstract: string;
  onLockChunk: (chunkId: string | null) => void;
}

const QUICK_ACTIONS = [
  'What is this?',
  'Explain this in simple terms',
  'What methods does this describe?',
  'What are the limitations?',
  'Where has this been cited?',
];

export default function QueryPanel({
  currentTarget,
  chunks,
  paperTitle,
  paperAbstract,
  onLockChunk,
}: QueryPanelProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [history, setHistory] = useState<QAPair[]>([]);
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Voice input setup
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);

        // Submit on final result
        if (event.results[event.results.length - 1].isFinal) {
          setIsListening(false);
          handleSubmit(transcript);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSubmit = useCallback(
    async (questionText?: string) => {
      const question = questionText || input;
      if (!question.trim() || !currentTarget || loading) return;

      setLoading(true);
      setCurrentResponse('');
      onLockChunk(currentTarget.chunkId);

      const payload = buildContext(
        currentTarget.chunkId,
        chunks,
        paperTitle,
        paperAbstract,
        question.trim()
      );

      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('API request failed');

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            setCurrentResponse(fullResponse);
          }
        }

        setHistory((prev) => [
          { question: question.trim(), answer: fullResponse, chunkId: currentTarget.chunkId },
          ...prev,
        ]);
      } catch (err) {
        console.error('Ask error:', err);
        setCurrentResponse('Sorry, something went wrong. Check your API key and try again.');
      } finally {
        setLoading(false);
        setInput('');
        setTimeout(() => onLockChunk(null), 500);
      }
    },
    [input, currentTarget, chunks, paperTitle, paperAbstract, loading, onLockChunk]
  );

  const snippetText = currentTarget?.text
    ? currentTarget.text.length > 300
      ? currentTarget.text.slice(0, 300) + '...'
      : currentTarget.text
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Current target - compact, just confirms selection */}
      <div className="mb-4">
        {snippetText ? (
          <div className="p-3 bg-white rounded-lg border border-amber-200 text-sm text-gray-700 leading-relaxed">
            <span className="text-xs font-medium text-amber-600 uppercase tracking-wide block mb-1">
              Selected ({currentTarget?.chunkType}):
            </span>
            {snippetText}
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-400 leading-relaxed text-center">
            Look at (or hover over) a paragraph in the paper.
            <br />
            <span className="text-xs">The highlighted passage will appear here.</span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => handleSubmit(action)}
            disabled={!currentTarget || loading}
            className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full
              hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type or speak a question..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          disabled={loading}
        />
        <button
          onClick={toggleVoice}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              isListening
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? '⏹' : '🎤'}
        </button>
        <button
          onClick={() => handleSubmit()}
          disabled={!input.trim() || !currentTarget || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
            hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Ask
        </button>
      </div>

      {/* Response area */}
      <div className="flex-1 overflow-y-auto">
        {(loading || currentResponse) && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Response:
            </p>
            <div
              ref={responseRef}
              className="p-4 bg-white rounded-lg border border-gray-200 text-sm leading-relaxed prose prose-sm max-w-none"
            >
              {loading && !currentResponse && (
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="animate-spin text-sm">⟳</span>
                  Thinking...
                </div>
              )}
              {currentResponse && (
                <div className="whitespace-pre-wrap">{currentResponse}</div>
              )}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              History:
            </p>
            <div className="space-y-2">
              {history.map((item, i) => (
                <details key={i} className="group">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 py-1">
                    Q: {item.question}
                  </summary>
                  <div className="ml-4 mt-1 p-3 bg-white rounded border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
