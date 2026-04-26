import React, { useRef, useState } from 'react';
import axios from 'axios';
import { UploadCloud, Anchor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_URL = 'http://localhost:5000';

export const Reader = ({ openDocuments = [], activeDocId, setActiveDocId, closeDocument, onPdfChange, onAddAnchor, userAnchors = [], suggestedPdfs = [] }) => {
    const fileInputRef = useRef(null);
    const readerRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [numPages, setNumPages] = useState(null);

    const [selectionRect, setSelectionRect] = useState(null);
    const [selectedText, setSelectedText] = useState("");

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

    const handleMouseUp = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text && text.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            if (readerRef.current) {
                const containerRect = readerRef.current.getBoundingClientRect();
                setSelectionRect({
                    top: rect.top - containerRect.top - 45,
                    left: rect.left - containerRect.left + (rect.width / 2) - 50
                });
                setSelectedText(text);
            }
        } else {
            setSelectionRect(null);
            setSelectedText("");
        }
    };

    const handleCreateAnchor = () => {
        let textToAnchor = selectedText;
        if (!textToAnchor) {
            const selection = window.getSelection();
            textToAnchor = selection.toString().trim();
        }

        if (textToAnchor && activeDoc) {
            if (onAddAnchor) {
                onAddAnchor({
                    docId: activeDoc.id,
                    page: activeDoc.page || 1,
                    text: textToAnchor,
                    timestamp: new Date().toISOString()
                });
            }
            setSelectionRect(null);
            setSelectedText("");
            window.getSelection().removeAllRanges();
        }
    };

    const activeDoc = openDocuments.find(d => d.id === activeDocId);

    const textRenderer = ({ str }) => {
        if (!str || str.trim().length < 5 || !activeDoc) return str;
        
        const cleanStr = str.replace(/\s+/g, '').toLowerCase();
        
        const currentPageAnchors = userAnchors.filter(a => a.docId === activeDoc.id && a.page === (activeDoc.page || 1));
        const isAnchor = currentPageAnchors.some(a => {
            const ancText = a.text.replace(/\s+/g, '').toLowerCase();
            return (ancText.includes(cleanStr) && cleanStr.length > 15) || cleanStr.includes(ancText);
        });

        const currentPageSuggestions = suggestedPdfs.filter(s => `${s.metadata.doc_id}.pdf` === activeDoc.id && s.metadata.page === (activeDoc.page || 1));
        const isSuggestion = currentPageSuggestions.some(s => {
            const sugText = s.text.replace(/\s+/g, '').toLowerCase();
            return (sugText.includes(cleanStr) && cleanStr.length > 15) || cleanStr.includes(sugText);
        });

        if (isAnchor) {
            return `<mark style="background-color: rgba(16, 185, 129, 0.4); color: transparent; padding: 2px 0; border-radius: 2px; border-bottom: 2px solid #10b981;">${str}</mark>`;
        }
        if (isSuggestion) {
            return `<mark style="background-color: rgba(168, 85, 247, 0.4); color: transparent; padding: 2px 0; border-radius: 2px; border-bottom: 2px solid #a855f7;">${str}</mark>`;
        }
        
        return str;
    };

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
                        onClick={handleCreateAnchor}
                        className="ml-auto flex items-center justify-center p-1.5 text-emerald-500/80 hover:text-emerald-400 transition-colors"
                        title="Ancorar Seleção Atual"
                    >
                        <Anchor size={16} />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="ml-2 flex items-center justify-center p-1.5 text-slate-500 hover:text-blue-400"
                        title="Adicionar Arquivo"
                    >
                        <UploadCloud size={16} />
                    </button>
                </div>
            )}

            {activeDoc ? (
                <div 
                    ref={readerRef}
                    className="relative flex-1 w-full overflow-y-auto overflow-x-hidden bg-slate-800 flex justify-center py-8 scrollbar-thin"
                    onMouseUp={handleMouseUp}
                >
                    <AnimatePresence>
                        {selectionRect && (
                            <motion.button
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                                onClick={handleCreateAnchor}
                                style={{ top: selectionRect.top, left: selectionRect.left }}
                                className="absolute z-50 flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-900/90 px-4 py-2 font-mono text-xs font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] backdrop-blur-md transition-colors hover:bg-emerald-800"
                            >
                                <Anchor size={14} /> Ancorar
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <Document
                        file={`${API_URL}/files/${activeDoc.id}`}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        onLoadError={error => console.error("Falha detalhada ao carregar PDF:", error)}
                        className="flex flex-col items-center"
                        loading={
                            <div className="font-mono text-sm text-blue-500 animate-pulse">
                                Decodificando arranjo visual...
                            </div>
                        }
                    >
                        <Page 
                            pageNumber={activeDoc.page || 1} 
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            customTextRenderer={textRenderer}
                            className="shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                        />
                    </Document>
                    
                    {/* Controles de Paginação Nativos do react-pdf (Opcional, pois App já controla page, mas útil) */}
                    <div className="fixed bottom-6 right-6 flex items-center gap-4 rounded-full border border-blue-500/30 bg-black/80 px-4 py-2 font-mono text-xs text-blue-400 shadow-xl backdrop-blur-md">
                        <button 
                            disabled={(activeDoc.page || 1) <= 1}
                            onClick={() => onPdfChange(activeDoc.id, (activeDoc.page || 1) - 1)}
                            className="hover:text-white disabled:opacity-50"
                        >
                            ◄
                        </button>
                        <span>{activeDoc.page || 1} / {numPages || '?'}</span>
                        <button 
                            disabled={numPages && (activeDoc.page || 1) >= numPages}
                            onClick={() => onPdfChange(activeDoc.id, (activeDoc.page || 1) + 1)}
                            className="hover:text-white disabled:opacity-50"
                        >
                            ►
                        </button>
                    </div>
                </div>
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