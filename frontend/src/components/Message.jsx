// src/components/Message.jsx
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AlertTriangle, Cpu, User } from 'lucide-react';
import { motion } from "framer-motion";

export default function Message({ role, content }) {
    const isWarning = content.includes('[CRITICAL WARNING]');

    let style = "bg-zinc-900/40 border-zinc-800/80 rounded-2xl p-5";
    let icon = <User className="w-5 h-5 text-zinc-400" />;
    let glow = "border border-zinc-800";

    if (role === 'ego') {
        icon = <Cpu className="w-5 h-5 text-blue-400" />;
        style = "bg-blue-900/10 border-blue-500/20 rounded-2xl rounded-tl-none p-5";
        glow = "border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]";
    }

    if (isWarning) {
        icon = <AlertTriangle className="w-5 h-5 text-red-500" />;
        style = "bg-red-900/10 border-red-500/40 rounded-2xl rounded-tl-none p-5";
        glow = "border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)]";
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-4 ${role === 'user' ? 'justify-end' : ''}`}
        >
            {role !== 'user' && <div className="mt-1">{icon}</div>}
            <div className={`${style} ${glow} max-w-[85%]`}>
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown components={{
                        code({ inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                                <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                            ) : <code className="bg-zinc-800 px-1 rounded text-blue-400" {...props}>{children}</code>
                        }
                    }}>{content}</ReactMarkdown>
                </div>
                {role === 'ego' && <div className="text-[10px] font-mono text-zinc-600 mt-2 text-right">Ego Protocol // 01:03 AM</div>}
            </div>
            {role === 'user' && <div className="mt-1">{icon}</div>}
        </motion.div>
    );
}