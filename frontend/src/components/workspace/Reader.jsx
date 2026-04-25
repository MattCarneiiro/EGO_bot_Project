import React, { useRef, useState } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export const Reader = ({ currentPdf, currentPage, onPdfChange }) => {
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

    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center bg-slate-900/50">
            {currentPdf ? (
                <iframe
                    src={`${API_URL}/files/${currentPdf}#page=${currentPage}`}
                    title="Solipsys PDF Viewer"
                    className="h-full w-full border-none"
                />
            ) : (
                <div className="flex flex-col items-center p-8 text-center">
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
                    <input type="file" accept="application/pdf" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
            )}
        </div>
    );
};