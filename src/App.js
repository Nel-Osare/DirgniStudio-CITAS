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
  Calendar
} from 'lucide-react';

/**
 * CONFIGURACIÓN DE FIREBASE PARA DIRGNI STUDIO
 * Estas credenciales permiten que la app guarde las citas en tu base de datos real.
 */
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
const appId = 'dirgni-studio-v1'; 
const SALON_PHONE = "50688274552"; // Tu número de WhatsApp para notificaciones

export default function App() {
  const [view, setView] = useState('client'); 
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Autenticación anónima para seguridad básica en Firestore
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de autenticación:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Escucha en tiempo real de las citas (solo para vista Admin)
  useEffect(() => {
    if (!user || view !== 'admin') return;
    
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'appointments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar por fecha de creación (más recientes primero)
      setAppointments(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (error) => {
      console.error("Error en Firestore:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, view]);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-amber-100">
      {/* Navegación Táctica */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-4 h-16 flex items-center justify-between max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-black p-1.5 rounded-lg shadow-lg">
            <Crown className="text-amber-500 w-5 h-5" />
          </div>
          <h1 className="font-black text-xl tracking-tighter uppercase">
            Dirgni <span className="text-amber-600 font-light">Studio</span>
          </h1>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
          <button 
            onClick={() => setView('client')} 
            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${view === 'client' ? 'bg-black text-amber-500 shadow-md scale-105' : 'text-slate-400'}`}
          >
            CLIENTE
          </button>
          <button 
            onClick={() => setView('admin')} 
            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${view === 'admin' ? 'bg-black text-amber-500 shadow-md scale-105' : 'text-slate-400'}`}
          >
            ADMIN
          </button>
        </div>
      </nav>

      {/* Contenedor Principal */}
      <main className="max-w-xl mx-auto p-4 pb-20">
        {view === 'client' ? <ClientView /> : <AdminView appointments={appointments} loading={loading} />}
      </main>
    </div>
  );
}

function ClientView() {
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
    try {
      // Guardar en la base de datos
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), { 
        ...formData, 
        status: 'pendiente', 
        createdAt: serverTimestamp() 
      });

      // Preparar mensaje de WhatsApp
      const msg = `👑 ¡Hola Dirgni Studio!\n\nSoy *${formData.name} ${formData.lastName}*.\nSolicito una cita para: *${formData.service.toUpperCase()}*.\n\nMis opciones de horario son:\n1️⃣ ${new Date(formData.slot1).toLocaleString()}\n2️⃣ ${new Date(formData.slot2).toLocaleString()}\n3️⃣ ${new Date(formData.slot3).toLocaleString()}\n\nQuedo a la espera de confirmación. ✨`;
      
      setIsSent(true);
      window.open(`https://wa.me/${SALON_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) {
      console.error("Error al agendar:", err);
    }
  };

  if (isSent) {
    return (
      <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="bg-amber-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-200">
          <CheckCircle className="w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-3xl font-black uppercase mb-2">¡Solicitud Enviada!</h2>
        <p className="text-slate-500 mb-8 px-6">Te hemos redirigido a WhatsApp para finalizar el proceso. Te confirmaremos pronto.</p>
        <button 
          onClick={() => setIsSent(false)} 
          className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors underline"
        >
          Agendar otra cita
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <section className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tus Datos</span>
        </div>
        <input 
          required 
          placeholder="Nombre" 
          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
          onChange={e => setFormData({...formData, name: e.target.value})} 
        />
        <input 
          required 
          placeholder="Apellido" 
          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
          onChange={e => setFormData({...formData, lastName: e.target.value})} 
        />
        <input 
          required 
          type="tel" 
          placeholder="Tu Celular (WhatsApp)" 
          className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
          onChange={e => setFormData({...formData, phone: e.target.value})} 
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Servicio Deseado</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'cabello', icon: <Scissors size={14}/>, label: 'Pelo' },
            { id: 'maquillaje', icon: <Sparkles size={14}/>, label: 'MakeUp' },
            { id: 'fotografia', icon: <Camera size={14}/>, label: 'Foto' }
          ].map(s => (
            <button 
              key={s.id} 
              type="button" 
              onClick={() => setFormData({...formData, service: s.id})} 
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.service === s.id ? 'border-amber-500 bg-white text-black shadow-lg scale-105' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
            >
              {s.icon}
              <span className="text-[10px] font-black uppercase">{s.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 p-6 rounded-[2.5rem] space-y-4 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/50">Elige 3 opciones de horario</span>
        </div>
        {[1, 2, 3].map(n => (
          <div key={n} className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-600/30">OPCIÓN {n}</span>
            <input 
              required 
              type="datetime-local" 
              className="w-full p-4 pl-16 rounded-2xl border-0 bg-white/10 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none" 
              onChange={e => setFormData({...formData, [`slot${n}`]: e.target.value})} 
            />
          </div>
        ))}
      </section>

      <button 
        type="submit" 
        className="w-full bg-black text-amber-500 py-6 rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all hover:bg-slate-800 group"
      >
        <MessageCircle className="group-hover:rotate-12 transition-transform" /> 
        ENVIAR SOLICITUD
      </button>
    </form>
  );
}

function AdminView({ appointments, loading }) {
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

      const msg = `👑 ¡Hola *${item.name}*!\n\nTu cita en *Dirgni Studio* ha sido CONFIRMADA.\n\n📅 Fecha: *${readableDate}*.\n\n¡Te esperamos para resaltar tu belleza! ✨`;
      
      const cleanPhone = item.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) {
      console.error("Error al confirmar:", err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-black text-[10px] tracking-widest text-slate-400 uppercase">Consultando Agenda...</span>
      </div>
    );
  }

  const pending = appointments.filter(a => a.status === 'pendiente');

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Solicitudes Entrantes</h2>
        <span className="bg-amber-100 text-amber-700 text-[10px] px-3 py-1 rounded-full font-black">{pending.length} NUEVAS</span>
      </div>

      {pending.length === 0 ? (
        <div className="bg-slate-50 rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay citas pendientes hoy</p>
        </div>
      ) : (
        pending.map(app => (
          <div key={app.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-lg uppercase leading-none">{app.name} {app.lastName}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{app.phone}</p>
              </div>
              <span className="bg-black text-amber-500 text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-tighter shadow-sm">{app.service}</span>
            </div>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Elige una opción para confirmar:</p>
            
            <div className="space-y-2">
              {['slot1', 'slot2', 'slot3'].map((k, idx) => (
                <button 
                  key={k} 
                  onClick={() => confirmDate(app, k)} 
                  className="w-full flex justify-between items-center p-4 bg-slate-50 rounded-2xl text-xs font-black hover:bg-black hover:text-amber-500 transition-all border border-transparent hover:border-amber-500 group/btn"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-amber-600/30 font-light">{idx + 1}</span>
                    {new Date(app[k]).toLocaleString('es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
