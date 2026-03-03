import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Scissors, Sparkles, Camera, CheckCircle, MessageCircle, 
  ChevronRight, Crown, Clock, Lock, Unlock, Send, Phone, User, Calendar
} from 'lucide-react';

// ==========================================
// CONFIGURACIÓN DE FIREBASE (DIRGNI STUDIO)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCK2td0SQU07W_QirLkmgCTPmlZW_ZhNag",
  authDomain: "dirgnistudio-citas.firebaseapp.com",
  projectId: "dirgnistudio-citas",
  storageBucket: "dirgnistudio-citas.firebasestorage.app",
  messagingSenderId: "385836114143",
  appId: "1:385836114143:web:b7999621100c7b1ed5896a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Identificadores de negocio
const appId = 'dirgni-studio-v1'; 
const SALON_PHONE = "50688274552"; 
const ADMIN_PIN = "2024";

export default function App() {
  const [view, setView] = useState('client'); 
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  // EFECTO 1: Autenticación (Regla 3 de Firebase)
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // EFECTO 2: Carga de datos (Solo Admin y autenticado)
  useEffect(() => {
    if (!user || view !== 'admin' || !isAdminAuthenticated) return;
    
    // Ruta estricta según Regla 1
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'appointments');
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar por fecha de creación (Regla 2: Ordenar en memoria)
      setAppointments(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, view, isAdminAuthenticated]);

  const verifyPin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminAuthenticated(true);
      setShowPinModal(false);
      setView('admin');
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black selection:bg-amber-100">
      {/* Navegación Boutique */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 px-6 h-20 flex items-center justify-between max-w-xl mx-auto shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-black text-amber-500 p-2 rounded-xl rotate-3 shadow-lg">
            <Crown size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl uppercase italic tracking-tighter leading-none">Dirgni Studio</h1>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 block">Booking Experience</span>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl scale-90">
          <button 
            onClick={() => setView('client')} 
            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${view === 'client' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
          >
            CITA
          </button>
          <button 
            onClick={() => isAdminAuthenticated ? setView('admin') : setShowPinModal(true)} 
            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${view === 'admin' ? 'bg-black text-amber-500 shadow-md' : 'text-gray-400'}`}
          >
            ADMIN
          </button>
        </div>
      </nav>

      <main className="max-w-xl mx-auto p-6 pb-32">
        {view === 'client' ? (
          <ClientView />
        ) : (
          <AdminView 
            appointments={appointments} 
            loading={loading} 
            onLogout={() => {setIsAdminAuthenticated(false); setView('client');}} 
          />
        )}
      </main>

      {/* Modal de PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-[3rem] p-10 shadow-2xl text-center border border-gray-100">
            <Lock size={32} className="mx-auto mb-4 text-amber-600" />
            <h2 className="text-xl font-black mb-2 uppercase tracking-tighter">Acceso Privado</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Introduce el PIN maestro</p>
            <form onSubmit={verifyPin} className="space-y-4">
              <input 
                autoFocus 
                type="password" 
                maxLength={4} 
                value={pinInput} 
                onChange={(e) => setPinInput(e.target.value)} 
                placeholder="****" 
                className={`w-full text-center text-4xl py-4 rounded-2xl bg-gray-50 border-2 outline-none transition-all ${pinError ? 'border-red-500 animate-pulse' : 'border-transparent focus:border-amber-500'}`} 
              />
              <button type="submit" className="w-full bg-black text-amber-500 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-gray-800 active:scale-95 transition-all">Verificar Acceso</button>
            </form>
            <button onClick={() => setShowPinModal(false)} className="mt-4 text-[9px] font-black text-gray-300 uppercase underline">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientView() {
  const [form, setForm] = useState({ name: '', lastName: '', phone: '', service: 'cabello', s1: '', s2: '', s3: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fDate = (d) => d ? new Date(d).toLocaleString('es-CR', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '---';
    
    // MENSAJE LIMPIO (SIN EMOJIS COMPLEJOS PARA EVITAR DIAMANTES)
    const msg = `SOLICITUD DE CITA - Dirgni Studio\n-------------------\nCliente: ${form.name} ${form.lastName}\nServicio: ${form.service.toUpperCase()}\n\nOpciones propuestas:\n1. ${fDate(form.s1)}\n2. ${fDate(form.s2)}\n3. ${fDate(form.s3)}`;

    // Redirección directa para móviles (Evita bloqueo de popups)
    window.location.href = `https://wa.me/${SALON_PHONE}?text=${encodeURIComponent(msg)}`;
    setSent(true);

    // Registro en Firebase
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), { 
        ...form, 
        status: 'pendiente', 
        createdAt: serverTimestamp() 
      });
    } catch (err) {
      console.warn("Mensaje enviado por WhatsApp. Respaldo en BD pendiente.");
    }
  };

  if (sent) return (
    <div className="text-center py-20 px-6 space-y-6 animate-in zoom-in duration-500">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
        <CheckCircle size={40} className="text-amber-600" />
      </div>
      <h2 className="text-2xl font-black uppercase italic tracking-tighter">¡Solicitud Enviada!</h2>
      <p className="text-gray-400 text-sm">Se ha abierto WhatsApp en tu celular. Revisa el chat para enviar el mensaje final.</p>
      <button onClick={() => setSent(false)} className="text-[10px] font-black uppercase underline text-gray-400 mt-4">Solicitar otra cita</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      {/* Datos del Cliente */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-50 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User size={14} className="text-amber-600"/>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Tus Datos</span>
        </div>
        <input required placeholder="Nombre" className="w-full p-4 rounded-xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 font-medium" onChange={e => setForm({...form, name: e.target.value})} />
        <input required placeholder="Apellidos" className="w-full p-4 rounded-xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 font-medium" onChange={e => setForm({...form, lastName: e.target.value})} />
        <input required type="tel" placeholder="WhatsApp" className="w-full p-4 rounded-xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 font-medium" onChange={e => setForm({...form, phone: e.target.value})} />
      </div>

      {/* Servicios */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {id:'cabello', label:'Cabello', icon:<Scissors size={20}/>}, 
          {id:'maquillaje', label:'Makeup', icon:<Sparkles size={20}/>}, 
          {id:'foto', label:'Foto', icon:<Camera size={20}/>}
        ].map(s => (
          <button 
            key={s.id} 
            type="button" 
            onClick={() => setForm({...form, service: s.id})} 
            className={`p-6 rounded-[2.2rem] border-2 flex flex-col items-center gap-3 transition-all ${form.service === s.id ? 'border-amber-500 bg-white shadow-xl scale-105 text-black' : 'bg-gray-50 border-transparent text-gray-300'}`}
          >
             <div className={form.service === s.id ? 'text-amber-600' : ''}>{s.icon}</div>
             <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Calendario Táctico */}
      <div className="bg-gray-900 p-8 rounded-[3rem] space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2 text-amber-500 font-black text-[10px] uppercase tracking-widest relative z-10">
          <Clock size={16}/> Elige 3 opciones de horario
        </div>
        {[1, 2, 3].map(n => (
          <input 
            key={n} 
            required 
            type="datetime-local" 
            className="w-full p-4 rounded-xl border-0 bg-white/10 text-white font-bold outline-none focus:bg-white/20 transition-all appearance-none" 
            onChange={e => setForm({...form, [`s${n}`]: e.target.value})} 
          />
        ))}
      </div>

      <button type="submit" className="w-full bg-black text-amber-500 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-gray-800 transition-colors active:scale-95">
        <MessageCircle className="w-6 h-6" /> SOLICITAR CITA
      </button>
    </form>
  );
}

function AdminView({ appointments, loading, onLogout }) {
  const confirmWithClient = (item, slotKey) => {
    const selectedDate = item[slotKey];
    const fDate = new Date(selectedDate).toLocaleString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
    const msg = `Hola ${item.name}! Soy del equipo de Dirgni Studio. Confirmamos tu cita para el dia: ${fDate}. Te esperamos! ✨`;
    
    // Respuesta directa a la clienta
    window.location.href = `https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) return (
    <div className="py-20 text-center animate-pulse space-y-4">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em]">Sincronizando Boutique...</p>
    </div>
  );

  const pending = appointments.filter(a => a.status === 'pendiente');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="font-black text-2xl uppercase italic tracking-tighter text-black leading-none">Agenda</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pendientes ({pending.length})</p>
        </div>
        <button onClick={onLogout} className="bg-gray-100 p-3 rounded-2xl text-gray-400 hover:text-red-500 transition-all border border-gray-200 shadow-sm">
          <Unlock size={20}/>
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="py-32 text-center text-gray-300 font-black uppercase text-[11px] tracking-[0.3em] border-2 border-dashed border-gray-100 rounded-[3.5rem]">
          Sin nuevas solicitudes
        </div>
      ) : (
        pending.map(app => (
          <div key={app.id} className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-xl shadow-gray-200/20 space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter text-black leading-none">{app.name} <span className="text-amber-600 font-light">{app.lastName}</span></h3>
                <p className="text-[11px] font-bold text-gray-400 mt-2 flex items-center gap-2"><Phone size={12} className="text-amber-500"/> {app.phone}</p>
              </div>
              <span className="bg-black text-amber-500 text-[9px] px-4 py-2 rounded-xl font-black uppercase italic shadow-lg shadow-black/10">
                {app.service}
              </span>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <span className="text-[9px] font-black text-gray-300 uppercase block ml-2 mb-2">Confirmar Opción por WhatsApp:</span>
              {['s1', 's2', 's3'].map((k, idx) => (
                <button 
                  key={k} 
                  onClick={() => confirmWithClient(app, k)} 
                  className="w-full flex justify-between items-center p-5 bg-gray-50 rounded-2xl text-[11px] font-black hover:bg-black hover:text-amber-500 transition-all group border border-transparent hover:border-amber-500"
                >
                  <span className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-[9px] font-black group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      {idx + 1}
                    </span>
                    {app[k] ? new Date(app[k]).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '---'}
                  </span>
                  <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
