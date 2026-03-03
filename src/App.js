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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'dirgni-studio-v1'; 
const SALON_PHONE = "50688274552"; 

export default function App() {
  const [view, setView] = useState('client'); 
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

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
    if (!user || view !== 'admin') return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'appointments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, [user, view]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Alerta de Error de Configuración */}
      {authError && (
        <div className="bg-red-600 text-white text-[10px] py-2 px-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest sticky top-0 z-[100]">
          <AlertTriangle size={12} /> {authError}
        </div>
      )}

      {/* Header Estilo Boutique */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/10 rotate-3 transition-transform hover:rotate-0">
              <Crown size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-black text-2xl leading-none tracking-tighter uppercase italic">
                Dirgni <span className="text-amber-600 font-light not-italic">Studio</span>
              </h1>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Exclusividad & Estilo</span>
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
              onClick={() => setView('admin')} 
              className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${view === 'admin' ? 'bg-black text-amber-500 shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}
            >
              ADMIN
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 pb-32">
        {view === 'client' ? <ClientView authError={authError} /> : <AdminView appointments={appointments} loading={loading} authError={authError} />}
      </main>

      {/* Footer Branding */}
      <footer className="max-w-xl mx-auto text-center pb-12">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.4em]">© 2024 Dirgni Studio Boutique</p>
      </footer>
    </div>
  );
}

function ClientView({ authError }) {
  const [formData, setFormData] = useState({ name: '', lastName: '', phone: '', service: 'cabello', slot1: '', slot2: '', slot3: '' });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authError) return;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), { 
        ...formData, 
        status: 'pendiente', 
        createdAt: serverTimestamp() 
      });
      const serviceLabel = formData.service.toUpperCase();
      const msg = `👑 ¡Hola Dirgni Studio!\nSoy *${formData.name} ${formData.lastName}*.\nSolicito una cita para: *${serviceLabel}*.\n\nHorarios propuestos:\n1️⃣ ${new Date(formData.slot1).toLocaleString()}\n2️⃣ ${new Date(formData.slot2).toLocaleString()}\n3️⃣ ${new Date(formData.slot3).toLocaleString()}\n\n¿Cuál tienen disponible?`;
      setIsSent(true);
      window.open(`https://wa.me/${SALON_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) { console.error(err); }
  };

  if (isSent) {
    return (
      <div className="text-center py-20 px-4 space-y-6">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
          <CheckCircle className="w-12 h-12 text-amber-600 animate-bounce" />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">¡Solicitud Lista!</h2>
          <p className="text-gray-500 text-sm mt-3 leading-relaxed">Hemos abierto WhatsApp para que nos envíes tu mensaje. Te responderemos en breve para confirmar.</p>
        </div>
        <button onClick={() => setIsSent(false)} className="px-8 py-3 rounded-full border-2 border-amber-500 text-amber-600 font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-all">Pedir otra cita</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sección Datos */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-[2px] w-12 bg-amber-500"></div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Tus Datos de Contacto</span>
        </div>
        
        <div className="grid gap-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-600 transition-colors" size={18} />
            <input required placeholder="Nombre" className="w-full pl-12 pr-4 py-5 rounded-[1.5rem] bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-gray-300 font-medium" onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <input required placeholder="Apellidos" className="w-full px-6 py-5 rounded-[1.5rem] bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-gray-300 font-medium" onChange={e => setFormData({...formData, lastName: e.target.value})} />
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-600 transition-colors" size={18} />
            <input required type="tel" placeholder="WhatsApp" className="w-full pl-12 pr-4 py-5 rounded-[1.5rem] bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-gray-300 font-medium" onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
        </div>
      </div>

      {/* Sección Servicios */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-[2px] w-12 bg-amber-500"></div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">¿Qué servicio deseas?</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'cabello', icon: <Scissors size={20}/>, label: 'Cabello' },
            { id: 'maquillaje', icon: <Sparkles size={20}/>, label: 'Maquillaje' },
            { id: 'fotografia', icon: <Camera size={20}/>, label: 'Fotografía' }
          ].map(s => (
            <button key={s.id} type="button" onClick={() => setFormData({...formData, service: s.id})} 
              className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all duration-300 ${formData.service === s.id ? 'border-amber-500 bg-white shadow-xl shadow-amber-500/10 scale-105 text-black' : 'bg-gray-50 border-transparent text-gray-400 grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}`}>
              {s.icon}
              <span className="text-[9px] font-black uppercase tracking-tighter">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sección Horarios */}
      <div className="bg-[#111] p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Clock size={120} className="text-white" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-amber-500" size={18} />
            <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">Elige 3 opciones de horario</span>
          </div>
          {[1, 2, 3].map(n => (
            <div key={n} className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-black text-xs">{n}</span>
              <input required type="datetime-local" 
                className="w-full pl-10 pr-4 py-4 rounded-2xl border-0 bg-white/10 text-white font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none" 
                onChange={e => setFormData({...formData, [`slot${n}`]: e.target.value})} />
            </div>
          ))}
          <p className="text-[9px] text-white/30 font-medium px-2 italic uppercase">Revisaremos cuál de tus opciones se ajusta mejor a nuestra agenda.</p>
        </div>
      </div>

      <button type="submit" className="w-full bg-black text-amber-500 py-6 rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-4 shadow-2xl shadow-black/20 hover:bg-gray-900 active:scale-[0.98] transition-all group">
        <MessageCircle className="group-hover:rotate-12 transition-transform" />
        AGENDAR EXPERIENCIA
      </button>
    </form>
  );
}

