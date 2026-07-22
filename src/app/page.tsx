"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Upload, Scissors, RefreshCw, CheckCircle2, AlertCircle, LogIn, LogOut, History, User as UserIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { auth, db } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { useAuth } from "@/components/FirebaseProvider";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BarberCoachPage() {
  const { user, loading: authLoading } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "analyses"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [user, fetchHistory]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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

      // Save to Firestore if user is logged in
      if (user) {
        try {
          await addDoc(collection(db, "analyses"), {
            userId: user.uid,
            report: data.analysis,
            createdAt: serverTimestamp(),
          });
          fetchHistory();
        } catch (dbErr) {
          console.error("Failed to save analysis:", dbErr);
        }
      }
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
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-6 py-12"
      >
        {/* Header */}
        <header className="mb-16 flex flex-col items-center space-y-4">
          <div className="w-full flex justify-end mb-8">
            <AnimatePresence mode="wait">
              {authLoading ? (
                <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-zinc-400 animate-spin" />
              ) : user ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-medium text-white">{user.displayName}</p>
                    <button 
                      onClick={logout}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      Logout
                    </button>
                  </div>
                  {user.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt="Avatar" 
                      width={40} 
                      height={40} 
                      className="rounded-full border border-zinc-800 shadow-lg" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                      <UserIcon className="w-5 h-5 text-zinc-400" />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={login}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In to Save History
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            variants={itemVariants}
            className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 shadow-2xl shadow-zinc-900"
          >
            <Scissors className="w-8 h-8 text-zinc-400" />
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-display font-medium tracking-tight text-white"
          >
            THE PRINCE AI
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-zinc-500 text-lg md:text-xl font-light max-w-xl mx-auto"
          >
            L&apos;intelligenza artificiale al servizio dell&apos;arte del taglio. Analisi tecnica e coaching professionale.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Upload Section */}
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden aspect-[4/5] relative group shadow-2xl">
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={preview}
                      alt="Haircut preview"
                      fill
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Scanning Animation */}
                    {isAnalyzing && (
                      <motion.div 
                        initial={{ top: "0%" }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-white/50 shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10"
                      />
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all transform hover:scale-110"
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
                    whileHover={{ backgroundColor: "rgba(24, 24, 27, 0.8)" }}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-center space-y-4 transition-colors border-2 border-dashed border-zinc-800 rounded-3xl"
                  >
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-zinc-500 group-hover:text-zinc-300" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-zinc-400 font-medium">Carica foto del taglio</p>
                      <p className="text-zinc-600 text-sm px-12 leading-tight">
                        Fronte, lato o retro per un&apos;analisi tecnica dettagliata
                      </p>
                    </div>
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={analyzeHaircut}
                disabled={isAnalyzing}
                className="w-full py-4 bg-white text-black rounded-2xl font-semibold shadow-xl shadow-white/5 hover:bg-zinc-100 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="tracking-wide uppercase text-xs font-bold">Analisi Tecnica in corso...</span>
                  </div>
                ) : (
                  "INIZIA ANALISI"
                )}
              </motion.button>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/50 rounded-2xl text-red-400"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </motion.section>

          {/* Results Section */}
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-zinc-400 flex items-center gap-3 tracking-tight">
                <CheckCircle2 className="w-5 h-5 text-zinc-500" />
                {showHistory ? "CRONOLOGIA" : "REPORT TECNICO"}
              </h2>
              {user && history.length > 0 && (
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
                >
                  {showHistory ? <Scissors className="w-3 h-3" /> : <History className="w-3 h-3" />}
                  {showHistory ? "Torna all'analisi" : "Cronologia"}
                </button>
              )}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 min-h-[400px] relative shadow-inner overflow-hidden">
              <AnimatePresence mode="wait">
                {showHistory ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {history.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-4 bg-zinc-800/20 border border-zinc-800/50 rounded-2xl cursor-pointer hover:bg-zinc-800/40 transition-colors group"
                        onClick={() => {
                          setReport(item.report);
                          setShowHistory(false);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[10px] text-zinc-500 font-mono">
                            {item.createdAt?.toDate().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <History className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </div>
                        <p className="text-zinc-400 text-sm line-clamp-2 font-light italic">
                          {item.report.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </motion.div>
                ) : report ? (
                  <motion.div
                    key="report"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="prose prose-invert prose-zinc max-w-none"
                  >
                    <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed font-light text-base">
                      {report}
                    </div>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="mt-12 pt-8 border-t border-zinc-800/50 flex justify-between items-center"
                    >
                      <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-mono">
                        Powered by The Prince AI Engine
                      </p>
                      <button
                        onClick={reset}
                        className="text-xs text-zinc-500 hover:text-white transition-all flex items-center gap-2 hover:translate-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        NUOVA ANALISI
                      </button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
                  >
                    <div className="w-14 h-14 bg-zinc-800/30 rounded-3xl flex items-center justify-center mb-6 border border-zinc-800">
                      <Camera className="w-6 h-6 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 font-light leading-relaxed">
                      Carica una foto per ricevere un&apos;analisi dettagliata su Fade, Blend e Simmetria.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isAnalyzing && (
                <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[4px] flex items-center justify-center rounded-3xl z-20">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-2 border-zinc-800 rounded-full" />
                      <div className="absolute inset-0 w-16 h-16 border-t-2 border-white rounded-full animate-spin" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-zinc-200 uppercase tracking-[0.3em] font-bold animate-pulse">
                        Elaborazione
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                        Valutazione Fade & Connessioni
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </motion.div>
    </main>
  );
}
