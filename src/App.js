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
  AlertTriangle
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

// Inicialización de Firebase
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
        console.error("Error de Auth:", error);
        if (error.code === 'auth/configuration-not-found') {
          setAuthError("ALERTA: Debes activar 'Anonymous' en Authentication > Sign-in method en tu Consola Firebase.");
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
    }, (error) => {
      console.error("Error de Firestore:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, view]);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-amber-100">
      {authError && (
        <div className="bg-red-600 text-white text-[11px] p-3 text-center flex items-center justify-center gap-2 sticky top-0 z-[60] font-bold">
          <AlertTriangle size={14} />
          {authError}
        </div>
      )}

      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-4 h-16 flex items-center justify-between max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-black p-1.5 rounded-lg shadow-md">
            <Crown className="text-amber-500 w-5 h-5" />
          </div>
          <h1 className="font-black text-xl tracking-tighter uppercase">
            Dirgni <span className="text-amber-600 font-light">Studio</span>
          </h1>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-sm">
          <button 
            onClick={() => setView('client')} 
            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${view === 'client' ? 'bg-black text-amber-500 shadow-lg' : 'text-slate-400'}`}
          >
            CLIENTE
          </button>
          <button 
            onClick={() => setView('admin')} 
            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${view === 'admin' ? 'bg-black text-amber-500 shadow-lg' : 'text-slate-400'}`}
          >
            ADMIN
          </button>
        </div>
      </nav>

      <main className="max-w-xl mx-auto p-4 pb-20">
        {view === 'client' ? <ClientView authError={authError} /> : <AdminView appointments={appointments} loading={loading} authError={authError} />}
      </main>
    </div>
  );
}