function AdminView({ appointments, loading, authError }) {
  const confirmDate = async (item, slotKey) => {
    const selectedDate = item[slotKey];
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appointments', item.id), { 
        status: 'confirmado', confirmedDate: selectedDate 
      });
      const readable = new Date(selectedDate).toLocaleString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
      const msg = `👑 ¡Hola *${item.name}*!\n\nTu cita en *Dirgni Studio* ha sido CONFIRMADA.\n\n📅 Fecha: *${readable}*\n\n¡Estamos emocionados de recibirte! ✨`;
      window.open(`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) { console.error(err); }
  };

  if (authError) return <div className="text-center py-20 bg-red-50 rounded-[3rem] border border-red-100 p-10"><AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="font-black text-red-700 uppercase mb-4">Configuración Requerida</h2><p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">Para que el sistema funcione, activa el inicio de sesión **Anónimo** en tu consola de Firebase (Authentication {' > '} Sign-in method).</p></div>;

  if (loading) return <div className="py-20 flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div><span className="font-black text-[10px] text-gray-400 uppercase tracking-widest italic">Abriendo el Salón...</span></div>;

  const pending = appointments.filter(a => a.status === 'pendiente');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="font-black text-xl tracking-tighter uppercase italic">Solicitudes</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pendientes de confirmación</p>
        </div>
        <span className="bg-amber-100 text-amber-700 text-[10px] px-4 py-1.5 rounded-full font-black shadow-sm ring-1 ring-amber-200">{pending.length} NUEVAS</span>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] py-24 text-center">
          <p className="text-gray-300 font-black uppercase text-[10px] tracking-widest italic">Sin citas por ahora</p>
        </div>
      ) : (
        pending.map(app => (
          <div key={app.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/20 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-2xl tracking-tighter uppercase leading-none">{app.name} <span className="text-amber-600">{app.lastName}</span></h3>
                <div className="flex items-center gap-2 mt-2 text-gray-400">
                  <Phone size={10} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{app.phone}</span>
                </div>
              </div>
              <div className="bg-black text-amber-500 text-[9px] px-4 py-2 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-black/10">
                {app.service}
              </div>
            </div>
            
            <div className="space-y-3">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block ml-2">Confirmar disponibilidad:</span>
              {['slot1', 'slot2', 'slot3'].map((k, idx) => (
                <button key={k} onClick={() => confirmDate(app, k)} 
                  className="w-full flex justify-between items-center p-5 bg-gray-50 rounded-2xl text-[11px] font-black hover:bg-black hover:text-amber-500 transition-all border border-transparent hover:border-amber-500 group">
                  <span className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-[9px] font-black group-hover:bg-amber-500 group-hover:text-black transition-colors">{idx + 1}</span>
                    {app[k] ? new Date(app[k]).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '---'}
                  </span>
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
