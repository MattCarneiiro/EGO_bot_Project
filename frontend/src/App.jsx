import { useState, useEffect, useRef } from 'react';
import { Send, Terminal, BookOpen, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EgoCoreOrb from './components/EgoCoreOrb';
import Message from './components/Message';
import CoreStability from './components/CoreStability';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [workspaceText, setWorkspaceText] = useState(''); // Estado para o texto do editor
  const [isTyping, setIsTyping] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
          context: workspaceText // Enviando o texto do editor como contexto!
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ego', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ego', content: "Conexão perdida. Meu hardware Alpha não é fã desse seu localhost." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen relative overflow-hidden bg-[#09090b]">
      <AnimatePresence>
        {isBooting ? (
          <motion.div key="loader" exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center z-50">
            <EgoCoreOrb size="large" />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 font-mono text-blue-500 text-xs tracking-[0.5em] uppercase">
              Initializing EGO_PROJECT v0.1 Alpha
            </motion.div>
          </motion.div>
        ) : (
          <motion.main
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex w-[95vw] h-[92vh] bg-zinc-950/40 rounded-[2.5rem] backdrop-blur-3xl border border-blue-500/20 shadow-[0_0_80px_rgba(59,130,246,0.15)] overflow-hidden"
          >
            {/* SIDEBAR */}
            <div className="w-64 border-r border-zinc-800/50 flex flex-col items-center py-10 bg-black/20">
              <EgoCoreOrb size="small" />
              <div className="mt-6 font-mono text-[10px] text-zinc-600 uppercase tracking-tighter">Alpha Status: Optimal</div>
            </div>

            {/* ÁREA DE CONTEÚDO (DUAS COLUNAS) */}
            <div className="flex-1 flex overflow-hidden">

              {/* COLUNA ESQUERDA: EDITOR DE TEXTO */}
              <section className="flex-1 border-r border-zinc-800/30 flex flex-col bg-black/10">
                <header className="h-12 border-b border-zinc-800/30 flex items-center px-6 gap-2">
                  <PenTool size={12} className="text-zinc-500" />
                  <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Workspace // Input_Field</span>
                </header>
                <textarea
                  value={workspaceText}
                  onChange={(e) => setWorkspaceText(e.target.value)}
                  placeholder="Insira o texto que deseja que eu analise ou melhore..."
                  className="flex-1 bg-transparent p-10 focus:ring-0 border-none text-zinc-300 font-serif text-lg leading-relaxed resize-none placeholder:text-zinc-800 scrollbar-hide"
                  spellCheck="false"
                />
              </section>

              {/* COLUNA DIREITA: O CHAT (EGO) */}
              <section className="w-[480px] flex flex-col bg-black/40 backdrop-blur-md">
                <header className="h-12 border-b border-zinc-800/30 flex items-center px-6 justify-between">
                  <div className="flex items-center">
                    <Terminal size={14} className="text-blue-500 mr-2" />
                    <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">EGO_PROJECT v0.1 Alpha</span>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale p-10">
                      <BookOpen size={40} className="mb-4" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">Aguardando entrada para análise.</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <Message key={i} role={m.role} content={m.content} />
                  ))}
                  {isTyping && <div className="text-blue-500 animate-pulse font-mono text-[10px] ml-4">Analisando sua mediocridade...</div>}
                  <div ref={scrollRef} />
                </div>

                {/* ÁREA DE INPUT DO CHAT */}
                <div className="p-6 border-t border-zinc-800/30">
                  <div className="flex gap-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 pr-4 focus-within:border-blue-500/40 transition-all shadow-xl">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Peça uma análise ou correção..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-200 px-4 py-3 text-xs"
                    />
                    <button onClick={sendMessage} className="p-2 text-blue-500 hover:scale-110 transition-transform">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <CoreStability />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;