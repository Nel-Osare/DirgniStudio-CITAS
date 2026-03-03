import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Scissors, 
  Sparkles, 
  Camera, 
  CheckCircle, 
  MessageCircle, 
  ChevronRight, 
  Crown, 
  User, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Lock,
  Unlock,
  X,
  Phone
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
  appId: "1:385836114143:web:b7999621100c7b1ed5896a",
  measurementId: "G-F6WRQX376F"
};

// Inicialización de servicios
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Identificadores y Constantes Tácticas
const appId = 'dirgni-studio-v1'; 
const SALON_PHONE = "50688274552"; 
const ADMIN_PIN = "2024";

export default function App() {
  const [view, setView] = useState('client'); 
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Estados de Administración
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Autenticación Automática (Anónima para persistencia en Firestore)
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de autenticación:", error);
        setAuthError("Error de conexión. Asegúrate de activar 'Anonymous Login' en Firebase.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  // Escucha de citas en tiempo real (Solo para Admin autenticado con PIN)
  useEffect(() => {
    if (!user || view !== 'admin' || !isAdminAuthenticated) return;
    
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'appointments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (err) => {
      console.error("Error en Firestore:", err);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, view, isAdminAuthenticated]);

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) setView('admin');
    else setShowPinModal(true);
  };

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
    <div className="min-h-screen bg-[#fafafa] text-black font-sans selection:bg-amber-100">
      {/* Alerta de Error Crítico */}
      {authError && (
        <div className="bg-red-600 text-white text-[10px] py-2 text-center font-bold uppercase tracking-widest sticky top-0 z-[100] flex items-center justify-center gap-2 px-4">
          <AlertTriangle size={12} /> {authError}
        </div>
      )}

      {/* Navegación Boutique */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-6 h-20 flex items-center justify-between max-w-xl mx-auto shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-black p-2 rounded-xl shadow-lg rotate-3 transition-transform">
            <Crown className="text-amber-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter uppercase italic leading-none">
              Dirgni <span className="text-amber-600 font-light not-italic">Studio</span>
            </h1>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 scale-90">
          <button 
            onClick={() => setView('client')} 
            className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${view === 'client' ? 'bg-white text-black shadow-md' : 'text-slate-400'}`}
          >
            CITA
          </button>
          <button 
            onClick={handleAdminAccess} 
            className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${view === 'admin' ? 'bg-black text-amber-500 shadow-md' : 'text-slate-400'}`}
          >
            ADMIN
          </button>
        </div>
      </nav>

      <main className="max-w-xl mx-auto p-6 pb-32">
        {view === 'client' ? (
          <ClientView db={db} appId={appId} salonPhone={SALON_PHONE} />
        ) : (
          <AdminView 
            appointments={appointments} 
            loading={loading} 
            db={db}
            appId={appId}
            onLogout={() => {setIsAdminAuthenticated(false); setView('client');}} 
          />
        )}
      </main>

      {/* Modal de Seguridad (Bóveda Admin) */}
      {showPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
               <div className="bg-amber-50 p-3 rounded-2xl text-amber-600"><Lock size={24} /></div>
               <button onClick={() => setShowPinModal(false)}><X size={20} className="text-gray-300"/></button>
            </div>
            <h2 className="text-xl font-black uppercase mb-2">Bóveda Admin</h2>
            <form onSubmit={verifyPin} className="space-y-4">
              <input 
                autoFocus 
                type="password" 
                maxLength={4} 
                value={pinInput} 
                onChange={(e) => setPinInput(e.target.value)} 
                placeholder="PIN" 
                className={`w-full text-center text-3xl py-4 rounded-2xl bg-gray-50 border-2 outline-none transition-all ${pinError ? 'border-red-500 animate-shake' : 'border-transparent focus:border-amber-500'}`} 
              />
              <button type="submit" className="w-full bg-black text-amber-500 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-gray-800 transition-colors">Verificar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientView({ db, appId, salonPhone }) {
  const [formData, setFormData] = useState({ name: '', lastName: '', phone: '', service: 'cabello', slot1: '', slot2: '', slot3: '' });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Formateo de fecha para el mensaje de WhatsApp
    const fDate = (d) => d ? new Date(d).toLocaleString('es-CR', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '---';
    const msg = `👑 ¡Hola Dirgni Studio!\nSoy *${formData.name} ${formData.lastName}*.\nSolicito cita para: *${formData.service.toUpperCase()}*.\n\nOpciones sugeridas:\n1️⃣ ${fDate(formData.slot1)}\n2️⃣ ${fDate(formData.slot2)}\n3️⃣ ${fDate(formData.slot3)}`;

    // Apertura inmediata de WhatsApp
    window.open(`https://wa.me/${salonPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    setIsSent(true);

    // Registro en la base de datos de respaldo
    addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), { 
      ...formData, 
      status: 'pendiente', 
      createdAt: serverTimestamp() 
    }).catch(err => console.warn("WhatsApp enviado. Respaldo en BD pendiente por permisos."));
  };

  if (isSent) return (
    <div className="text-center py-20 px-6 space-y-6 animate-in zoom-in">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
        <CheckCircle className="w-10 h-10 text-amber-600" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tighter italic text-black">¡Solicitud Enviada!</h2>
      <p className="text-slate-400 text-sm">Se ha abierto WhatsApp. Te confirmaremos tu espacio lo antes posible.</p>
      <button onClick={() => setIsSent(false)} className="text-[10px] font-black uppercase underline text-slate-400 hover:text-black transition-colors">Agendar otra experiencia</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      {/* Datos Personales */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User size={14} className="text-amber-600"/>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tus Datos</span>
        </div>
        <input required placeholder="Nombre" className="w-full p-5 rounded-2xl bg-slate-50 outline-none border-2 border-transparent focus:border-amber-500/20 focus:bg-white transition-all font-medium" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input required placeholder="Apellidos" className="w-full p-5 rounded-2xl bg-slate-50 outline-none border-2 border-transparent focus:border-amber-500/20 focus:bg-white transition-all font-medium" onChange={e => setFormData({...formData, lastName: e.target.value})} />
        <input required type="tel" placeholder="WhatsApp (Celular)" className="w-full p-5 rounded-2xl bg-slate-50 outline-none border-2 border-transparent focus:border-amber-500/20 focus:bg-white transition-all font-medium" onChange={e => setFormData({...formData, phone: e.target.value})} />
      </div>

      {/* Servicios */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {id:'cabello', label:'Cabello', icon:<Scissors size={20}/>}, 
          {id:'maquillaje', label:'Makeup', icon:<Sparkles size={20}/>}, 
          {id:'fotografia', label:'Foto', icon:<Camera size={20}/>}
        ].map(s => (
          <button 
            key={s.id} 
            type="button" 
            onClick={() => setFormData({...formData, service: s.id})} 
            className={`p-6 rounded-[2.2rem] border-2 flex flex-col items-center gap-3 transition-all ${formData.service === s.id ? 'border-amber-500 bg-white shadow-xl text-black scale-105' : 'bg-slate-50 border-transparent text-slate-300 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}
          >
            {s.icon} <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-none">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Agenda */}
      <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Calendar size={120} className="text-white" /></div>
        <div className="flex items-center gap-2 mb-2 text-amber-500 font-black text-[11px] uppercase tracking-widest relative z-10"><Clock size={16}/> Elige 3 horarios de preferencia</div>
        {[1, 2, 3].map(n => (
          <input 
            key={n} 
            required 
            type="datetime-local" 
            className="w-full p-4 rounded-xl border-0 bg-white/10 text-white font-bold outline-none focus:bg-white/20 transition-all relative z-10 appearance-none" 
            onChange={e => setFormData({...formData, [`slot${n}`]: e.target.value})} 
          />
        ))}
      </div>

      <button type="submit" className="w-full bg-black text-amber-500 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 group active:scale-95 transition-all">
        <MessageCircle className="group-hover:rotate-12 transition-transform" /> SOLICITAR MI CITA
      </button>
    </form>
  );
}

function AdminView({ appointments, loading, db, appId, onLogout }) {
  const confirmDate = async (item, slotKey) => {
    const selectedDate = item[slotKey];
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appointments', item.id), { 
        status: 'confirmado', 
        confirmedDate: selectedDate 
      });
      
      const readable = new Date(selectedDate).toLocaleString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
      const msg = `👑 ¡Hola *${item.name}*!\nTu cita en *Dirgni Studio* ha sido CONFIRMADA.\n📅 Fecha: *${readable}* ✨`;
      
      window.open(`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) {
      console.error("Error al actualizar:", err);
    }
  };

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center gap-6 animate-pulse">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="font-black text-[10px] text-slate-400 tracking-[0.4em] uppercase">Abriendo Agenda Boutique...</span>
    </div>
  );

  const pending = appointments.filter(a => a.status === 'pendiente');

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="font-black text-xl tracking-tighter uppercase italic text-black">Agenda</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Solicitudes Entrantes</p>
        </div>
        <button onClick={onLogout} className="bg-slate-100 p-2.5 rounded-xl text-slate-400 hover:text-red-500 transition-all border border-slate-200"><Unlock size={18}/></button>
      </div>

      {pending.length === 0 ? (
        <div className="py-24 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic border-2 border-dashed border-slate-100 rounded-[3rem]">
          Sin pendientes por ahora
        </div>
      ) : (
        pending.map(app => (
          <div key={app.id} className="bg-white border border-slate-50 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/20 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-2xl tracking-tighter uppercase leading-none text-black">{app.name} <span className="text-amber-600 font-light">{app.lastName}</span></h3>
                <div className="flex items-center gap-2 mt-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                  <Phone size={12} className="text-amber-500"/> {app.phone}
                </div>
              </div>
              <span className="bg-black text-amber-500 text-[9px] px-4 py-2 rounded-xl font-black uppercase italic tracking-wider shadow-lg shadow-black/10">
                {app.service}
              </span>
            </div>
            
            <div className="space-y-3 pt-2 border-t border-slate-50">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block ml-2 pt-4">Confirmar Disponibilidad:</span>
              {['slot1', 'slot2', 'slot3'].map((k, idx) => (
                <button 
                  key={k} 
                  onClick={() => confirmDate(app, k)} 
                  className="w-full flex justify-between items-center p-5 bg-slate-50 rounded-2xl text-[11px] font-black hover:bg-black hover:text-amber-500 transition-all border border-transparent hover:border-amber-500 group"
                >
                  <span className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[9px] font-black group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      {idx + 1}
                    </span>
                    {app[k] ? new Date(app[k]).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '---'}
                  </span>
                  <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
