import { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Cpu, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading]);

  const send = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ego', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ego', content: "Conexão perdida com o Criador." }]);
    } finally { setLoading(false) }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-300">
      <aside className="w-64 border-r border-zinc-800 p-6 hidden md:block">
        <div className="flex items-center gap-3 mb-8"><Cpu className="text-blue-500" /><span className="font-bold">EGO_CORE</span></div>
        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" size={14} /> Protocolo Ativo
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-zinc-800 flex items-center px-6 text-xs font-mono text-zinc-500 uppercase tracking-widest">
          <Terminal size={14} className="mr-2" /> Ego_Interface_v2.5
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:px-20 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-zinc-900 border border-zinc-800'}`}>
                <div className="prose prose-invert prose-sm">
                  <ReactMarkdown components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                      ) : <code className="bg-zinc-800 px-1 rounded" {...props}>{children}</code>
                    }
                  }}>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && <div className="text-blue-500 animate-pulse text-[10px] font-mono">EGO PROCESSANDO...</div>}
          <div ref={scrollRef} />
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto flex gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Envie um comando..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2"
            />
            <button onClick={send} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl"><Send size={18} /></button>
          </div>
        </div>
      </main>
    </div>
  );
}