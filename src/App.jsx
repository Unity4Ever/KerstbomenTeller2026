import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { TreeDeciduous, Plus, Minus, Lock, Unlock, TreePine, MapPin, Calendar, Info, Sparkles, Send, Loader2 } from 'lucide-react';

// Firebase configuratie
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kerstbomen-app-2026';

export default function App() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Gemini API State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Stap 1: Authenticatie
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Stap 2: Firestore Listener
  useEffect(() => {
    if (!user) return;
    const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'counters', 'main');
    const unsubscribe = onSnapshot(counterRef, (docSnap) => {
      if (docSnap.exists()) {
        setCount(docSnap.data().total || 0);
      } else {
        setDoc(counterRef, { total: 0 }).catch(console.error);
      }
    }, (err) => {
      console.error("Firestore snapshot error:", err);
    });
    return () => unsubscribe();
  }, [user]);

  const updateCounter = async (delta) => {
    if (!isAuthorized || !user) return;
    const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'counters', 'main');
    try {
      await updateDoc(counterRef, {
        total: Math.max(0, count + delta)
      });
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password.toLowerCase() === 'kerstboom2026') {
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Verkeerd wachtwoord!');
      setPassword('');
    }
  };

  // ✨ Gemini API Functie: De Boom-Expert
  const askGemini = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');

    const apiKey = ""; 
    const systemPrompt = "Je bent de 'Boom-Expert' voor een kerstbomen inzamelactie in 2026 gerund door jongeren in de buurt. Help de beheerders (Menno en Gijs) met teksten voor social media, informatie over het recyclen van bomen, of leuke buurtberichten. Houd de toon enthousiast, behulpzaam en passend bij een buurtinitiatief.";

    const fetchWithRetry = async (retries = 5, delay = 1000) => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: aiPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });
        
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (err) {
        if (retries > 0) {
          await new Promise(res => setTimeout(res, delay));
          return fetchWithRetry(retries - 1, delay * 2);
        }
        throw err;
      }
    };

    try {
      const text = await fetchWithRetry();
      setAiResponse(text);
    } catch (err) {
      setAiResponse("Oeps, de Boom-Expert heeft even pauze. Probeer het later nog eens.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const Snowflakes = () => {
    const [flakes] = useState(() => [...Array(25)].map(() => ({
      id: Math.random(),
      left: Math.random() * 100,
      duration: 20 + Math.random() * 20,
      delay: Math.random() * -40,
      size: Math.random() * 20 + 10,
      opacity: 0.1 + Math.random() * 0.3
    })));

    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-900">
        <style>{`
          @keyframes fall {
            0% { transform: translateY(-15vh) rotate(0deg); }
            100% { transform: translateY(115vh) rotate(360deg); }
          }
        `}</style>
        {flakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute top-[-10vh] text-white"
            style={{
              left: `${flake.left}%`,
              animation: `fall ${flake.duration}s linear infinite`,
              animationDelay: `${flake.delay}s`,
              fontSize: `${flake.size}px`,
              opacity: flake.opacity,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    );
  };

  if (loading) return null;

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-green-500/30 overflow-x-hidden">
      <Snowflakes />
      
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-green-400">
          <TreePine className="w-8 h-8" />
          <span>KERSTBOMEN <span className="text-white font-light">ACTIE</span></span>
        </div>
        <button 
          onClick={() => setView(view === 'home' ? 'admin' : 'home')}
          className="text-slate-400 hover:text-white transition-colors p-2"
        >
          {view === 'home' ? <Lock className="w-5 h-5" /> : <span className="text-sm font-bold bg-slate-800/80 px-3 py-1 rounded-full backdrop-blur-sm border border-slate-700">Terug</span>}
        </button>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center">
        {view === 'home' ? (
          <div className="space-y-12 animate-in fade-in duration-1000">
            <header className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl">
                Wij halen jullie <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                  Kerstbomen op!
                </span>
              </h1>
              <p className="text-slate-400 font-medium tracking-wide uppercase">Editie 2026</p>
            </header>

            <div className="relative inline-block group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 rounded-3xl blur-md opacity-10 group-hover:opacity-60 group-hover:blur-xl transition duration-700"></div>
              
              <div className="relative bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 md:p-16 shadow-2xl transition-all duration-700 transform group-hover:scale-[1.02] group-hover:-translate-y-1 cursor-default flex flex-col items-center justify-center min-w-[280px]">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-green-400/80 mb-4 transition-all duration-500">Aantal Verzameld</p>
                <div className="text-8xl md:text-9xl font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all duration-500 leading-none">
                  {count}
                </div>
                <div className="mt-6 flex justify-center items-center gap-2 text-slate-500 group-hover:text-green-400/60 transition-colors duration-500">
                  <TreeDeciduous className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-medium italic">En hij loopt nog steeds!</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left mt-20">
              <div className="group/card bg-slate-800/40 backdrop-blur-md p-8 rounded-2xl border border-slate-700/40 hover:border-green-500/40 transition-all duration-500 hover:-translate-y-2 cursor-default">
                <div className="bg-slate-900/60 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover/card:bg-green-500/10 transition-all duration-500">
                  <Calendar className="w-6 h-6 text-green-400 group-hover/card:scale-110 transition-transform" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">Wanneer?</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  In januari komen we langs door de straten.
                </p>
              </div>

              <div className="group/card bg-slate-800/40 backdrop-blur-md p-8 rounded-2xl border border-slate-700/40 hover:border-green-500/40 transition-all duration-500 hover:-translate-y-2 cursor-default">
                <div className="bg-slate-900/60 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover/card:bg-green-500/10 transition-all duration-500">
                  <MapPin className="w-6 h-6 text-green-400 group-hover/card:scale-110 transition-transform" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">Waar?</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Overal in de wijk. Leg je boom gewoon aan de straat!
                </p>
              </div>

              <div className="group/card bg-slate-800/40 backdrop-blur-md p-8 rounded-2xl border border-slate-700/40 hover:border-green-500/40 transition-all duration-500 hover:-translate-y-2 cursor-default">
                <div className="bg-slate-900/60 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover/card:bg-green-500/10 transition-all duration-500">
                  <Info className="w-6 h-6 text-green-400 group-hover/card:scale-110 transition-transform" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">Wie?</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  De jongeren uit de buurt zorgen ervoor dat de bomen worden opgehaald.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-4 space-y-6">
            {!isAuthorized ? (
              <div className="max-w-md mx-auto bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl">
                <Lock className="w-10 h-10 text-green-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-6 text-white">Beheerder Login</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input 
                    type="password" 
                    placeholder="Wachtwoord"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  />
                  {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
                  <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95">
                    Inloggen
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-xl">
                  <Unlock className="w-8 h-8 text-green-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-6 text-white text-center">Tussenstand Aanpassen</h2>
                  <div className="flex items-center justify-between gap-6 max-w-xs mx-auto">
                    <button onClick={() => updateCounter(-1)} className="bg-slate-700/50 hover:bg-red-500/10 hover:text-red-400 w-16 h-16 rounded-2xl border border-slate-600 transition-all active:scale-90 flex items-center justify-center">
                      <Minus className="w-6 h-6" />
                    </button>
                    <div className="text-6xl font-black text-white tabular-nums">{count}</div>
                    <button onClick={() => updateCounter(1)} className="bg-slate-700/50 hover:bg-green-500/10 hover:text-green-400 w-16 h-16 rounded-2xl border border-slate-600 transition-all active:scale-90 flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/30 shadow-xl text-left">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="font-bold text-white">Vraag het de Boom-Expert</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Vraag om een Insta-tekst of recycling tip..."
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && askGemini()}
                      />
                      <button 
                        onClick={askGemini}
                        disabled={isAiLoading}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                      >
                        {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>

                    {aiResponse && (
                      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-500">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {aiResponse}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button 
                        onClick={() => setAiPrompt("Schrijf een enthousiaste Instagram post over onze inzamelactie.")}
                        className="text-[10px] uppercase tracking-wider font-bold bg-slate-700/40 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-400 transition-colors"
                      >
                        📱 Insta Post
                      </button>
                      <button 
                        onClick={() => setAiPrompt("Geef 3 tips wat we met de ingezamelde kerstbomen kunnen doen.")}
                        className="text-[10px] uppercase tracking-wider font-bold bg-slate-700/40 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-400 transition-colors"
                      >
                        ♻️ Recycling Tips
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button onClick={() => { setIsAuthorized(false); setView('home'); }} className="text-slate-500 hover:text-slate-300 text-xs uppercase tracking-widest font-bold transition-colors">
                    Uitloggen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center py-12 text-slate-600 text-xs tracking-widest font-medium uppercase">
        <p>© Kerstbomen Inzamelactie 2026</p>
      </footer>
    </div>
  );
}