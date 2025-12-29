'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileFrameProps {
    children?: React.ReactNode;
    frameId: string;
    rank?: string;
    className?: string;
}

const RANK_CONFIG: Record<string, { color: string; pattern: string; detail: string }> = {
    'e': { color: '#888', pattern: 'M 0 0 L 10 0 L 10 10', detail: 'SEC-E' },
    'd': { color: '#00ff00', pattern: 'M 0 0 L 15 0 L 15 5 L 10 5 L 10 15 L 0 15 Z', detail: 'FLD-D' },
    'c': { color: '#0096ff', pattern: 'M 0 0 L 20 0 L 20 5 L 5 5 L 5 20 L 0 20 Z', detail: 'OPR-C' },
    'b': { color: '#ffff00', pattern: 'M 0 0 L 25 0 L 25 8 L 8 8 L 8 25 L 0 25 Z', detail: 'TAC-B' },
    'a': { color: '#ff7800', pattern: 'M 0 0 L 30 0 L 30 10 L 10 10 L 10 30 L 0 30 Z', detail: 'AUTH-A' },
    's': { color: '#ff00ff', pattern: 'M 0 0 L 35 0 L 35 12 L 12 12 L 12 35 L 0 35 Z', detail: 'SPEC-S' }
};

export default function ProfileFrame({ children, frameId, rank, className = '' }: ProfileFrameProps) {
    const frameClass = frameId.toLowerCase().replace(/ /g, '-');
    const rankKey = rank ? rank.toLowerCase() : 'e';
    const config = RANK_CONFIG[rankKey] || RANK_CONFIG['e'];

    return (
        <div className={`profile-frame-container ${frameClass} ${className}`}>
            <AnimatePresence mode="wait">
                <div key={rankKey} className="rank-overlay">
                    {/* Corner Brackets using SVG for precise hardware look */}
                    <motion.svg
                        className="corner top-left"
                        viewBox="0 0 40 40"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <motion.path
                            d={config.pattern}
                            stroke={config.color}
                            fill="none"
                            strokeWidth="2"
                        />
                    </motion.svg>

                    <motion.svg
                        className="corner top-right"
                        viewBox="0 0 40 40"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    >
                        <motion.path
                            d={config.pattern}
                            stroke={config.color}
                            fill="none"
                            strokeWidth="2"
                            style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
                        />
                    </motion.svg>

                    <motion.svg
                        className="corner bottom-right"
                        viewBox="0 0 40 40"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    >
                        <motion.path
                            d={config.pattern}
                            stroke={config.color}
                            fill="none"
                            strokeWidth="2"
                            style={{ transform: 'rotate(180deg)', transformOrigin: 'center' }}
                        />
                    </motion.svg>

                    <motion.svg
                        className="corner bottom-left"
                        viewBox="0 0 40 40"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    >
                        <motion.path
                            d={config.pattern}
                            stroke={config.color}
                            fill="none"
                            strokeWidth="2"
                            style={{ transform: 'rotate(270deg)', transformOrigin: 'center' }}
                        />
                    </motion.svg>

                    {/* Midpoint hardware details */}
                    <motion.div
                        className="mid-hardware left"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        style={{ backgroundColor: config.color }}
                    />
                    <motion.div
                        className="mid-hardware right"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        style={{ backgroundColor: config.color }}
                    />
                </div>
            </AnimatePresence>

            {/* Sideways HUD Label - Positoned center-right */}
            <motion.div
                className="hud-label-v"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.8, x: 0 }}
                transition={{ delay: 1 }}
            >
                <span className="label-text">{frameId.toUpperCase().replace(/ /g, '_')}</span>
                <span className="label-serial">[{config.detail}-{Math.floor(Math.random() * 900) + 100}]</span>
            </motion.div>

            <div className="profile-frame-inner">
                {children}
            </div>

            <style jsx>{`
                .profile-frame-container {
                    position: absolute;
                    inset: 10px;
                    border-radius: 4px;
                    pointer-events: none;
                    z-index: 50;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .profile-frame-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .rank-overlay {
                    position: absolute;
                    inset: -8px;
                }

                .corner {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                }

                .top-left { top: 0; left: 0; }
                .top-right { top: 0; right: 0; }
                .bottom-right { bottom: 0; right: 0; }
                .bottom-left { bottom: 0; left: 0; }

                .mid-hardware {
                    position: absolute;
                    width: 2px;
                    height: 40px;
                    top: calc(50% - 20px);
                    opacity: 0.3;
                }
                .mid-hardware.left { left: 0; }
                .mid-hardware.right { right: 0; }

                /* Sideways HUD Label */
                .hud-label-v {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%) rotate(90deg);
                    transform-origin: center right;
                    display: flex;
                    flex-direction: row;
                    gap: 15px;
                    white-space: nowrap;
                    font-family: monospace;
                    pointer-events: none;
                    z-index: 100;
                }

                .label-text {
                    font-size: 10px;
                    font-weight: 900;
                    color: #fff;
                    letter-spacing: 2px;
                    opacity: 0.9;
                }

                .label-serial {
                    font-size: 8px;
                    color: rgba(255, 255, 255, 0.4);
                }

                /* Rarity Base Frames - High Distinction clip-paths */
                
                .common { border: 1px solid rgba(255, 255, 255, 0.2); }
                
                .rare { 
                    border: 1.5px solid #cd7f32; 
                    clip-path: polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%); 
                }

                .epic { 
                    border: 1.5px solid #fff; 
                    clip-path: polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%);
                    box-shadow: inset 0 0 15px rgba(255,255,255,0.1);
                }

                .legendary { 
                    border: 1px solid #ffd700;
                    clip-path: polygon(0 15px, 15px 0, 80% 0, 80% 8px, 100% 8px, 100% 80%, 92% 80%, 92% 100%, 15px 100%, 0 85%);
                    background: rgba(255, 215, 0, 0.02);
                }

                .mythic { 
                    border: 2px solid #ff2a57;
                    clip-path: polygon(0 0, 30% 0, 35% 10px, 65% 10px, 70% 0, 100% 0, 100% 70%, 90% 75%, 90% 100%, 0 100%);
                }

                .event {
                    border: 1.5px solid #ff1cd2;
                    clip-path: polygon(0 10px, 10px 0, 100% 0, 100% 100%, 0 100%, 0 30%, 10px 30%, 10px 10%);
                }

                /* Special Animation for Rank S */
                .rank-overlay.s {
                    filter: drop-shadow(0 0 5px #ff00ff);
                }
            `}</style>
        </div>
    );
}
