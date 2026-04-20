import { motion } from "framer-motion";

export default function EgoCoreOrb({ size = "small" }) {
    const isLarge = size === "large";
    const containerSize = isLarge ? "w-64 h-64" : "w-24 h-24";
    const coreSize = isLarge ? "w-24 h-24" : "w-10 h-10";

    return (
        <div className={`relative flex items-center justify-center ${containerSize}`}>
            {/* Glow de fundo fixo */}
            <div className={`absolute inset-0 rounded-full bg-blue-600/10 blur-3xl animate-pulse`} />

            {/* Anel Externo 1 */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-blue-500/20"
            />

            {/* Anel Externo 2 - Pontilhado */}
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-4 rounded-full border-2 border-dashed border-blue-400/30`}
            />

            {/* Núcleo Central */}
            <motion.div
                animate={{
                    scale: isLarge ? [1, 1.05, 1] : [1, 1.02, 1],
                    boxShadow: isLarge
                        ? ["0 0 20px rgba(59,130,246,0.4)", "0 0 50px rgba(59,130,246,0.8)", "0 0 20px rgba(59,130,246,0.4)"]
                        : ["0 0 10px rgba(59,130,246,0.3)", "0 0 20px rgba(59,130,246,0.5)", "0 0 10px rgba(59,130,246,0.3)"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className={`${coreSize} rounded-full bg-blue-600 border border-blue-400/50 flex items-center justify-center`}
            >
                {/* Efeito de lente dentro do núcleo */}
                <div className="w-1/2 h-1/2 rounded-full bg-white/20 blur-[2px]" />
            </motion.div>
        </div>
    );
}