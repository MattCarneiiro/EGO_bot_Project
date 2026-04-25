import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Reader } from './components/workspace/Reader';
import { Writer } from './components/workspace/Writer';
import { ChatPanel } from './components/chat/ChatPanel';
import './styles/theme.css';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [focus, setFocus] = useState('initial');
  const [mode, setMode] = useState('reader');

  const [currentPdf, setCurrentPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [messages, setMessages] = useState([
    { sender: 'EGO', text: 'Tailwind expurgado. CSS Puro ativado. Como procederemos?' }
  ]);

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
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono" style={{ color: '#4ade80' }}>
          [ EGO_KERNEL v0.4 ] COMPILING VANILLA CSS...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-black p-2 gap-2"
      onMouseDown={(e) => setFocus(e.clientX < window.innerWidth / 2 ? 'workspace' : 'chat')}
    >
      {/* PAINEL ESQUERDO: WORKSPACE */}
      <motion.section
        className="glass-panel relative rounded-xl border border-blue-500/30 overflow-hidden flex flex-col"
        animate={{ flex: focus === 'workspace' ? 3 : focus === 'chat' ? 0.8 : 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <div className="flex gap-2 p-2 font-mono border-b border-blue-500/30 bg-black/40">
          <button
            onClick={() => setMode('reader')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${mode === 'reader' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            📖 Vault Reader
          </button>
          <button
            onClick={() => setMode('writer')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${mode === 'writer' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            ✍️ EGO Canvas
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {mode === 'reader' ? (
            <Reader currentPdf={currentPdf} currentPage={currentPage} onPdfChange={handlePdfFocus} />
          ) : (
            <Writer />
          )}
        </div>
      </motion.section>

      {/* PAINEL DIREITO: CHAT */}
      <motion.section
        className="glass-panel relative rounded-xl border border-purple-500/30 overflow-hidden"
        animate={{ flex: focus === 'chat' ? 1.5 : focus === 'workspace' ? 0.4 : 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <ChatPanel messages={messages} setMessages={setMessages} onFocusPdf={handlePdfFocus} />
      </motion.section>
    </div>
  );
}