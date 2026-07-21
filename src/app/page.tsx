"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Upload, Scissors, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BarberCoachPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setReport(null);
      setError(null);
    }
  };

  const analyzeHaircut = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      setReport(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setReport(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-zinc-700">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-16 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4"
          >
            <Scissors className="w-8 h-8 text-zinc-400" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-medium tracking-tight"
          >
            THE PRINCE AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-zinc-500 text-lg md:text-xl font-light"
          >
            Professional Barber AI Coach & Analysis
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Upload Section */}
          <section className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden aspect-[4/5] relative group">
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={preview}
                      alt="Haircut preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
                      >
                        <RefreshCw className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-center space-y-4 hover:bg-zinc-900 transition-colors border-2 border-dashed border-zinc-800"
                  >
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-zinc-500" />
                    </div>
                    <p className="text-zinc-500 font-medium">Upload haircut photo</p>
                    <p className="text-zinc-600 text-sm px-12 text-center">
                      Front, side or back view for technical analysis
                    </p>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {preview && !report && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={analyzeHaircut}
                disabled={isAnalyzing}
                className="w-full py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-wait"
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Analyzing Technique...</span>
                  </div>
                ) : (
                  "Start Analysis"
                )}
              </motion.button>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </section>

          {/* Results Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-medium flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-zinc-400" />
              Technical Report
            </h2>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 min-h-[300px] relative">
              <AnimatePresence mode="wait">
                {report ? (
                  <motion.div
                    key="report"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-invert prose-zinc max-w-none"
                  >
                    <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed font-light">
                      {report}
                    </div>
                    <div className="mt-12 pt-8 border-t border-zinc-800 flex justify-between items-center">
                      <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono">
                        Generated by The Prince AI
                      </p>
                      <button
                        onClick={reset}
                        className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        New Analysis
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
                  >
                    <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                      <Camera className="w-6 h-6 text-zinc-600" />
                    </div>
                    <p className="text-zinc-600 font-light">
                      Waiting for photo analysis. Upload a clear shot to receive a detailed barber coach report.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isAnalyzing && (
                <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] flex items-center justify-center rounded-3xl">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-zinc-700 border-t-zinc-200 rounded-full animate-spin" />
                    <p className="text-sm text-zinc-400 animate-pulse uppercase tracking-widest font-mono">
                      Evaluating Fade & Symmetry
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
