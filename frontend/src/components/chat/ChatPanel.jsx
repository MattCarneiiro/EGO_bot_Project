import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Terminal, Send, Activity } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export const ChatPanel = ({ messages, setMessages, onFocusPdf }) => {
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
            content: typeof m.text === 'string' ? m.text : 'Interação com banco.'
        }));

        setInput('');
        setMessages(prev => [...prev, { sender: 'USER', text: query }]);
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/ask`, { query, history: currentHistory });
            const { answer, results } = response.data;

            const richResponse = (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>

                    {results && results.length > 0 && (
                        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(168, 85, 247, 0.2)', paddingTop: '12px' }}>
                            <span className="font-mono" style={{ fontSize: '10px', color: '#c084fc', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                                Evidências Físicas
                            </span>
                            {results.map((res, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => onFocusPdf(`${res.metadata.doc_id}.pdf`, res.metadata.page)}
                                    style={{
                                        background: 'rgba(168, 85, 247, 0.05)',
                                        border: '1px solid rgba(168, 85, 247, 0.2)',
                                        borderRadius: '6px',
                                        padding: '12px',
                                        marginBottom: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <p style={{ fontSize: '12px', fontStyle: 'italic', marginBottom: '8px', color: '#cbd5e1' }}>
                                        "{res.text.substring(0, 90)}..."
                                    </p>
                                    <span className="font-mono" style={{ fontSize: '10px', color: '#a855f7' }}>
                                        📄 Pág {res.metadata.page} | {res.metadata.tags}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );

            setMessages(prev => [...prev, { sender: 'EGO', text: richResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'EGO', text: "Erro crítico nas sinapses." }]);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full p-4">
            <header className="flex items-center gap-3 mb-6 pb-3 border-b border-purple-500/20">
                <Terminal color="#a855f7" />
                <div>
                    <h1 className="font-mono text-sm tracking-widest text-purple-100">EGO_KERNEL</h1>
                    <span className="font-mono flex items-center gap-1.5 text-[10px] text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                    </span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {messages.map((msg, idx) => {
                    const isUser = msg.sender === 'USER';
                    return (
                        <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                            <span className="font-mono text-[10px] mb-1 opacity-50 uppercase tracking-wider text-purple-300">{msg.sender}</span>
                            <div className={`px-4 py-3 rounded-lg max-w-[85%] text-sm ${isUser ? 'bg-purple-600/20 border border-purple-500/30 text-purple-100' : 'bg-slate-800/50 border border-slate-700/50 text-slate-200'}`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                {loading && (
                    <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#a855f7' }}>
                        <Activity size={14} className="animate-spin" /> Processando Lógica...
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            <div className="mt-4 relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder="Comande o sistema..."
                    className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg py-3 pl-4 pr-12 text-white font-mono text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-slate-600"
                />
                <button
                    onClick={handleAsk}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};