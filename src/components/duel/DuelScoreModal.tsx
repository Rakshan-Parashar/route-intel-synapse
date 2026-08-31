import React, { useState } from 'react';
import { Trophy, Clock, Zap, Check, Copy, Sparkles, X } from 'lucide-react';

interface DuelScoreModalProps {
  puzzleNumber: number;
  dateString: string;
  optimalityScore: number;
  userDistance: number;
  optimalDistance: number;
  aiDistance: number;
  timeSeconds: number;
  onClose: () => void;
  onPlayAgain: () => void;
}

export const DuelScoreModal: React.FC<DuelScoreModalProps> = ({
  puzzleNumber,
  optimalityScore,
  userDistance,
  optimalDistance,
  aiDistance,
  timeSeconds,
  onClose,
  onPlayAgain,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Determine Rank Badge
  let rank = 'C';
  let rankTitle = 'Suboptimal Route';
  let rankColor = 'text-neon-pink border-neon-pink/30 bg-neon-pink/10';

  if (optimalityScore >= 99.8) {
    rank = 'S+';
    rankTitle = 'Mathematical Perfection';
    rankColor = 'text-neon-green border-neon-green/40 bg-neon-green/15 glow-text-green';
  } else if (optimalityScore >= 95) {
    rank = 'S';
    rankTitle = 'Master Optimizer';
    rankColor = 'text-neon-cyan border-neon-cyan/40 bg-neon-cyan/15 glow-text-cyan';
  } else if (optimalityScore >= 90) {
    rank = 'A';
    rankTitle = 'Senior Route Architect';
    rankColor = 'text-neon-amber border-neon-amber/40 bg-neon-amber/15';
  } else if (optimalityScore >= 80) {
    rank = 'B';
    rankTitle = 'Competent Dispatcher';
    rankColor = 'text-slate-200 border-border bg-surface';
  }

  // Generate Wordle-style Emoji Blocks
  const greenCount = Math.round((optimalityScore / 100) * 10);
  const yellowCount = Math.max(0, 10 - greenCount);
  const emojiBlocks = '🟩'.repeat(greenCount) + '🟨'.repeat(yellowCount);

  const shareText = `ROUTE_INTEL: SYNAPSE 🧠 Daily Puzzle #${puzzleNumber}
🏆 Optimality: ${optimalityScore.toFixed(1)}% (Rank: ${rank})
⏱️ Time: ${timeSeconds.toFixed(1)}s
${userDistance < aiDistance ? `🤖 Beat Genetic AI by ${Math.round(aiDistance - userDistance)} px!` : `🤖 AI Challenger: ${Math.round(aiDistance)} px`}
${emojiBlocks}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-panel border border-neon-cyan/40 shadow-neon-cyan/20 max-w-md w-full rounded-xl p-6 relative flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-slate-200 p-1"
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div className="w-14 h-14 rounded-full bg-neon-cyan/10 border border-neon-cyan flex items-center justify-center shadow-neon-cyan mb-3">
          <Trophy size={28} className="text-neon-cyan" />
        </div>

        <h2 className="text-xl font-display font-extrabold text-slate-100 flex items-center gap-2">
          PUZZLE #{puzzleNumber} <span className="text-neon-cyan">SOLVED</span>
        </h2>
        <p className="text-xs text-muted mb-4 uppercase tracking-wider">
          Daily Optimization Evaluation
        </p>

        {/* Big Rank Badge */}
        <div className={`px-6 py-3 rounded-lg border flex items-center gap-3 mb-5 ${rankColor}`}>
          <span className="font-display font-black text-3xl">{rank}</span>
          <div className="text-left">
            <div className="font-bold text-sm leading-tight">{rankTitle}</div>
            <div className="text-[10px] text-muted uppercase">Held-Karp Benchmark</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full mb-5">
          <div className="bg-surface p-3 rounded border border-border">
            <div className="flex items-center justify-center gap-1 text-muted text-[10px] uppercase font-bold mb-1">
              <Zap size={11} className="text-neon-cyan" />
              <span>Score</span>
            </div>
            <div className="text-lg font-bold font-display text-neon-cyan">
              {optimalityScore.toFixed(1)}%
            </div>
          </div>

          <div className="bg-surface p-3 rounded border border-border">
            <div className="flex items-center justify-center gap-1 text-muted text-[10px] uppercase font-bold mb-1">
              <Clock size={11} className="text-neon-amber" />
              <span>Time</span>
            </div>
            <div className="text-lg font-bold font-display text-neon-amber">
              {timeSeconds.toFixed(1)}s
            </div>
          </div>

          <div className="bg-surface p-3 rounded border border-border">
            <div className="flex items-center justify-center gap-1 text-muted text-[10px] uppercase font-bold mb-1">
              <Sparkles size={11} className="text-neon-pink" />
              <span>Distance</span>
            </div>
            <div className="text-lg font-bold font-display text-slate-200">
              {Math.round(userDistance)}
              <span className="text-[10px] text-muted ml-0.5">px</span>
            </div>
          </div>
        </div>

        {/* Comparison Details */}
        <div className="w-full bg-surface/60 border border-border rounded p-3 text-xs text-left mb-5 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted">Theoretical Optimal (Held-Karp):</span>
            <span className="text-neon-green font-bold font-mono">{Math.round(optimalDistance)} px</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Genetic AI Challenger:</span>
            <span className="text-neon-pink font-bold font-mono">{Math.round(aiDistance)} px</span>
          </div>
          <div className="flex justify-between border-t border-border/40 pt-1">
            <span className="text-muted">Your Route Result:</span>
            <span className="text-neon-cyan font-bold font-mono">{Math.round(userDistance)} px</span>
          </div>
        </div>

        {/* Emoji Preview Card */}
        <div className="w-full bg-background border border-border/70 rounded p-2 text-xs font-mono text-center mb-5 tracking-widest">
          {emojiBlocks}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider transition-all ${
              copied
                ? 'bg-neon-green text-black shadow-neon-green'
                : 'bg-neon-cyan text-black hover:bg-neon-cyan/90 shadow-neon-cyan'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'COPIED TO CLIPBOARD!' : 'SHARE RESULT'}</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="px-4 py-2.5 bg-surface border border-border text-muted hover:text-slate-200 rounded text-xs font-bold uppercase transition-colors"
          >
            NEW PUZZLE
          </button>
        </div>
      </div>
    </div>
  );
};
