import { motion } from 'framer-motion';

export const Workstation = ({ leftContent, rightContent, focus }) => {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-black p-2 gap-2">
            {/* Workspace (Reader/Writer) */}
            <motion.section
                animate={{ flex: focus === 'workspace' ? 3 : focus === 'chat' ? 0.8 : 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="glass-panel relative rounded-xl border border-blue-500/30 overflow-hidden"
            >
                {leftContent}
            </motion.section>

            {/* Chat (EGO) */}
            <motion.section
                animate={{ flex: focus === 'chat' ? 1.5 : focus === 'workspace' ? 0.4 : 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="glass-panel relative rounded-xl border border-purple-500/30 overflow-hidden"
            >
                {rightContent}
            </motion.section>
        </div>
    );
};