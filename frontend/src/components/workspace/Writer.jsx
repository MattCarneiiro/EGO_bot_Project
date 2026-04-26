import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { DownloadCloud, Check, X } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export const Writer = ({ text, setText, suggestion, setSuggestion }) => {
    const [preview, setPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveAndIngest = async () => {
        setIsSaving(true);
        try {
            const response = await axios.post(`${API_URL}/save_and_ingest`, { text });
            const { filename } = response.data;
            
            const link = document.createElement('a');
            link.href = `${API_URL}/files/${filename}`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('Texto arquivado e ingerido com sucesso pelo EGO!');
        } catch (error) {
            console.error('Erro ao arquivar:', error);
            alert('Falha ao arquivar e ingerir o texto.');
        }
        setIsSaving(false);
    };

    const acceptSuggestion = () => {
        setText(suggestion.proposed_text);
        setSuggestion(null);
    };

    const rejectSuggestion = () => {
        setSuggestion(null);
    };

    return (
        <div className="flex h-full w-full flex-col bg-slate-900/50 p-4 relative">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-blue-400">Editor Neural</span>
                    <span className="font-mono text-[10px] text-green-400 opacity-70">(Sincronizado com EGO)</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSaveAndIngest}
                        disabled={isSaving}
                        className="flex items-center gap-1 rounded bg-indigo-600/20 px-3 py-1 font-mono text-xs text-indigo-400 transition-colors hover:bg-indigo-600/40 disabled:opacity-50"
                        title="Salvar como PDF e Ingerir na Memória"
                    >
                        <DownloadCloud size={14} />
                        {isSaving ? 'Arquivando...' : 'Arquivar e Ingerir'}
                    </button>
                    <button
                        onClick={() => setPreview(!preview)}
                        className="rounded bg-blue-600/20 px-3 py-1 font-mono text-xs text-blue-400 transition-colors hover:bg-blue-600/40"
                    >
                        {preview ? 'Modo Edição' : 'Modo Visualização'}
                    </button>
                </div>
            </div>

            {suggestion && (
                <div className="mb-4 flex flex-col rounded-lg border border-green-500/50 bg-green-900/20 p-4 shadow-[0_0_15px_rgba(34,197,94,0.15)] overflow-hidden shrink-0 max-h-64">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-green-400">
                            Telecinese do EGO: Sugestão Recebida
                        </span>
                        <div className="flex gap-2">
                            <button onClick={acceptSuggestion} className="flex items-center gap-1 rounded bg-green-600/30 px-2 py-1 font-mono text-[10px] text-green-300 hover:bg-green-600/50">
                                <Check size={12} /> Aceitar
                            </button>
                            <button onClick={rejectSuggestion} className="flex items-center gap-1 rounded bg-red-600/30 px-2 py-1 font-mono text-[10px] text-red-300 hover:bg-red-600/50">
                                <X size={12} /> Rejeitar
                            </button>
                        </div>
                    </div>
                    <p className="mb-2 text-xs italic text-slate-400">"{suggestion.justification}"</p>
                    <div className="prose prose-invert flex-1 overflow-y-auto max-w-none font-mono text-sm text-green-100 scrollbar-thin">
                        <ReactMarkdown>{suggestion.proposed_text}</ReactMarkdown>
                    </div>
                </div>
            )}

            {preview ? (
                <div className="prose prose-invert flex-1 max-w-none overflow-y-auto font-mono text-sm text-blue-100 scrollbar-thin">
                    <ReactMarkdown>{text}</ReactMarkdown>
                </div>
            ) : (
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 w-full resize-none bg-transparent font-mono text-sm text-blue-100 outline-none scrollbar-thin"
                    placeholder="Digite sua tese aqui. Eu estou lendo..."
                />
            )}
        </div>
    );
};