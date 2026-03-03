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
const ADMIN_PIN = "2024"; // PIN de acceso privado

export default function App() {
  const [view, setView] = useState('client'); 
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Estados para la Seguridad del Administrador
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
          setAuthError("Configuración pendiente: Activa 'Anonymous Login' en Firebase.");
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
    }, () => setLoading(false));
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

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setView('client');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111] font-sans selection:bg-amber-100">
      {/* Alerta de Error Crítico */}
      {authError && (
        <div className="bg-red-600 text-white text-[10px] py-2 px-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest sticky top-0 z-[100]">
          <AlertTriangle size={12} /> {authError}
        </div>
      )}

      {/* Navegación Estilo Boutique */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-amber-500 p-2 rounded-xl shadow-lg rotate-3 transition-transform hover:rotate-0">
              <Crown size={24} />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter uppercase italic leading-none text-black">Dirgni Studio</h1>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Exclusividad Boutique</span>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1.5 rounded-2xl scale-90 border border-gray-200 shadow-inner">
            <button 
              onClick={() => setView('client')} 
              className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${view === 'client' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}
            >
              CITA
            </button>
            <button 
              onClick={handleAdminAccess} 
              className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${view === 'admin' ? 'bg-black text-amber-500 shadow-md' : 'text-gray-400'}`}
            >
              ADMIN
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 pb-32">
        {view === 'client' ? (
          <ClientView />
        ) : (
          <AdminView appointments={appointments} loading={loading} authError={authError} onLogout={logoutAdmin} />
        )}
      </main>

      {/* Modal de Seguridad Lux */}
      {showPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
               <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
                  <Lock size={24} />
               </div>
               <button onClick={() => setShowPinModal(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                 <X size={20}/>
               </button>
            </div>
            
            <h2 className="text-xl font-black uppercase tracking-tighter mb-2 text-black">Bóveda Privada</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Introduce el PIN de administrador</p>
            
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
              {pinError && <p className="text-red-500 text-[9px] font-black uppercase text-center animate-pulse">PIN INCORRECTO</p>}
              <button type="submit" className="w-full bg-black text-amber-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-800 active:scale-95 transition-all">VERIFICAR ACCESO</button>
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

    // 1. Prioridad: Generar mensaje de WhatsApp
    const serviceLabel = formData.service === 'cabello' ? 'CABELLO' : formData.service === 'maquillaje' ? 'MAQUILLAJE' : 'FOTOGRAFÍA';
    const fDate = (d) => d ? new Date(d).toLocaleString('es-CR', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '---';
    const msg = `👑 ¡Hola Dirgni Studio!\nSoy *${formData.name} ${formData.lastName}*.\nSolicito cita para: *${serviceLabel}*.\n\nOpciones propuestas:\n1️⃣ ${fDate(formData.slot1)}\n2️⃣ ${fDate(formData.slot2)}\n3️⃣ ${fDate(formData.slot3)}\n\n¿Cuál tienen disponible?`;

    // 2. Abrir WhatsApp de inmediato
    window.open(`https://wa.me/${SALON_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    setIsSent(true);

    // 3. Guardar en Firestore en segundo plano
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), { 
        ...formData, 
        status: 'pendiente', 
        createdAt: serverTimestamp() 
      });
    } catch (err) {
      console.warn("Base de datos no disponible, pero se envió WhatsApp.");
    }
  };

  if (isSent) {
    return (
      <div className="text-center py-20 px-4 space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
          <CheckCircle className="w-12 h-12 text-amber-600 animate-bounce" />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-black italic">¡Solicitud Lista!</h2>
          <p className="text-gray-500 text-sm mt-3 leading-relaxed">Se ha abierto WhatsApp para confirmar tu espacio. ¡Nos vemos pronto!</p>
        </div>
        <button onClick={() => setIsSent(false)} className="px-8 py-3 rounded-full border-2 border-amber-500 text-amber-600 font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-all">Agendar otra experiencia</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-700">
      {/* Sección Datos */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-50 space-y-4">
        <div className="flex items-center gap-2 mb-2">
            <User size={14} className="text-amber-600"/>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Tus Datos de Contacto</span>
        </div>
        <input required placeholder="Nombre" className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-black" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input required placeholder="Apellidos" className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-black" onChange={e => setFormData({...formData, lastName: e.target.value})} />
        <input required type="tel" placeholder="WhatsApp (Celular)" className="w-full p-5 rounded-2xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-black" onChange={e => setFormData({...formData, phone: e.target.value})} />
      </div>

      {/* Servicios Premium */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {id:'cabello', label:'Cabello', icon:<Scissors size={20}/>}, 
          {id:'maquillaje', label:'Makeup', icon:<Sparkles size={20}/>}, 
          {id:'fotografia', label:'Fotografía', icon:<Camera size={20}/>}
        ].map(s => (
          <button key={s.id} type="button" onClick={() => setFormData({...formData, service: s.id})} className={`p-6 rounded-[2.2rem] border-2 flex flex-col items-center gap-3 transition-all duration-300 ${formData.service === s.id ? 'border-amber-500 bg-white shadow-xl text-black scale-105' : 'bg-gray-50 border-transparent text-gray-300 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}>
            <div className={`${formData.service === s.id ? 'text-amber-600' : 'text-gray-300'}`}>{s.icon}</div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-none">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Horarios Boutique */}
      <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl space-y-4 relative overflow-hidden group">
        <div className="flex items-center gap-2 mb-2 text-amber-500 font-black text-[11px] uppercase tracking-widest relative z-10">
          <Clock size={16}/> Elige 3 opciones de horario
        </div>
        {[1, 2, 3].map(n => (
          <input key={n} required type="datetime-local" 
            className="w-full p-4 rounded-xl border-0 bg-white/10 text-white font-bold outline-none focus:bg-white/20 transition-all relative z-10 appearance-none" 
            onChange={e => setFormData({...formData, [`slot${n}`]: e.target.value})} />
        ))}
        <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] text-center pt-2 italic">Confirmaremos la mejor opción contigo</p>
      </div>

      <button type="submit" className="w-full bg-black text-amber-500 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 group hover:bg-gray-900 active:scale-95 transition-all">
        <MessageCircle className="group-hover:rotate-12 transition-transform" /> 
        SOLICITAR MI CITA
      </button>
    </form>
  );
}

function AdminView({ appointments, loading, authError, onLogout }) {
  const confirmDate = async (item, slotKey) => {
    const selectedDate = item[slotKey];
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appointments', item.id), { 
        status: 'confirmado', confirmedDate: selectedDate 
      });
      const readable = new Date(selectedDate).toLocaleString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
      const msg = `👑 ¡Hola *${item.name}*!\n\nTu cita en *Dirgni Studio* ha sido CONFIRMADA.\n📅 Fecha: *${readable}*\n\n¡Estamos emocionados de recibirte! ✨`;
      window.open(`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) { console.error(err); }
  };

  if (authError) return (
    <div className="text-center py-20 p-8 bg-red-50 rounded-[3rem] border border-red-100 shadow-inner">
      <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-6" />
      <h2 className="font-black text-red-700 uppercase mb-4 text-sm tracking-widest leading-relaxed">Configuración Pendiente</h2>
      <div className="text-slate-500 text-[10px] leading-relaxed text-left max-w-xs mx-auto space-y-3 bg-white/50 p-6 rounded-2xl border border-red-100 font-medium">
        <p>Para que el sistema funcione, debes:</p>
        <p>1. Ir a tu **Consola Firebase**.</p>
        <p>2. **Authentication** {' > '} **Sign-in method**.</p>
        <p>3. **Add new provider** {' > '} **Anonymous** {' > '} **Enable**.</p>
        <p>4. Guardar cambios y recargar esta página.</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center gap-6 animate-pulse">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="font-black text-[10px] text-gray-400 uppercase tracking-[0.4em] italic">Abriendo la Bóveda Boutique...</span>
    </div>
  );

  const pending = appointments.filter(a => a.status === 'pendiente');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="font-black text-xl tracking-tighter uppercase italic leading-none text-black">Solicitudes</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestionar Agenda</p>
        </div>
        <button onClick={onLogout} className="bg-gray-100 p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-gray-200">
          <Unlock size={18}/>
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] py-24 text-center">
          <p className="text-gray-300 font-black uppercase text-[10px] tracking-[0.3em] italic">Studio al día, sin pendientes</p>
        </div>
      ) : (
        pending.map(app => (
          <div key={app.id} className="bg-white border border-gray-50 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/20 space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-2xl tracking-tighter uppercase leading-none text-black">{app.name} <span className="text-amber-600 font-light">{app.lastName}</span></h3>
                <div className="flex items-center gap-2 mt-3 text-gray-400">
                   <Phone size={10} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">{app.phone}</span>
                </div>
              </div>
              <span className="bg-black text-amber-500 text-[9px] px-4 py-2 rounded-xl font-black uppercase italic tracking-wider shadow-lg shadow-black/10">
                {app.service}
              </span>
            </div>
            
            <div className="space-y-3 pt-2">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block ml-2">Asignar disponibilidad:</span>
              {['slot1', 'slot2', 'slot3'].map((k, idx) => (
                <button key={k} onClick={() => confirmDate(app, k)} className="w-full flex justify-between items-center p-5 bg-gray-50 rounded-2xl text-[11px] font-black hover:bg-black hover:text-amber-500 transition-all border border-transparent hover:border-amber-500 group">
                  <span className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-[9px] font-black group-hover:bg-amber-500 group-hover:text-black transition-colors">{idx + 1}</span>
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
