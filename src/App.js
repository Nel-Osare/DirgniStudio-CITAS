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
// CONFIGURACIÓN DE FIREBASE (CONFIRMADA)
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
const ADMIN_PIN = "2024"; // PIN de acceso para ti

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
        setAuthError("Error: Activa 'Anonymous Login' en Firebase.");
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
    }, () => setLoading(false));
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
      {authError && (
        <div className="bg-red-600 text-white text-[10px] py-2 text-center font-bold uppercase sticky top-0 z-[100] flex items-center justify-center gap-2">
          <AlertTriangle size={12} /> {authError}
        </div>
      )}

      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-amber-500 p-2 rounded-xl shadow-lg rotate-3">
              <Crown size={24} />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter uppercase italic leading-none text-black">Dirgni Studio</h1>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Exclusividad Boutique</span>
            </div>
          </div>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl scale-90 border border-gray-200">
            <button onClick={() => setView('client')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${view === 'client' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}>CITA</button>
            <button onClick={handleAdminAccess} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${view === 'admin' ? 'bg-black text-amber-500 shadow-md' : 'text-gray-400'}`}>ADMIN</button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 pb-32">
        {view === 'client' ? <ClientView /> : <AdminView appointments={appointments} loading={loading} onLogout={() => {setIsAdminAuthenticated(false); setView('client');}} />}
      </main>

      {showPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-6">
               <div className="bg-amber-50 p-3 rounded-2xl text-amber-600"><Lock size={24} /></div>
               <button onClick={() => setShowPinModal(false)}><X size={20} className="text-gray-300"/></button>
            </div>
            <h2 className="text-xl font-black uppercase mb-2">Acceso Privado</h2>
            <form onSubmit={verifyPin} className="space-y-4">
              <input autoFocus type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="****" className={`w-full text-center text-3xl tracking-[0.5em] py-4 rounded-2xl bg-gray-50 border-2 outline-none transition-all ${pinError ? 'border-red-500 animate-shake' : 'border-transparent focus:border-amber-500'}`} />
              <button type="submit" className="w-full bg-black text-amber-500 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-gray-800">ENTRAR</button>
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
    
    const serviceLabel = formData.service === 'cabello' ? 'CABELLO' : formData.service === 'maquillaje' ? 'MAQUILLAJE' : 'FOTOGRAFÍA';
    const fDate = (d) => d ? new Date(d).toLocaleString('es-CR', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '---';
    const msg = `👑 ¡Hola Dirgni Studio!\nSoy *${formData.name} ${formData.lastName}*.\nSolicito cita para: *${serviceLabel}*.\n\nHorarios:\n1️⃣ ${fDate(formData.slot1)}\n2️⃣ ${fDate(formData.slot2)}\n3️⃣ ${fDate(formData.slot3)}`;

    // ABRIR WHATSAPP INMEDIATAMENTE
    window.open(`https://wa.me/${SALON_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    setIsSent(true);

    // GUARDAR EN BD EN SEGUNDO PLANO
    try {
      addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), { ...formData, status: 'pendiente', createdAt: serverTimestamp() });
    } catch (err) { console.warn("Guardado fallido, WhatsApp enviado."); }
  };

  if (isSent) return (
    <div className="text-center py-20 px-6 space-y-6 animate-in zoom-in duration-500">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100"><CheckCircle className="w-10 h-10 text-amber-600" /></div>
      <h2 className="text-2xl font-black uppercase tracking-tighter italic text-black">¡Solicitud Enviada!</h2>
      <p className="text-gray-400 text-sm">Ya abrimos WhatsApp con tu mensaje listo. Estaremos en contacto pronto.</p>
      <button onClick={() => setIsSent(false)} className="text-[10px] font-black uppercase underline text-gray-400 tracking-widest">Pedir otra cita</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-50 space-y-4">
        <div className="flex items-center gap-2 mb-2"><User size={14} className="text-amber-600"/><span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Tus Datos</span></div>
        <input required placeholder="Nombre" className="w-full p-5 rounded-2xl bg-gray-50 outline-none border-2 border-transparent focus:border-amber-500/20 focus:bg-white transition-all font-medium" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input required placeholder="Apellidos" className="w-full p-5 rounded-2xl bg-gray-50 outline-none border-2 border-transparent focus:border-amber-500/20 focus:bg-white transition-all font-medium" onChange={e => setFormData({...formData, lastName: e.target.value})} />
        <input required type="tel" placeholder="WhatsApp (Celular)" className="w-full p-5 rounded-2xl bg-gray-50 outline-none border-2 border-transparent focus:border-amber-500/20 focus:bg-white transition-all font-medium" onChange={e => setFormData({...formData, phone: e.target.value})} />
      </div>

      <div className="grid grid-cols-3 gap-2 px-1">
        {[
          {id:'cabello', label:'Cabello', icon:<Scissors size={20}/>}, 
          {id:'maquillaje', label:'Makeup', icon:<Sparkles size={20}/>}, 
          {id:'fotografia', label:'Foto', icon:<Camera size={20}/>}
        ].map(s => (
          <button key={s.id} type="button" onClick={() => setFormData({...formData, service: s.id})} className={`p-6 rounded-[2.2rem] border-2 flex flex-col items-center gap-3 transition-all ${formData.service === s.id ? 'border-amber-500 bg-white shadow-xl text-black scale-105' : 'bg-gray-50 border-transparent text-gray-300 grayscale opacity-60'}`}>
            {s.icon} <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-none">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl space-y-4 relative">
        <div className="flex items-center gap-2 mb-2 text-amber-500 font-black text-[11px] uppercase tracking-widest"><Clock size={16}/> Elige 3 opciones</div>
        {[1, 2, 3].map(n => <input key={n} required type="datetime-local" className="w-full p-4 rounded-xl border-0 bg-white/10 text-white font-bold outline-none focus:bg-white/20 transition-all" onChange={e => setFormData({...formData, [`slot${n}`]: e.target.value})} />)}
      </div>

      <button type="submit" className="w-full bg-black text-amber-500 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 group hover:bg-gray-900 active:scale-95 transition-all">
        <MessageCircle className="group-hover:rotate-12 transition-transform" /> AGENDAR CITA
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
      const msg = `👑 ¡Hola *${item.name}*!\nTu cita en *Dirgni Studio* ha sido CONFIRMADA.\n📅 Fecha: *${readable}* ✨`;
      window.open(`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="py-20 flex flex-col items-center justify-center animate-pulse"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const pending = appointments.filter(a => a.status === 'pendiente');

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-black text-xl tracking-tighter uppercase italic text-black">Solicitudes</h2>
        <button onClick={onLogout} className="bg-gray-100 p-2.5 rounded-xl text-gray-400 border border-gray-200"><Unlock size={18}/></button>
      </div>
      {pending.length === 0 ? <div className="py-24 text-center text-gray-300 font-black uppercase text-[10px] border-2 border-dashed border-gray-100 rounded-[3rem]">Sin pendientes</div> : 
        pending.map(app => (
          <div key={app.id} className="bg-white border border-gray-50 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/20 space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-start">
              <div><h3 className="font-black text-2xl tracking-tighter uppercase leading-none text-black">{app.name} <span className="text-amber-600 font-light">{app.lastName}</span></h3><p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">{app.phone}</p></div>
              <span className="bg-black text-amber-500 text-[9px] px-4 py-2 rounded-xl font-black uppercase italic shadow-lg shadow-black/10">{app.service}</span>
            </div>
            <div className="space-y-3 pt-2">
              {['slot1', 'slot2', 'slot3'].map((k, idx) => (
                <button key={k} onClick={() => confirmDate(app, k)} className="w-full flex justify-between items-center p-5 bg-gray-50 rounded-2xl text-[11px] font-black hover:bg-black hover:text-amber-500 transition-all border border-transparent hover:border-amber-500 group">
                  <span className="flex items-center gap-4"><span className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-[9px] font-black group-hover:bg-amber-500 transition-colors">{idx + 1}</span>{app[k] ? new Date(app[k]).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '---'}</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  );
}
