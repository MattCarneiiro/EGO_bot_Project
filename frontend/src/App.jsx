import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Reader } from './components/workspace/Reader';
import { Writer } from './components/workspace/Writer';
import { ChatPanel } from './components/chat/ChatPanel';
import { cn } from './lib/utils';
import './styles/theme.css';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [focus, setFocus] = useState('initial');
  const [mode, setMode] = useState('reader');

  const [currentPdf, setCurrentPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [messages, setMessages] = useState([
    { sender: 'EGO', text: 'Conexões telepáticas restabelecidas. Pode escrever o seu Pokémon.' }
  ]);

  // ESTADO RESTAURADO: O App agora controla e compartilha o texto
  const [draftText, setDraftText] = useState('# EGO Canvas\n\nRedija seus pensamentos aqui...');

  useEffect(() => {
    setTimeout(() => setBooting(false), 2000);
  }, []);

  const handlePdfFocus = (pdfName, pageNum) => {
    setCurrentPdf(pdfName);
    setCurrentPage(pageNum);
    setMode('reader');
    setFocus('workspace');
  };

  if (booting) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black font-mono">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl tracking-widest text-green-500">
          [ EGO_KERNEL v0.6 ] CONNECTING TELEPATHY...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen gap-2 overflow-hidden bg-black p-2"
      onMouseDown={(e) => setFocus(e.clientX < window.innerWidth / 2 ? 'workspace' : 'chat')}
    >
      <motion.section
        className="glass-panel flex flex-col overflow-hidden rounded-xl border-blue-500/30"
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
            <Reader currentPdf={currentPdf} currentPage={currentPage} onPdfChange={handlePdfFocus} />
          ) : (
            <Writer text={draftText} setText={setDraftText} />
          )}
        </div>
      </motion.section>

      <motion.section
        className="glass-panel flex flex-col overflow-hidden rounded-xl border-purple-500/20"
        animate={{ flex: focus === 'chat' ? 1.5 : focus === 'workspace' ? 0.4 : 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <ChatPanel
          messages={messages}
          setMessages={setMessages}
          onFocusPdf={handlePdfFocus}
          draftText={draftText}
        />
      </motion.section>
    </div>
  );
}