function ClientView({ authError }) {
  const [formData, setFormData] = useState({ 
    name: '', 
    lastName: '', 
    phone: '', 
    service: 'cabello', 
    slot1: '', 
    slot2: '', 
    slot3: '' 
  });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authError) {
      alert("Error técnico detectado: " + authError);
      return;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), { 
        ...formData, 
        status: 'pendiente', 
        createdAt: serverTimestamp() 
      });

      const serviceLabel = formData.service === 'cabello' ? 'CABELLO' : formData.service === 'maquillaje' ? 'MAQUILLAJE' : 'FOTOGRAFÍA';

      const msg = `👑 ¡Hola Dirgni Studio!\nSoy *${formData.name} ${formData.lastName}*.\nSolicito cita para: *${serviceLabel}*.\n\nOpciones:\n1️⃣ ${new Date(formData.slot1).toLocaleString()}\n2️⃣ ${new Date(formData.slot2).toLocaleString()}\n3️⃣ ${new Date(formData.slot3).toLocaleString()}`;
      
      setIsSent(true);
      window.open(`https://wa.me/${SALON_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) {
      console.error("Error al agendar:", err);
    }
  };

  if (isSent) {
    return (
      <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="bg-amber-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200">
          <CheckCircle className="w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-2xl font-black uppercase">¡Cita Solicitada!</h2>
        <p className="text-slate-400 text-sm mt-2 px-8">Se ha abierto WhatsApp. Te confirmaremos tu espacio lo antes posible.</p>
        <button onClick={() => setIsSent(false)} className="mt-8 text-[10px] font-black uppercase underline tracking-tighter text-slate-400">Agendar otra</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-1 px-2">
          <User className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tus Datos</span>
        </div>
        <input required placeholder="Nombre" className="w-full p-4 rounded-2xl border bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input required placeholder="Apellido" className="w-full p-4 rounded-2xl border bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" onChange={e => setFormData({...formData, lastName: e.target.value})} />
        <input required type="tel" placeholder="WhatsApp (Celular)" className="w-full p-4 rounded-2xl border bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" onChange={e => setFormData({...formData, phone: e.target.value})} />
      </div>

      <div className="grid grid-cols-3 gap-2 px-1">
        {[
          { id: 'cabello', icon: <Scissors size={14}/>, label: 'Cabello' },
          { id: 'maquillaje', icon: <Sparkles size={14}/>, label: 'Maquillaje' },
          { id: 'fotografia', icon: <Camera size={14}/>, label: 'Fotografía' }
        ].map(s => (
          <button 
            key={s.id} 
            type="button" 
            onClick={() => setFormData({...formData, service: s.id})} 
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.service === s.id ? 'border-amber-500 bg-white text-black shadow-lg scale-105' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
          >
            {s.icon}
            <span className="text-[9px] font-black uppercase text-center leading-tight">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 p-6 rounded-[2.5rem] space-y-3 shadow-xl border border-slate-800">
        <div className="flex items-center gap-2 mb-2 px-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">3 Horarios de preferencia</span>
        </div>
        {[1, 2, 3].map(n => (
          <input 
            key={n} 
            required 
            type="datetime-local" 
            className="w-full p-4 rounded-2xl border-0 bg-white/10 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
            onChange={e => setFormData({...formData, [`slot${n}`]: e.target.value})} 
          />
        ))}
      </div>

      <button type="submit" className="w-full bg-black text-amber-500 py-6 rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all hover:bg-slate-800">
        <MessageCircle /> SOLICITAR CITA
      </button>
    </form>
  );
}

function AdminView({ appointments, loading, authError }) {
  const confirmDate = async (item, slotKey) => {
    const selectedDate = item[slotKey];
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appointments', item.id), { 
        status: 'confirmado', 
        confirmedDate: selectedDate 
      });
      
      const readableDate = new Date(selectedDate).toLocaleString('es-CR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      
      const msg = `👑 ¡Hola *${item.name}*!\n\nTu cita en *Dirgni Studio* ha sido CONFIRMADA para el:\n📅 *${readableDate}*\n\n¡Te esperamos! ✨`;
      
      const cleanPhone = item.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) {
      console.error("Error al confirmar:", err);
    }
  };

  if (authError) {
    return (
      <div className="text-center py-20 p-8 bg-red-50 rounded-[2.5rem] border border-red-100">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="font-black text-red-700 uppercase mb-2 text-sm">Configuración Pendiente</h2>
        <div className="text-slate-500 text-[10px] leading-relaxed text-left max-w-xs mx-auto">
          Para que el sistema funcione, debes:<br/>
          1. Ir a tu **Consola Firebase**.<br/>
          2. **Authentication** {' > '} **Sign-in method**.<br/>
          3. **Add new provider** {' > '} **Anonymous** {' > '} **Enable**.<br/>
          4. Guardar cambios y recargar esta página.
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="text-center py-20 flex flex-col items-center gap-4 animate-pulse">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="font-black text-[10px] text-slate-400 tracking-widest uppercase italic">Abriendo Agenda...</span>
    </div>
  );

  const pending = appointments.filter(a => a.status === 'pendiente');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Citas por Confirmar</h2>
        <span className="bg-amber-100 text-amber-700 text-[10px] px-3 py-1 rounded-full font-black tracking-tighter">{pending.length} NUEVAS</span>
      </div>

      {pending.length === 0 ? (
        <div className="bg-slate-50 rounded-[2.5rem] p-16 text-center border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Agenda despejada</p>
        </div>
      ) : (
        pending.map(app => (
          <div key={app.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-lg uppercase leading-none">{app.name} {app.lastName}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{app.phone}</p>
              </div>
              <span className="bg-black text-amber-500 text-[9px] px-3 py-1 rounded-lg font-black uppercase shadow-sm tracking-tighter">{app.service}</span>
            </div>
            
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 px-1">Seleccionar Horario:</p>
              {['slot1', 'slot2', 'slot3'].map((k, idx) => (
                <button 
                  key={k} 
                  onClick={() => confirmDate(app, k)} 
                  className="w-full flex justify-between items-center p-4 bg-slate-50 rounded-2xl text-[11px] font-black hover:bg-black hover:text-amber-500 transition-all border border-transparent hover:border-amber-500 group"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-amber-600/30 font-light text-[10px]">{idx + 1}</span>
                    {app[k] ? new Date(app[k]).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '---'}
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
