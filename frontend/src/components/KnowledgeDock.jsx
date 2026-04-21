// src/components/KnowledgeDock.jsx
import { motion } from "framer-motion";
import { Hash, Zap } from "lucide-react";

export default function KnowledgeDock({ tags, activeTag }) {
    return (
        <motion.div
            initial={{ x: 300 }} animate={{ x: 0 }}
            className="w-72 border-l border-zinc-800/50 bg-black/40 backdrop-blur-2xl p-6 flex flex-col gap-4"
        >
            <h3 className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <Zap size={12} /> Semantic_Nexus
            </h3>

            <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                    <motion.div
                        key={i}
                        animate={activeTag === tag ? { scale: 1.1, borderColor: "#3b82f6", boxShadow: "0 0 15px rgba(59,130,246,0.5)" } : {}}
                        className="px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-[10px] font-mono text-zinc-400 flex items-center gap-1 cursor-pointer hover:border-blue-500/50 transition-all"
                    >
                        <Hash size={10} className="text-blue-500" /> {tag}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}