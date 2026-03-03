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
  Lock,
  Unlock,
  X,
  Phone
} from 'lucide-react';

// =========================================================
// 1. CONFIGURACIÓN DE FIREBASE (DIRGNI STUDIO)
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyCK2td0SQU07W_QirLkmgCTPmlZW_ZhNag",
  authDomain: "dirgnistudio-citas.firebaseapp.com",
  projectId: "dirgnistudio-citas",
  storageBucket: "dirgnistudio-citas.firebasestorage.app",
  messagingSenderId: "385836114143",
  appId: "1:385836114143:web:b7999621100c7b1ed5896a",
  measurementId: "G-F6WRQX376F"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Constantes de Identificación y Contacto
const appId = 'dirgni-studio-v1'; 
const SALON_PHONE = "50688274552"; 
const ADMIN_PIN = "2024"; // Tu clave de acceso

export default function App() {
  const [view, setView] = useState('client'); 
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Estados para el acceso Admin
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  // EFECTO: Autenticación Anónima (Requerido para Firestore)
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        setAuthError("Error: Habilita el acceso Anónimo en Firebase Authentication.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  // EFECTO: Escucha de citas en tiempo real (Solo para Administrador verificado)
  useEffect(() => {
    if (!user || view !== 'admin' || !isAdminAuthenticated) return;
    
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'appointments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenamos por fecha de creación (más recientes primero)
      setAppointments(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
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
    <div className="min-h-screen bg-[#fafafa] text-[#111] font-sans selection:bg-amber-100">
      {/* Aviso de error si la autenticación falla */}
      {authError && (
        <div className="bg-red-600 text-white text-[10px] py-2 px-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest sticky top-0 z-[100]">
          <AlertTriangle size={12} /> {authError}
        </div>
      )}

      {/* Header Boutique */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-black text-amber-500 p-2.5 rounded-2xl shadow-xl shadow-amber-500/10 rotate-3">
              <Crown size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter uppercase italic leading-none text-black">Dirgni Studio</h1>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] block mt-1">Exclusividad</span>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 scale-90">
            <button 
              onClick={() => setView('client')} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${view === 'client' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}
            >
              CITA
            </button>
            <button 
              onClick={handleAdminAccess} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${view === 'admin' ? 'bg-black text-amber-500 shadow-md' : 'text-gray-400'}`}
            >
              ADMIN
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 pb-32">
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

      {/* Modal para ingresar el PIN de Administrador */}
      {showPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[3rem] p-10 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-8">
               <div className="bg-amber-50 p-4 rounded-3xl text-amber-600">
                  <Lock size={28} />
               </div>
               <button onClick={() => setShowPinModal(false)} className="text-gray-300 hover:text-black">
                 <X size={24}/>
               </button>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Área Privada</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-8">Introduce el PIN de acceso</p>
            <form onSubmit={verifyPin} className="space-y-6">
              <input 
                autoFocus
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="****"
                className={`w-full text-center text-4xl tracking-[0.5em] py-5 rounded-[2rem] bg-gray-50 border-2 outline-none transition-all ${pinError ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-amber-500'}`}
              />
              <button type="submit" className="w-full bg-black text-amber-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">ACCEDER</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientView() {
  const [formData, setFormData] = useState({ name: '', lastName: '', phone: '', service: 'cabello', slot1: '', slot2: '', slot3: '' });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const serviceLabel = formData.service.toUpperCase();
    const fDate = (d) => d ? new Date(d).toLocaleString('es-CR', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '---';
    const msg = `👑 ¡Hola Dirgni Studio!\nSoy *${formData.name} ${formData.lastName}*.\nSolicito cita para: *${serviceLabel}*.\n\nPropuestas:\n1️⃣ ${fDate(formData.slot1)}\n2️⃣ ${fDate(formData.slot2)}\n3️⃣ ${fDate(formData.slot3)}`;

    // 1. Redirigir a WhatsApp de inmediato
    window.open(`https://wa.me/${SALON_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    setIsSent(true);

    // 2. Intentar guardar en la base de datos para respaldo del Admin
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), { 
        ...formData, 
        status: 'pendiente', 
        createdAt: serverTimestamp() 
      });
    } catch (err) {
      console.warn("Error guardando en BD. El mensaje de WhatsApp ya fue enviado.");
    }
  };

  if (isSent) return (
    <div className="text-center py-20 px-6 space-y-8 animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
        <CheckCircle className="w-12 h-12 text-amber-600" />
      </div>
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-black mb-2">¡Solicitud Enviada!</h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">Ya abrimos WhatsApp para confirmar tu espacio. ¡Nos vemos pronto!</p>
      </div>
      <button onClick={() => setIsSent(false)} className="mt-8 text-[11px] font-black uppercase underline text-gray-400 tracking-widest">Pedir otra cita</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in duration-700">
      {/* Datos Personales */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-50 space-y-5">
        <div className="flex items-center gap-2 mb-2"><User size={16} className="text-amber-600"/><span className="text-[11px] font-black uppercase tracking-widest text-gray-300">Tus Datos</span></div>
        <input required placeholder="Nombre" className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-bold text-black" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input required placeholder="Apellidos" className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-bold text-black" onChange={e => setFormData({...formData, lastName: e.target.value})} />
        <input required type="tel" placeholder="WhatsApp (Celular)" className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-bold text-black" onChange={e => setFormData({...formData, phone: e.target.value})} />
      </div>

      {/* Servicios */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {id:'cabello', label:'Cabello', icon:<Scissors size={24}/>}, 
          {id:'maquillaje', label:'Makeup', icon:<Sparkles size={24}/>}, 
          {id:'fotografia', label:'Foto', icon:<Camera size={24}/>}
        ].map(s => (
          <button key={s.id} type="button" onClick={() => setFormData({...formData, service: s.id})} className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 transition-all duration-300 ${formData.service === s.id ? 'border-amber-500 bg-white shadow-2xl text-black scale-105' : 'bg-gray-50 border-transparent text-gray-300 grayscale opacity-60 hover:opacity-100'}`}>
            <div className={formData.service === s.id ? 'text-amber-600' : 'text-gray-300'}>{s.icon}</div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-center">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Fechas Propuestas */}
      <div className="bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl shadow-black/20 space-y-5">
        <div className="flex items-center gap-2 mb-2 text-amber-500 font-black text-[12px] uppercase tracking-[0.2em]"><Clock size={18}/> Elige 3 opciones</div>
        {[1, 2, 3].map(n => <input key={n} required type="datetime-local" className="w-full p-5 rounded-2xl border-0 bg-white/10 text-white font-bold outline-none focus:bg-white/20 transition-all appearance-none" onChange={e => setFormData({...formData, [`slot${n}`]: e.target.value})} />)}
      </div>

      <button type="submit" className="w-full bg-black text-amber-500 py-7 rounded-[3rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 group active:scale-95 transition-all">
        <MessageCircle className="group-hover:rotate-12 transition-transform" /> SOLICITAR MI CITA
      </button>
    </form>
  );
}

function AdminView({ appointments, loading, onLogout }) {
  const confirmDate = async (item, slotKey) => {
    const selectedDate = item[slotKey];
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appointments', item.id), { status: 'confirmado', confirmedDate: selectedDate });
      const readable = new Date(selectedDate).toLocaleString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
      const msg = `👑 ¡Hola *${item.name}*!\n\nTu cita en *Dirgni Studio* ha sido CONFIRMADA.\n📅 Fecha: *${readable}*\n\n¡Estamos emocionados de recibirte! ✨`;
      window.open(`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center gap-6 animate-pulse">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="font-black text-[10px] text-gray-400 uppercase tracking-widest">Sincronizando Boutique...</span>
    </div>
  );

  const pending = appointments.filter(a => a.status === 'pendiente');

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="font-black text-3xl tracking-tighter uppercase italic leading-none text-black">Citas</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Nuevas Solicitudes ({pending.length})</p>
        </div>
        <button onClick={onLogout} className="bg-gray-100 p-3.5 rounded-2xl text-gray-400 hover:text-red-500 border border-gray-200"><Unlock size={22}/></button>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-gray-100 rounded-[4rem] py-32 text-center">
          <p className="text-gray-300 font-black uppercase text-[12px] tracking-[0.3em] italic">Sin pendientes por ahora</p>
        </div>
      ) : (
        pending.map(app => (
          <div key={app.id} className="bg-white border border-gray-50 rounded-[3.5rem] p-10 shadow-2xl shadow-gray-200/30 space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-3xl tracking-tighter uppercase leading-none text-black">{app.name} <span className="text-amber-600 font-light">{app.lastName}</span></h3>
                <div className="flex items-center gap-2 mt-4 text-gray-400 font-bold text-[11px] uppercase tracking-widest">
                   <Phone size={12} className="text-amber-500"/> {app.phone}
                </div>
              </div>
              <span className="bg-black text-amber-500 text-[10px] px-5 py-2.5 rounded-2xl font-black uppercase italic shadow-lg">
                {app.service}
              </span>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-50">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block ml-2">Confirmar espacio:</span>
              {['slot1', 'slot2', 'slot3'].map((k, idx) => (
                <button key={k} onClick={() => confirmDate(app, k)} className="w-full flex justify-between items-center p-6 bg-gray-50 rounded-3xl text-[12px] font-black hover:bg-black hover:text-amber-500 transition-all duration-300 border border-transparent hover:border-amber-500 group">
                  <span className="flex items-center gap-5">
                    <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-black group-hover:bg-amber-500 group-hover:text-black transition-colors">{idx + 1}</span>
                    {app[k] ? new Date(app[k]).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '---'}
                  </span>
                  <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
