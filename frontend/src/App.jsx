import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reader } from './components/workspace/Reader';
import { Writer } from './components/workspace/Writer';
import { ChatPanel } from './components/chat/ChatPanel';
import { Activity } from 'lucide-react';
import { cn } from './lib/utils';
import './styles/theme.css';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [focus, setFocus] = useState('initial');
  const [mode, setMode] = useState('reader');

  const [openDocuments, setOpenDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  
  const [messages, setMessages] = useState([
    { sender: 'EGO', text: 'Conexões telepáticas restabelecidas. Pode escrever o seu texto.' }
  ]);
  const [draftText, setDraftText] = useState('# EGO Canvas\n\nRedija seus pensamentos aqui...');
  const [suggestion, setSuggestion] = useState(null);
  const [suggestedPdfs, setSuggestedPdfs] = useState([]);

  useEffect(() => {
    setTimeout(() => setBooting(false), 2000);
  }, []);

  const handlePdfFocus = (pdfName, pageNum) => {
    setOpenDocuments(prev => {
      if (prev.find(d => d.id === pdfName)) {
        return prev.map(d => d.id === pdfName ? { ...d, page: pageNum } : d);
      }
      return [...prev, { id: pdfName, page: pageNum }];
    });
    setActiveDocId(pdfName);
    setMode('reader');
    setFocus('workspace');
  };

  const closeDocument = (pdfName) => {
    setOpenDocuments(prev => {
      const newDocs = prev.filter(d => d.id !== pdfName);
      if (activeDocId === pdfName) {
        setActiveDocId(newDocs.length > 0 ? newDocs[0].id : null);
      }
      return newDocs;
    });
  };

  if (booting) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black font-mono">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl tracking-widest text-green-500">
          [ EGO_KERNEL v0.7 ] CONNECTING TELEPATHY...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen gap-2 overflow-hidden bg-black p-2"
      onMouseDown={(e) => {
        if (e.target.closest('.chat-panel-container')) setFocus('chat');
        else if (e.target.closest('.workspace-panel')) setFocus('workspace');
      }}
    >
      <motion.section
        className="glass-panel workspace-panel flex flex-col overflow-hidden rounded-xl border-blue-500/30"
        animate={{ flex: focus === 'workspace' ? 3 : focus === 'chat' ? 0.8 : 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <div className="flex border-b border-white/10 bg-black/80 font-mono">
          <button
            onClick={() => setMode('reader')}
            className={cn(
              "flex-1 py-3 text-xs uppercase tracking-widest transition-all",
              mode === 'reader' ? "border-b-2 border-blue-500 bg-blue-900/10 text-blue-400" : "text-slate-600 hover:bg-white/5 hover:text-slate-400"
            )}
          >
            📖 Vault Reader
          </button>
          <button
            onClick={() => setMode('writer')}
            className={cn(
              "flex-1 py-3 text-xs uppercase tracking-widest transition-all",
              mode === 'writer' ? "border-b-2 border-blue-500 bg-blue-900/10 text-blue-400" : "text-slate-600 hover:bg-white/5 hover:text-slate-400"
            )}
          >
            ✍️ EGO Canvas
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {mode === 'reader' ? (
            <Reader 
              openDocuments={openDocuments} 
              activeDocId={activeDocId} 
              setActiveDocId={setActiveDocId} 
              closeDocument={closeDocument} 
              onPdfChange={handlePdfFocus} 
            />
          ) : (
            <Writer text={draftText} setText={setDraftText} suggestion={suggestion} setSuggestion={setSuggestion} />
          )}
        </div>
      </motion.section>

      <AnimatePresence>
        {suggestedPdfs.length > 0 && (
          <motion.section
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="glass-panel flex flex-col overflow-hidden rounded-xl border-yellow-500/30 bg-black/50 border"
          >
            <div className="p-3 border-b border-yellow-500/20 bg-yellow-900/20 flex items-center gap-2">
              <Activity size={16} className="text-yellow-500" />
              <span className="font-mono text-xs text-yellow-400 uppercase tracking-widest">Painel de Epifania</span>
              <button onClick={() => setSuggestedPdfs([])} className="ml-auto text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
              {suggestedPdfs.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => handlePdfFocus(`${res.metadata.doc_id}.pdf`, res.metadata.page)}
                  className="group cursor-pointer rounded border border-yellow-500/20 bg-yellow-900/10 p-3 transition-all hover:border-yellow-500/50 hover:bg-yellow-900/30"
                >
                  <p className="mb-2 text-xs leading-relaxed italic text-slate-300">"{res.text.substring(0, 100)}..."</p>
                  <span className="font-mono text-[10px] text-yellow-500 group-hover:text-yellow-400">
                    📄 Pág {res.metadata.page} | {res.metadata.tags}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.section
        className="glass-panel chat-panel-container flex flex-col overflow-hidden rounded-xl border-purple-500/20"
        animate={{ flex: focus === 'chat' ? 1.5 : focus === 'workspace' ? 0.4 : 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <ChatPanel
          messages={messages}
          setMessages={setMessages}
          onFocusPdf={handlePdfFocus}
          draftText={draftText}
          setSuggestion={setSuggestion}
          setSuggestedPdfs={setSuggestedPdfs}
        />
      </motion.section>
    </div>
  );
}