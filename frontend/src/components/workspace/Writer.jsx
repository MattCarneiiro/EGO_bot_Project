import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export const Writer = () => {
    const [text, setText] = useState('# EGO Canvas\n\nRedija seus pensamentos aqui...');
    const [preview, setPreview] = useState(false);

    return (
        <div className="flex h-full w-full flex-col bg-slate-900/50 p-4">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-mono text-xs uppercase tracking-widest text-blue-400">Editor Neural</span>
                <button
                    onClick={() => setPreview(!preview)}
                    className="rounded bg-blue-600/20 px-3 py-1 font-mono text-xs text-blue-400 transition-colors hover:bg-blue-600/40"
                >
                    {preview ? 'Modo Edição' : 'Modo Visualização'}
                </button>
            </div>
            {preview ? (
                <div className="prose prose-invert h-full max-w-none overflow-y-auto font-mono text-sm text-blue-100">
                    <ReactMarkdown>{text}</ReactMarkdown>
                </div>
            ) : (
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="h-full w-full resize-none bg-transparent font-mono text-sm text-blue-100 outline-none"
                    placeholder="Digite sua tese aqui..."
                />
            )}
        </div>
    );
};