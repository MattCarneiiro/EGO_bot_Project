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
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('ego_workspace_mode') || 'reader';
  });

  const [openDocuments, setOpenDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem('ego_open_docs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse open docs", e);
    }
    return [];
  });
  
  const [activeDocId, setActiveDocId] = useState(() => {
    return localStorage.getItem('ego_active_doc') || null;
  });
  
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('ego_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse chat history", e);
    }
    return [{ sender: 'EGO', text: 'Conexões telepáticas restabelecidas. Pode escrever o seu texto.' }];
  });
  
  const [draftText, setDraftText] = useState(() => {
    return localStorage.getItem('ego_draft_text') || '# EGO Canvas\n\nRedija seus pensamentos aqui...';
  });
  
  const [userAnchors, setUserAnchors] = useState(() => {
    try {
      const saved = localStorage.getItem('ego_user_anchors');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  
  const [suggestion, setSuggestion] = useState(null);
  const [suggestedPdfs, setSuggestedPdfs] = useState([]);

  useEffect(() => {
    localStorage.setItem('ego_user_anchors', JSON.stringify(userAnchors));
  }, [userAnchors]);

  const addAnchor = async (anchor) => {
    setUserAnchors(prev => {
        // Evita duplicatas exatas na UI local
        if (prev.find(a => a.text === anchor.text)) return prev;
        return [...prev, anchor];
    });
    
    try {
        await axios.post('http://localhost:5000/add_anchor', {
            doc_id: anchor.docId,
            text: anchor.text,
            page: anchor.page
        });
    } catch (e) {
        console.error("Erro ao persistir âncora no Solipsys:", e);
    }
  };

  useEffect(() => {
    setTimeout(() => setBooting(false), 2000);
  }, []);

  useEffect(() => {
    const safeMessages = messages.map(m => {
      if (typeof m.text === 'string') return m;
      let extracted = "Interação recuperada.";
      try {
        if (m.text?.props?.children?.props?.children) {
          extracted = m.text.props.children.props.children;
        }
      } catch (e) {}
      return { sender: m.sender, text: extracted };
    });
    localStorage.setItem('ego_chat_history', JSON.stringify(safeMessages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('ego_draft_text', draftText);
  }, [draftText]);

  useEffect(() => {
    localStorage.setItem('ego_workspace_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('ego_open_docs', JSON.stringify(openDocuments));
  }, [openDocuments]);

  useEffect(() => {
    if (activeDocId) {
      localStorage.setItem('ego_active_doc', activeDocId);
    } else {
      localStorage.removeItem('ego_active_doc');
    }
  }, [activeDocId]);

  const clearSession = () => {
    localStorage.removeItem('ego_chat_history');
    localStorage.removeItem('ego_draft_text');
    localStorage.removeItem('ego_workspace_mode');
    localStorage.removeItem('ego_open_docs');
    localStorage.removeItem('ego_active_doc');
    localStorage.removeItem('ego_user_anchors');
    
    setMessages([{ sender: 'EGO', text: 'Conexões telepáticas restabelecidas. Pode escrever o seu texto.' }]);
    setDraftText('# EGO Canvas\n\nRedija seus pensamentos aqui...');
    setMode('reader');
    setOpenDocuments([]);
    setActiveDocId(null);
    setUserAnchors([]);
  };

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
              onAddAnchor={addAnchor}
              userAnchors={userAnchors}
              suggestedPdfs={suggestedPdfs}
            />
          ) : (
            <Writer text={draftText} setText={setDraftText} suggestion={suggestion} setSuggestion={setSuggestion} />
          )}
        </div>
      </motion.section>

      <AnimatePresence>
        {(suggestedPdfs.length > 0 || userAnchors.length > 0) && (
          <motion.section
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="glass-panel flex flex-col overflow-hidden rounded-xl border-purple-500/30 bg-black/50 border"
          >
            <div className="p-3 border-b border-purple-500/20 bg-purple-900/20 flex items-center gap-2">
              <Activity size={16} className="text-purple-500" />
              <span className="font-mono text-xs text-purple-400 uppercase tracking-widest">Painel de Epifania</span>
              <button onClick={() => setSuggestedPdfs([])} className="ml-auto text-slate-400 hover:text-white" title="Fechar Sugestões do EGO">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
              
              {(userAnchors.length > 0 || suggestedPdfs.some(s => s.metadata.tags && s.metadata.tags.includes('#UserAnchor'))) && (
                <div className="space-y-2">
                  <h3 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Âncoras do Criador
                  </h3>
                  
                  {userAnchors.map((anchor, idx) => (
                    <div
                      key={`local-anchor-${idx}`}
                      className="group relative cursor-pointer rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-3 transition-all hover:border-emerald-500/50 hover:bg-emerald-900/20"
                    >
                      <button 
                        className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 text-slate-500 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserAnchors(prev => prev.filter((_, i) => i !== idx));
                        }}
                        title="Remover Âncora Local"
                      >
                        ✕
                      </button>
                      <div onClick={() => handlePdfFocus(anchor.docId, anchor.page)}>
                        <p className="mb-2 text-xs leading-relaxed italic text-slate-200">"{anchor.text.length > 100 ? anchor.text.substring(0, 100) + '...' : anchor.text}"</p>
                        <span className="font-mono text-[10px] text-emerald-500/80 group-hover:text-emerald-400">
                          📄 Pág {anchor.page} | {anchor.docId} (Local)
                        </span>
                      </div>
                    </div>
                  ))}

                  {suggestedPdfs.filter(s => s.metadata.tags && s.metadata.tags.includes('#UserAnchor')).map((res, idx) => {
                    const docIdWithExt = res.metadata.doc_id.endsWith('.pdf') ? res.metadata.doc_id : `${res.metadata.doc_id}.pdf`;
                    return (
                    <div
                      key={`db-anchor-${idx}`}
                      onClick={() => handlePdfFocus(docIdWithExt, res.metadata.page)}
                      className="group cursor-pointer rounded-lg border border-emerald-500/40 bg-emerald-900/20 p-3 transition-all hover:border-emerald-500/70 hover:bg-emerald-900/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    >
                      <p className="mb-2 text-xs leading-relaxed italic text-slate-200">"{res.text.substring(0, 100)}..."</p>
                      <span className="font-mono text-[10px] text-emerald-400 group-hover:text-emerald-300">
                        📄 Pág {res.metadata.page} | Resgatado da Memória
                      </span>
                    </div>
                  )})}
                </div>
              )}

              {suggestedPdfs.filter(s => !(s.metadata.tags && s.metadata.tags.includes('#UserAnchor'))).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 mt-4 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    Sugestões do EGO
                  </h3>
                  {suggestedPdfs.filter(s => !(s.metadata.tags && s.metadata.tags.includes('#UserAnchor'))).map((res, idx) => {
                    const docIdWithExt = res.metadata.doc_id.endsWith('.pdf') ? res.metadata.doc_id : `${res.metadata.doc_id}.pdf`;
                    return (
                    <div
                      key={`sug-${idx}`}
                      onClick={() => handlePdfFocus(docIdWithExt, res.metadata.page)}
                      className="group cursor-pointer rounded-lg border border-purple-500/20 bg-purple-900/10 p-3 transition-all hover:border-purple-500/50 hover:bg-purple-900/20"
                    >
                      <p className="mb-2 text-xs leading-relaxed italic text-slate-200">"{res.text.substring(0, 100)}..."</p>
                      <span className="font-mono text-[10px] text-purple-500/80 group-hover:text-purple-400">
                        📄 Pág {res.metadata.page} | {res.metadata.tags}
                      </span>
                    </div>
                  )})}
                </div>
              )}

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
          onClearSession={clearSession}
          userAnchors={userAnchors}
        />
      </motion.section>
    </div>
  );
}