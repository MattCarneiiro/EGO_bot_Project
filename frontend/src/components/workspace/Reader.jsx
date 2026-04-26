import React, { useRef, useState } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export const Reader = ({ openDocuments = [], activeDocId, setActiveDocId, closeDocument, onPdfChange }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('macro_tag', `#${file.name.split('.')[0]}`);

        try {
            const response = await axios.post(`${API_URL}/upload`, formData);
            onPdfChange(`${response.data.doc_id}.pdf`, 1);
        } catch (error) {
            console.error("Falha na assimilação do arquivo.", error);
        }
        setIsUploading(false);
    };

    const activeDoc = openDocuments.find(d => d.id === activeDocId);

    return (
        <div className="relative flex h-full w-full flex-col bg-slate-900/50">
            {openDocuments.length > 0 && (
                <div className="flex w-full items-center gap-1 overflow-x-auto border-b border-white/5 bg-black/40 p-1 scrollbar-thin">
                    {openDocuments.map(doc => (
                        <div
                            key={doc.id}
                            className={`group flex items-center gap-2 rounded-t-lg border-b-2 px-3 py-1.5 font-mono text-xs transition-colors ${
                                activeDocId === doc.id
                                    ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                                    : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
                            }`}
                        >
                            <button
                                onClick={() => setActiveDocId(doc.id)}
                                className="max-w-[120px] truncate"
                                title={doc.id}
                            >
                                {doc.id.substring(0, 12)}...
                            </button>
                            <button
                                onClick={() => closeDocument(doc.id)}
                                className="opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="ml-auto flex items-center justify-center p-1.5 text-slate-500 hover:text-blue-400"
                        title="Adicionar Arquivo"
                    >
                        <UploadCloud size={16} />
                    </button>
                </div>
            )}

            {activeDoc ? (
                <iframe
                    src={`${API_URL}/files/${activeDoc.id}#page=${activeDoc.page}`}
                    title="Solipsys PDF Viewer"
                    className="flex-1 w-full border-none"
                />
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <UploadCloud className="mb-4 h-16 w-16 text-blue-500/50" />
                    <h2 className="mb-2 font-mono text-xl font-bold text-blue-400">Vault Semântico Vazio</h2>
                    <p className="mb-6 max-w-md text-sm text-slate-400">
                        Alimente meu núcleo com conhecimento. Faça o upload de um documento para iniciar o mapeamento neural.
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="rounded-lg border border-blue-500/50 bg-blue-600/20 px-6 py-3 font-mono text-sm text-blue-400 transition-all hover:bg-blue-600/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    >
                        {isUploading ? 'Assimiliando...' : '+ Injetar Conhecimento (PDF)'}
                    </button>
                </div>
            )}
            <input type="file" accept="application/pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        </div>
    );
};