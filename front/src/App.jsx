import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Quoi encore ? Je suis occupé à rien faire." }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState('neutral'); // neutral, judging, angry, writing, ignoring
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Suivi de la souris pour les yeux
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (mood === 'ignoring') return;
      const { clientX, clientY } = e;
      // Calcul simple pour limiter le mouvement des pupilles
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mood]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || mood === 'ignoring') return;

    const userMsg = { id: Date.now(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setMood('thinking'); 

    try {
      // --- APPEL AU BACKEND (L'IA TOXIQUE) ---
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      });

      if (!response.ok) throw new Error('Erreur réseau');

      const data = await response.json();
      
      // Réception de la réponse
      const botMsg = { id: Date.now() + 1, sender: 'bot', text: data.response };
      setMessages(prev => [...prev, botMsg]);
      
      // Changement d'humeur
      setMood('angry');
      setTimeout(() => setMood('neutral'), 3000);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'system', text: "L'idiot du village vous ignore (Erreur serveur)." }]);
      setMood('ignoring');
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion touche Entrée
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (mood !== 'thinking' && mood !== 'ignoring') {
      setMood('judging');
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
          if (mood !== 'thinking') setMood('neutral');
      }, 1000);
    }
  };

  // --- COMPOSANT TÊTE DU ROBOT ---
  const RobotFace = () => {
    let eyeClass = "w-16 h-16 bg-white rounded-full relative flex items-center justify-center transition-all duration-300 border-4 border-gray-800";
    let pupilClass = "w-6 h-6 bg-black rounded-full transition-all duration-100 absolute";
    let mouthClass = "w-24 h-4 bg-gray-800 rounded-full transition-all duration-500 mt-8";
    let faceColor = "bg-blue-500";
    let containerClass = "relative w-64 h-56 rounded-3xl flex flex-col items-center justify-center shadow-[0_10px_0_rgb(0,0,0)] border-4 border-black transition-colors duration-500";

    if (mood === 'judging') {
      eyeClass += " h-10 mt-4"; 
      faceColor = "bg-yellow-400";
      mouthClass = "w-12 h-4 bg-gray-800 rounded-full mt-8 translate-x-4 rotate-12";
    } else if (mood === 'angry') {
      faceColor = "bg-red-500";
      eyeClass += " border-red-900"; 
      mouthClass = "w-20 h-8 border-t-4 border-black rounded-t-full mt-6";
    } else if (mood === 'thinking') {
      faceColor = "bg-purple-500 animate-pulse";
      pupilClass += " animate-bounce";
      mouthClass = "w-10 h-10 rounded-full border-4 border-black border-t-transparent animate-spin mt-6";
    } else if (mood === 'ignoring') {
      faceColor = "bg-gray-400";
      return (
        <div className={`${containerClass} ${faceColor}`}>
          <div className="text-6xl opacity-50">¯\_(ツ)_/¯</div>
          <div className="absolute bottom-2 text-xs font-mono">Mode: Grosse Fatigue</div>
        </div>
      );
    }

    return (
      <div className={`${containerClass} ${faceColor}`}>
        <div className="absolute -top-10 flex gap-4">
            <div className={`w-2 h-10 bg-black transition-all ${mood === 'angry' ? 'rotate-45' : 'rotate-0'}`}></div>
            <div className={`w-2 h-10 bg-black transition-all ${mood === 'angry' ? '-rotate-45' : 'rotate-0'}`}></div>
        </div>
        <div className="flex gap-4 z-10">
          <div className={eyeClass}>
             {mood === 'angry' && <div className="absolute -top-4 w-20 h-6 bg-black rotate-12 z-20"></div>}
             <div className={pupilClass} style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}></div>
          </div>
          <div className={eyeClass}>
             {mood === 'angry' && <div className="absolute -top-4 w-20 h-6 bg-black -rotate-12 z-20"></div>}
             <div className={pupilClass} style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}></div>
          </div>
        </div>
        <div className={mouthClass}></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50 font-mono text-gray-800 overflow-hidden">
      <header className="p-4 border-b-4 border-black bg-white flex justify-between items-center shadow-md z-10">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">
          L'Idiot du Village <span className="text-xs bg-black text-white px-2 py-1 rounded ml-2 not-italic align-middle">v2.0</span>
        </h1>
        <button onClick={() => window.location.reload()} className="p-2 hover:bg-red-100 rounded-full border-2 border-transparent hover:border-black transition-all">
          <RefreshCw size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="md:w-1/2 flex flex-col items-center justify-center p-8 bg-grid-pattern border-b-4 md:border-b-0 md:border-r-4 border-black relative">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
          <RobotFace />
          <div className="mt-8 text-center p-4 bg-white border-2 border-black shadow-[4px_4px_0_0_#000] max-w-sm">
            <p className="font-bold mb-1">ÉTAT DU SYSTÈME :</p>
            <p className={`text-lg ${mood === 'angry' ? 'text-red-600 font-black' : 'text-blue-600'}`}>
              {mood === 'neutral' && "En attente d'une question intelligente..."}
              {mood === 'judging' && "Jugement en cours..."}
              {mood === 'thinking' && "Recherche d'une réponse..."}
              {mood === 'angry' && "EXASPÉRATION MAXIMALE"}
              {mood === 'ignoring' && "Système en grève"}
            </p>
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col h-full bg-white relative">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${msg.sender === 'user' ? 'bg-white text-right rounded-br-none' : 'bg-blue-100 rounded-bl-none'} ${msg.sender === 'system' ? 'bg-red-100 italic text-center w-full' : ''}`}>
                    <p className="text-sm md:text-base">{msg.text}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block font-bold uppercase">{msg.sender === 'user' ? 'Moi' : 'Lui'}</span>
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex justify-start"><div className="bg-gray-100 p-4 rounded-2xl rounded-bl-none border-2 border-gray-300 animate-pulse"><p className="text-xs text-gray-500">... tapote agressivement ...</p></div></div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-gray-50 border-t-4 border-black">
              <div className="flex gap-2">
                <input type="text" value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={mood === 'ignoring'} placeholder={mood === 'ignoring' ? "Il ne vous écoute plus." : "Osez dire quelque chose..."} className="flex-1 p-4 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-black transition-all disabled:bg-gray-200 disabled:cursor-not-allowed font-bold" />
                <button onClick={handleSend} disabled={!inputText.trim() || isLoading || mood === 'ignoring'} className={`p-4 rounded-xl border-2 border-black shadow-[4px_4px_0_0_#000] transition-all hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-y-[4px] active:shadow-none ${mood === 'ignoring' ? 'bg-gray-300 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-300'}`}>
                  <Send size={24} />
                </button>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}