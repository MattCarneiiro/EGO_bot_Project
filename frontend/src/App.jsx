// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import { Send, Terminal, BookOpen, PenTool, Cpu, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Componentes do ecossistema Ego
import EgoCoreOrb from './components/EgoCoreOrb';
import Message from './components/Message';
import CoreStability from './components/CoreStability';
import KnowledgeDock from './components/KnowledgeDock';

function App() {
  // --- ESTADOS DE INTERFACE E BOOT ---
  const [isBooting, setIsBooting] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // --- ESTADOS DE DADOS ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [workspaceText, setWorkspaceText] = useState('');

  // --- ESTADOS DE MEMÓRIA SEMÂNTICA (v0.2) ---
  const [activeTags, setActiveTags] = useState(["#Geral"]); // Começa apenas com a base
  const [highlightedTag, setHighlightedTag] = useState(null);

  const scrollRef = useRef(null);

  // 1. Inicialização do Sistema
  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // 2. Gestão de Foco no Chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 3. BUSCA SEMÂNTICA REAL (O Adereço de Lembrança)
  // Agora ele pergunta ao backend o que existe de relevante no banco de dados
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (workspaceText.length > 15) {
        try {
          const res = await fetch('http://127.0.0.1:5000/query_memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: workspaceText })
          });
          const data = await res.json();

          // Se o backend encontrar uma tag correlacionada, ela brilha na Doca
          setHighlightedTag(data.activeTag);
        } catch (err) {
          console.error("EGO_MEMORY_ERROR: Falha na consulta semântica.");
        }
      }
    }, 1500); // 1.5s de pausa na digitação ativa a busca profunda

    return () => clearTimeout(delayDebounceFn);
  }, [workspaceText]);

  // 4. SISTEMA DE MINERAÇÃO DE PDF (Upload)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // O Ego exige uma categoria para organizar sua bagunça
    const tag = prompt("Defina uma #Tag para este conhecimento (ex: #Recursão):", "#Estudo");
    if (!tag) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tag', tag);

    setIsTyping(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/upload_pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      // Atualiza as tags visíveis e avisa no chat
      setActiveTags(prev => Array.from(new Set([...prev, tag])));
      setMessages(prev => [...prev, { role: 'ego', content: `[SISTEMA] Documento processado. Memória expandida com sucesso sob a tag ${tag}.` }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ego', content: "Erro crítico no upload. Verifique o servidor Flask." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // 5. COMUNICAÇÃO COM O NÚCLEO
  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          context: workspaceText
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ego', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ego', content: "Conexão perdida. Estou operando em modo offline?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen relative overflow-hidden bg-[#050507]">

      <AnimatePresence>
        {isBooting ? (
          <motion.div
            key="loader"
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            className="flex flex-col items-center z-50"
          >
            <EgoCoreOrb size="large" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 font-mono text-blue-500 text-[10px] tracking-[0.6em] uppercase animate-pulse"
            >
              Initializing EGO_PROJECT v0.1 Alpha
            </motion.div>
          </motion.div>
        ) : (
          <motion.main
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="relative flex w-[96vw] h-[94vh] bg-zinc-950/40 rounded-[2.5rem] backdrop-blur-3xl border border-blue-500/20 shadow-[0_0_100px_rgba(59,130,246,0.1)] overflow-hidden"
          >

            {/* SIDEBAR: CONTROLES DE SISTEMA */}
            <aside className="w-24 border-r border-zinc-800/50 flex flex-col items-center py-10 bg-black/40">
              <EgoCoreOrb size="small" />

              {/* Botão de Upload de Conhecimento (PDF) */}
              <label className="mt-10 p-3 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-blue-500 hover:border-blue-500/50 cursor-pointer transition-all shadow-lg group">
                <UploadCloud size={20} className="group-hover:scale-110 transition-transform" />
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileUpload}
                />
              </label>

              <div className="mt-auto mb-4 orientation-sideways">
                <span className="text-[8px] font-mono text-zinc-700 tracking-[0.5em] uppercase transform -rotate-90 block">
                  Alpha_Core_v0.1
                </span>
              </div>
            </aside>

            {/* CONTAINER CENTRAL: EDITOR + CHAT + DOCA */}
            <div className="flex-1 flex overflow-hidden">

              {/* EDITOR (INPUT SEMÂNTICO) */}
              <section className="flex-1 border-r border-zinc-800/30 flex flex-col bg-black/10">
                <header className="h-12 border-b border-zinc-800/30 flex items-center px-8 gap-3">
                  <PenTool size={14} className="text-zinc-600" />
                  <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Creative_Input // Workspace</span>
                </header>
                <textarea
                  value={workspaceText}
                  onChange={(e) => setWorkspaceText(e.target.value)}
                  placeholder="Escreva algo e eu buscarei em minha memória..."
                  className="flex-1 bg-transparent p-12 focus:ring-0 border-none text-zinc-300 font-serif text-xl leading-relaxed resize-none placeholder:text-zinc-900 scrollbar-hide"
                  spellCheck="false"
                />
              </section>

              {/* CHAT (O INTERPRETADOR) */}
              <section className="w-[450px] flex flex-col bg-black/20">
                <header className="h-12 border-b border-zinc-800/30 flex items-center px-6 bg-black/40">
                  <Terminal size={14} className="text-blue-500 mr-3" />
                  <span className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase">EGO_ANALYSIS_MODAL</span>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                      <Cpu size={32} className="mb-4 text-zinc-500" />
                      <p className="text-[9px] font-mono uppercase tracking-[0.3em]">System Idle // Waiting for Data</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <Message key={i} role={m.role} content={m.content} />
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-blue-500 font-mono text-[9px] ml-4">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce [animation-delay:0.2s]">.</span>
                      <span className="animate-bounce [animation-delay:0.4s]">.</span>
                      ANALYZING_CONTEXT
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>

                <div className="p-6 border-t border-zinc-800/30 bg-black/40">
                  <div className="flex gap-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-2 focus-within:border-blue-500/40 transition-all shadow-xl">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Instrução para o núcleo..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-200 px-4 py-2 text-xs"
                    />
                    <button onClick={sendMessage} className="p-2 text-blue-500 hover:scale-110 transition-transform">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </section>

              {/* DOCA SEMÂNTICA (O NEXUS DE TAGS) */}
              <KnowledgeDock
                tags={activeTags}
                activeTag={highlightedTag}
              />
            </div>

            <CoreStability />

          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;