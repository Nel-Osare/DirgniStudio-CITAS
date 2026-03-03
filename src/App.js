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
  Phone,
  Lock,
  Unlock,
  X
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'dirgni-studio-v1'; 
const SALON_PHONE = "50688274552"; 
const ADMIN_PIN = "2024"; 

export default function App() {
  const [view, setView] = useState('client'); 
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        if (error.code === 'auth/configuration-not-found') {
          setAuthError("Configuración pendiente en Firebase.");
        } else {
          setAuthError(error.message);
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || view !== 'admin' || !isAdminAuthenticated) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'appointments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, view, isAdminAuthenticated]);

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setShowPinModal(true);
    }
  };

  const verifyPin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminAuthenticated(true);
      setShowPinModal(false);
      setView('admin');
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-amber-100">
      {authError && (
        <div className="bg-red-600 text-white text-[10px] py-2 px-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest sticky top-0 z-[100]">
          <AlertTriangle size={12} /> {authError}
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/10 rotate-3 transition-transform">
              <Crown size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-black text-2xl leading-none tracking-tighter uppercase italic">
                Dirgni <span className="text-amber-600 font-light not-italic">Studio</span>
              </h1>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Boutique Experience</span>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner scale-90">
            <button 
              onClick={() => setView('client')} 
              className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${view === 'client' ? 'bg-white text-black shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'}`}
            >
              CITA
            </button>
            <button 
              onClick={handleAdminAccess} 
              className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${view === 'admin' ? 'bg-black text-amber-500 shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}
            >
              ADMIN
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 pb-32">
        {view === 'client' ? <ClientView authError={authError} /> : <AdminView appointments={appointments} loading={loading} authError={authError} onLogout={() => {setIsAdminAuthenticated(false); setView('client');}} />}
      </main>

      {showPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
               <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
                  <Lock size={24} />
               </div>
               <button onClick={() => setShowPinModal(false)} className="text-gray-300 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Acceso Privado</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Introduce el PIN de seguridad</p>
            
            <form onSubmit={verifyPin} className="space-y-4">
              <input 
                autoFocus
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="****"
                className={`w-full text-center text-3xl tracking-[0.5em] py-4 rounded-2xl bg-gray-50 border-2 outline-none transition-all ${pinError ? 'border-red-500 animate-shake' : 'border-transparent focus:border-amber-500 focus:bg-white'}`}
              />
              <button type="submit" className="w-full bg-black text-amber-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-800 transition-all">VERIFICAR</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientView({ authError }) {
  const [formData, setFormData] = useState({ name: '', lastName: '', phone: '', service: 'cabello', slot1: '', slot2: '', slot3: '' });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const serviceLabel = formData.service.toUpperCase();
    const fDate = (d) => d ? new Date(d).toLocaleString('es-CR', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '---';
    
    const msg = `👑 ¡Hola Dirgni Studio!\nSoy *${formData.name} ${formData.lastName}*.\nSolicito cita para: *${serviceLabel}*.\n\nOpciones:\n1️⃣ ${fDate(formData.slot1)}\n2️⃣ ${fDate(formData.slot2)}\n3️⃣ ${fDate(formData.slot3)}`;

    try {
      addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), { 
        ...formData, 
        status: 'pendiente', 
        createdAt: serverTimestamp() 
      });
    } catch (err) {
      console.warn("Error al guardar en BD, pero enviando WhatsApp...");
    }

    setIsSent(true);
    window.open(`https://wa.me/${SALON_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (isSent) return (
    <div className="text-center py-20 px-6 space-y-6">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100"><CheckCircle className="w-10 h-10 text-amber-600" /></div>
      <h2 className="text-2xl font-black uppercase tracking-tighter italic">¡Solicitud Enviada!</h2>
      <p className="text-gray-400 text-sm">Se ha abierto WhatsApp para que nos envíes el mensaje. Te confirmaremos pronto.</p>
      <button onClick={() => setIsSent(false)} className="text-[10px] font-black uppercase underline text-gray-400">Agendar otra</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-50 space-y-4">
        <div className="flex items-center gap-2 mb-2"><User size={14} className="text-amber-600"/><span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Tus Datos</span></div>
        <input required placeholder="Nombre" className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input required placeholder="Apellidos" className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium" onChange={e => setFormData({...formData, lastName: e.target.value})} />
        <input required type="tel" placeholder="WhatsApp" className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium" onChange={e => setFormData({...formData, phone: e.target.value})} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[{id:'cabello', label:'Cabello', icon:<Scissors size={18}/>}, {id:'maquillaje', label:'Makeup', icon:<Sparkles size={18}/>}, {id:'fotografia', label:'Foto', icon:<Camera size={18}/>}].map(s => (
          <button key={s.id} type="button" onClick={() => setFormData({...formData, service: s.id})} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${formData.service === s.id ? 'border-amber-500 bg-white shadow-lg text-black scale-105' : 'bg-gray-50 border-transparent text-gray-300 grayscale opacity-60'}`}>
            {s.icon} <span className="text-[9px] font-black uppercase tracking-tighter">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="flex items-center gap-2 mb-4 px-2 text-amber-500"><Clock size={18} /><span className="text-[11px] font-black uppercase tracking-[0.2em]">Elige 3 opciones</span></div>
        {[1, 2, 3].map(n => <input key={n} required type="datetime-local" className="w-full p-4 mb-3 rounded-2xl border-0 bg-white/10 text-white font-bold outline-none focus:bg-white/20 transition-all" onChange={e => setFormData({...formData, [`slot${n}`]: e.target.value})} />)}
      </div>

      <button type="submit" className="w-full bg-black text-amber-500 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-4"><MessageCircle /> SOLICITAR CITA</button>
    </form>
  );
}

function AdminView({ appointments, loading, authError, onLogout }) {
  const confirmDate = async (item, slotKey) => {
    const selectedDate = item[slotKey];
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appointments', item.id), { status: 'confirmado', confirmedDate: selectedDate });
      const readable = new Date(selectedDate).toLocaleString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
      const msg = `👑 ¡Hola *${item.name}*!\n\nTu cita en *Dirgni Studio* ha sido CONFIRMADA.\n📅 Fecha: *${readable}*\n\n¡Te esperamos! ✨`;
      window.open(`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) { console.error(err); }
  };

  if (authError) return (
    <div className="text-center py-20 p-8 bg-red-50 rounded-[3rem] border border-red-100 shadow-inner">
      <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-6" />
      <h2 className="font-black text-red-700 uppercase mb-4 text-sm tracking-widest leading-relaxed">Configuración Pendiente</h2>
      <div className="text-slate-500 text-[10px] leading-relaxed text-left max-w-xs mx-auto space-y-2 bg-white/50 p-6 rounded-2xl border border-red-100">
        <p>Para que el sistema funcione, debes:</p>
        <p>1. Ir a tu **Consola Firebase**.</p>
        <p>2. **Authentication** {' > '} **Sign-in method**.</p>
        <p>3. **Add new provider** {' > '} **Anonymous** {' > '} **Enable**.</p>
        <p>4. Guardar cambios y recargar esta página.</p>
      </div>
    </div>
  );

  if (loading) return <div className="py-20 flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div><span className="font-black text-[10px] text-gray-400 uppercase tracking-widest italic">Cargando Bóveda...</span></div>;

  const pending = appointments.filter(a => a.status === 'pendiente');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div><h2 className="font-black text-xl tracking-tighter uppercase italic leading-none">Citas</h2><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Nuevas Solicitudes</p></div>
        <button onClick={onLogout} className="bg-gray-100 text-gray-400 p-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"><Unlock size={18}/></button>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] py-24 text-center"><p className="text-gray-300 font-black uppercase text-[10px] tracking-widest italic">Sin pendientes</p></div>
      ) : (
        pending.map(app => (
          <div key={app.id} className="bg-white border border-gray-50 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/20 space-y-6">
            <div className="flex justify-between items-start">
              <div><h3 className="font-black text-2xl tracking-tighter uppercase leading-none">{app.name} <span className="text-amber-600">{app.lastName}</span></h3><p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{app.phone}</p></div>
              <span className="bg-black text-amber-500 text-[9px] px-4 py-2 rounded-xl font-black uppercase italic tracking-wider">{app.service}</span>
            </div>
            <div className="space-y-3">
              {['slot1', 'slot2', 'slot3'].map((k, idx) => (
                <button key={k} onClick={() => confirmDate(app, k)} className="w-full flex justify-between items-center p-5 bg-gray-50 rounded-2xl text-[11px] font-black hover:bg-black hover:text-amber-500 transition-all border border-transparent hover:border-amber-500 group">
                  <span className="flex items-center gap-4"><span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-[9px] font-black group-hover:bg-amber-500 group-hover:text-black transition-colors">{idx + 1}</span>{app[k] ? new Date(app[k]).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '---'}</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
