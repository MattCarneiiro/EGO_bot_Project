// src/components/CoreStability.jsx
import { motion } from "framer-motion";

export default function CoreStability() {
    const bars = Array.from({ length: 8 }); // Número de barras no gráfico

    return (
        <div className="absolute top-1/2 -right-60 transform -translate-y-1/2 w-52 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.4)] flex gap-4 items-center">
            <div className="flex flex-col-reverse items-end h-32 gap-1.5 w-full">
                {bars.map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            opacity: [0.6, 1, 0.6],
                            scaleY: [1, 1.1, 1]
                        }}
                        transition={{
                            duration: 1 + Math.random(),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1
                        }}
                        className={`w-3 h-full rounded-sm ${i > 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                    />
                ))}
            </div>
            <div className="flex flex-col gap-1 w-full text-right font-mono uppercase tracking-widest text-[10px] text-zinc-500">
                <div className="font-bold text-zinc-200">Core Stability</div>
                <div className="text-red-500">Status: Volatile</div>
                <div className="mt-2 text-[8px] text-zinc-600">Patience Level &lt; 15%</div>
            </div>
        </div>
    );
}