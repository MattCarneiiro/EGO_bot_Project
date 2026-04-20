import { useState, useEffect, useRef } from 'react';
import { Send, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EgoCoreOrb from './components/EgoCoreOrb';
import Message from './components/Message';
import CoreStability from './components/CoreStability';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBooting, setIsBooting] = useState(true); // Controle da animação de entrada
  const scrollRef = useRef(null);

  useEffect(() => {
    // Simula o tempo de "carregamento" do núcleo antes de mover
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
    setInput('');
    setIsTyping(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ego', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ego', content: "Conexão perdida com o núcleo." }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen relative overflow-hidden bg-[#09090b]">

      <AnimatePresence>
        {isBooting ? (
          // FASE 1: O NÚCLEO NO CENTRO
          <motion.div
            key="loader"
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center z-50"
          >
            <EgoCoreOrb size="large" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 font-mono text-blue-500 text-xs tracking-[0.5em] uppercase animate-pulse"
            >
              Initializing EGO_CORE
            </motion.div>
          </motion.div>
        ) : (
          // FASE 2: A INTERFACE COMPLETA (Redimensionada)
          <motion.main
            key="main"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex w-[95vw] h-[92vh] bg-zinc-950/40 rounded-[2.5rem] backdrop-blur-3xl border border-blue-500/20 shadow-[0_0_80px_rgba(59,130,246,0.15)] overflow-hidden"
          >

            {/* Sidebar com o Orbe agora pequeno */}
            <div className="w-64 border-r border-zinc-800/50 flex flex-col items-center py-10 bg-black/20">
              <EgoCoreOrb size="small" />
              <div className="mt-6 font-mono text-[10px] text-zinc-600 tracking-tighter uppercase">Status: Optimal</div>
            </div>

            <div className="flex-1 flex flex-col h-full">
              <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-8 bg-black/20">
                <div className="flex items-center">
                  <Terminal size={16} className="text-blue-500 mr-3" />
                  <h2 className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">EGO_PROTOCOL v0.1 Alpha // INFRASTRUCTURE_READY</h2>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth">
                {messages.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center text-zinc-700 font-mono text-xs italic">
                    Núcleo ocioso. O que deseja agora, Criador?
                  </motion.div>
                )}
                {messages.map((m, i) => (
                  <Message key={i} role={m.role} content={m.content} />
                ))}
                {isTyping && <div className="text-blue-500 animate-pulse font-mono text-[10px] ml-4">Processando lógica...</div>}
                <div ref={scrollRef} />
              </div>

              <div className="p-10 bg-gradient-to-t from-black/40 to-transparent">
                <div className="max-w-4xl mx-auto flex gap-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 pr-4 focus-within:border-blue-500/40 transition-all shadow-2xl">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Comando para o sistema..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-200 px-4 py-3 text-sm"
                  />
                  <button onClick={sendMessage} className="p-2 text-blue-500 hover:scale-110 transition-transform">
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>

            <CoreStability />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;