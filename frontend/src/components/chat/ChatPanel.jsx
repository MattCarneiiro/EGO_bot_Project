import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Terminal, Send, Activity, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const API_URL = 'http://localhost:5000';

export const ChatPanel = ({ messages, setMessages, onFocusPdf, draftText, setSuggestion, setSuggestedPdfs, onClearSession }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleAsk = async () => {
        if (!input.trim() || loading) return;

        const query = input;
        const currentHistory = messages.map(m => ({
            role: m.sender === 'EGO' ? 'assistant' : 'user',
            content: typeof m.text === 'string' ? m.text : 'Interação com banco de dados.'
        }));

        setInput('');
        setMessages(prev => [...prev, { sender: 'USER', text: query }]);
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/ask`, {
                query,
                history: currentHistory,
                draft: draftText // <- A TELEPATIA ACONTECE AQUI
            });
            const { answer, results, suggestion } = response.data;

            if (suggestion) {
                setSuggestion(suggestion);
            }

            if (results && results.length > 0) {
                setSuggestedPdfs(results);
            } else {
                setSuggestedPdfs([]);
            }

            const richResponse = (
                <div className="flex flex-col gap-3">
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-200">{answer}</p>
                </div>
            );

            setMessages(prev => [...prev, { sender: 'EGO', text: richResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'EGO', text: "Erro crítico nas sinapses." }]);
        }
        setLoading(false);
    };

    return (
        <div className="flex h-full flex-col bg-[#0a0a0f] p-4">
            <header className="mb-4 flex items-center gap-3 border-b border-white/5 pb-4">
                <Terminal className="text-purple-500" />
                <div className="flex-1">
                    <h1 className="font-mono text-sm font-bold tracking-widest text-white">EGO_KERNEL</h1>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-green-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> Online
                    </span>
                </div>
                <button 
                    onClick={onClearSession}
                    title="Nova Linha Temporal (Reset)"
                    className="p-2 text-slate-500 transition-colors hover:text-red-400"
                >
                    <Trash2 size={16} />
                </button>
            </header>

            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto pr-2">
                {messages.map((msg, idx) => {
                    const isUser = msg.sender === 'USER';
                    return (
                        <div key={idx} className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
                            <span className={cn("mb-1 font-mono text-[10px] tracking-widest", isUser ? "text-slate-500" : "text-purple-500")}>
                                {msg.sender}
                            </span>
                            <div className={cn(
                                "max-w-[90%] rounded-lg p-3 text-sm leading-relaxed",
                                isUser ? "rounded-tr-none bg-slate-800 text-white" : "rounded-tl-none border border-white/5 bg-transparent text-slate-300"
                            )}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                {loading && (
                    <div className="flex items-center gap-2 font-mono text-xs text-purple-500">
                        <Activity size={14} className="animate-spin" /> Lendo mente e matriz...
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            <div className="group relative mt-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder="Comande o sistema..."
                    className="w-full rounded-lg border border-white/10 bg-[#13131a] py-3 pl-4 pr-12 font-mono text-sm text-white outline-none transition-colors focus:border-purple-500/50"
                />
                <button
                    onClick={handleAsk}
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 transition-colors hover:text-purple-400 disabled:opacity-50"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};