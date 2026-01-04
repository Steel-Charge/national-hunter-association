'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award } from 'lucide-react';
import { Title } from '@/lib/store';

interface TitleCongratulationModalProps {
    title: Title;
    onClose: () => void;
}

export default function TitleCongratulationModal({ title, onClose }: TitleCongratulationModalProps) {
    const rarityColors: Record<string, string> = {
        'Common': '#b0b0b0',
        'Rare': '#0070dd',
        'Epic': '#a335ee',
        'Legendary': '#ff8000',
        'Mythic': '#ff00ff', // Or dynamic prismatic
        'Event': '#00ffcc',
        'Challenge': '#ff3333'
    };

    const color = rarityColors[title.rarity] || '#ffffff';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(5px)'
                }}
            >
                <div style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '20px' }}>
                    <motion.div
                        initial={{ scale: 0.8, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, y: 50, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                        style={{
                            background: '#1a1a1a',
                            borderRadius: '16px',
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            border: `2px solid ${color}`,
                            boxShadow: `0 0 50px ${color}44`,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Background glow effect */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '300px',
                            height: '300px',
                            background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
                            pointerEvents: 'none'
                        }} />

                        <motion.h2
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                color: '#fff',
                                fontSize: '1.8rem',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}
                        >
                            Congratulation
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{ color: '#aaa', marginBottom: '2rem' }}
                        >
                            You have unlocked a new title!
                        </motion.p>

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, type: 'spring' }}
                            style={{ margin: '2rem auto' }}
                        >
                            <Award size={80} color={color} style={{ filter: `drop-shadow(0 0 15px ${color})` }} />
                        </motion.div>

                        <motion.h1
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            style={{
                                color: color,
                                fontSize: '2.5rem',
                                textTransform: 'uppercase',
                                textShadow: `0 0 20px ${color}`,
                                marginBottom: '0.5rem',
                                lineHeight: '1.2'
                            }}
                        >
                            {title.name}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            style={{
                                color: color,
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                textTransform: 'uppercase',
                                letterSpacing: '4px',
                                marginBottom: '3rem'
                            }}
                        >
                            {title.rarity}
                        </motion.p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            style={{
                                background: color,
                                color: '#000',
                                border: 'none',
                                padding: '1rem 3rem',
                                borderRadius: '50px',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: `0 0 20px ${color}66`
                            }}
                        >
                            CLAIM
                        </motion.button>

                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
