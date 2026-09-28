import React from "react";
import { Sparkles, Terminal, Code2, BookOpen } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#070A11] py-10 px-6 text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
            NL
          </div>
          <div>
            <p className="font-semibold text-slate-200">
              NeuroLearn AI &bull; Interactive AI/ML Education
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Master mathematical foundations, deep learning, NLP, and
              production MLOps.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Curated Tracks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal size={14} className="text-cyan-400" />
            <span>Interactive Code</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Code2 size={14} className="text-emerald-400" />
            <span>Practice Quizzes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-amber-400" />
            <span>Knowledge Base</span>
          </div>
        </div>

        <div className="text-slate-500 text-[11px]">
          &copy; {new Date().getFullYear()} NeuroLearn Platform. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
