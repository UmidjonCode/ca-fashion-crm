'use client';

import { motion } from 'framer-motion';

// app/template.js re-mounts on every navigation, so this gives each page a
// smooth enter transition without any extra wiring.
export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
