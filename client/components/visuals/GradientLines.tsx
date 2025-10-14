import { motion } from "framer-motion";

export function GradientLines() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-1/3 top-[-10%] h-[60vmax] w-[60vmax] rounded-full bg-glow-blue/20 blur-[120px]"
        animate={{ rotate: [0, 45, 0], scale: [1, 1.12, 0.96, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-20%] top-1/3 h-[50vmax] w-[50vmax] rounded-full bg-glow-magenta/16 blur-[110px]"
        animate={{ rotate: [0, -30, 0], scale: [1, 0.94, 1.08, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-25%] left-1/4 h-[45vmax] w-[45vmax] rounded-full bg-glow-cyan/18 blur-[120px]"
        animate={{ rotate: [0, 20, -10, 0], scale: [1, 1.1, 0.98, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
