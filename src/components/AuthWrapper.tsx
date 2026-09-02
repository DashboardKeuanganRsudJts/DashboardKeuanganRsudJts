import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  setPersistence, 
  browserSessionPersistence,
  User 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, getDocFromCache } from 'firebase/firestore';
import { Loader2, Mail, Lock, Eye, EyeOff, Activity, FileText, ShieldCheck, Clock, CheckCircle2, X, LogIn, UserCheck } from 'lucide-react';
import { RsudLogo } from './RsudLogo';
import { MotifBackground } from './MotifBackground';
import bgImage from '../assets/images/rsud_jatisari_bg_1787917665665.jpg';

interface AuthWrapperProps {
  children: (
    user: User | null, 
    isAdmin: boolean, 
    role: string, 
    isLoginModalOpen: boolean, 
    openLoginModal: () => void, 
    closeLoginModal: () => void
  ) => React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [role, setRole] = useState<string>('viewer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginBg, setLoginBg] = useState<string>(localStorage.getItem('rsud_custom_login_bg') || bgImage);
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleBgUpdate = () => {
      const saved = localStorage.getItem('rsud_custom_login_bg');
      setLoginBg(saved || bgImage);
    };
    window.addEventListener('rsud_bg_updated', handleBgUpdate);
    return () => window.removeEventListener('rsud_bg_updated', handleBgUpdate);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          let userDocSnap;
          try {
            userDocSnap = await getDoc(userDocRef);
          } catch (err: any) {
            console.warn("Could not fetch user document (might be offline):", err);
            // If offline, try to get from cache as a fallback if possible
            try {
              userDocSnap = await getDocFromCache(userDocRef);
            } catch (cacheErr) {
              console.info("Could not get user document from cache, assuming new/offline:", cacheErr);
            }
          }
          
          const isEmailAdmin = (currentUser.email === 'begegbayunugroho@gmail.com') || (currentUser.email?.toLowerCase().includes('admin') ?? false);
          const isEmailPajak = currentUser.email?.toLowerCase().includes('pajak') || currentUser.email?.toLowerCase().includes('ppn');
          
          if (userDocSnap && userDocSnap.exists()) {
            const data = userDocSnap.data();
            const userRole = data.role || (isEmailAdmin ? 'admin' : isEmailPajak ? 'pic_pajak' : 'viewer');
            const userIsAdmin = data.isAdmin === true || userRole === 'admin' || isEmailAdmin;
            const finalRole = userIsAdmin && (userRole === 'viewer' || !userRole) ? 'admin' : userRole;
            
            setRole(finalRole);
            setIsAdmin(userIsAdmin);
          } else {
            const defaultRole = isEmailAdmin ? 'admin' : isEmailPajak ? 'pic_pajak' : 'viewer';
            // Only try to set if we are potentially online, or handle the error
            try {
              await setDoc(userDocRef, {
                email: currentUser.email,
                role: defaultRole,
                isAdmin: defaultRole === 'admin',
                createdAt: new Date().toISOString()
              });
            } catch (setDocErr) {
              console.warn("Could not create user document (offline?):", setDocErr);
            }
            setRole(defaultRole);
            setIsAdmin(defaultRole === 'admin');
          }
        } catch (err) {
          console.error("Error in AuthWrapper auth state change:", err);
          const isEmailAdmin = (currentUser.email === 'begegbayunugroho@gmail.com') || (currentUser.email?.toLowerCase().includes('admin') ?? false);
          const isEmailPajak = currentUser.email?.toLowerCase().includes('pajak') || currentUser.email?.toLowerCase().includes('ppn');
          setIsAdmin(isEmailAdmin);
          setRole(isEmailAdmin ? 'admin' : isEmailPajak ? 'pic_pajak' : 'viewer');
        }
      } else {
        setIsAdmin(false);
        setRole('viewer');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsSubmitting(true);
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const isEmailAdmin = (currentUser.email === 'begegbayunugroho@gmail.com') || (currentUser.email?.toLowerCase().includes('admin') ?? false);
      const isEmailPajak = (currentUser.email?.toLowerCase().includes('pajak') ?? false) || (currentUser.email?.toLowerCase().includes('ppn') ?? false);
      
      if (!userDocSnap.exists()) {
        const assignedRole = isEmailAdmin ? 'admin' : isEmailPajak ? 'pic_pajak' : selectedRole;
        await setDoc(userDocRef, {
          email: currentUser.email,
          role: assignedRole,
          isAdmin: assignedRole === 'admin',
          createdAt: new Date().toISOString()
        });
        setRole(assignedRole);
        setIsAdmin(assignedRole === 'admin');
      } else {
        const d = userDocSnap.data();
        const userRole = d.role || (isEmailAdmin ? 'admin' : isEmailPajak ? 'pic_pajak' : 'viewer');
        const userIsAdmin = d.isAdmin === true || userRole === 'admin' || isEmailAdmin;
        const finalRole = userIsAdmin && (userRole === 'viewer' || !userRole) ? 'admin' : userRole;
        setRole(finalRole);
        setIsAdmin(userIsAdmin);
      }
      setIsSubmitting(false);
      setIsLoginModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google.');
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Silakan masukkan email dan password.');
      return;
    }
    try {
      setError(null);
      setIsSubmitting(true);
      await setPersistence(auth, browserSessionPersistence);
      const isEmailAdmin = (email === 'begegbayunugroho@gmail.com') || email.toLowerCase().includes('admin');
      const isEmailPajak = email.toLowerCase().includes('pajak') || email.toLowerCase().includes('ppn');

      if (isLoginMode) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', res.user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const d = snap.data();
          const userRole = d.role || (isEmailAdmin ? 'admin' : isEmailPajak ? 'pic_pajak' : 'viewer');
          const userIsAdmin = d.isAdmin === true || userRole === 'admin' || isEmailAdmin;
          const finalRole = userIsAdmin && (userRole === 'viewer' || !userRole) ? 'admin' : userRole;
          setRole(finalRole);
          setIsAdmin(userIsAdmin);
        } else {
          const roleVal = isEmailAdmin ? 'admin' : isEmailPajak ? 'pic_pajak' : 'viewer';
          setRole(roleVal);
          setIsAdmin(roleVal === 'admin');
        }
      } else {
        if (selectedRole.startsWith('pic_')) {
          const q = query(collection(db, 'users'), where('role', '==', selectedRole));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setError("Maaf PIC yang anda pilih sudah ada");
            setIsSubmitting(false);
            return;
          }
        }

        const res = await createUserWithEmailAndPassword(auth, email, password);
        const assignedRole = isEmailAdmin ? 'admin' : (isEmailPajak && selectedRole === 'viewer') ? 'pic_pajak' : selectedRole;
        await setDoc(doc(db, 'users', res.user.uid), {
          email,
          role: assignedRole,
          isAdmin: assignedRole === 'admin',
          createdAt: new Date().toISOString()
        });
        setRole(assignedRole);
        setIsAdmin(assignedRole === 'admin');
      }
      setIsSubmitting(false);
      setIsLoginModalOpen(false);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || (err.message && err.message.includes('auth/invalid-credential'))) {
        setError('Daftar Heula Sateh Mun Rek Asup');
      } else {
        setError(err.message || 'Terjadi kesalahan autentikasi.');
      }
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center relative overflow-hidden">
        <MotifBackground />
        <div className="relative z-10 flex flex-col items-center">
          <RsudLogo className="w-24 h-24 mb-6 animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-[#2E7D32]" />
          <p className="mt-4 text-slate-500 font-medium text-sm">Memuat aplikasi RSUD Jatisari...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children(
        user, 
        isAdmin, 
        role, 
        isLoginModalOpen, 
        () => setIsLoginModalOpen(true), 
        () => setIsLoginModalOpen(false)
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 sm:p-10 border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-5">
              <RsudLogo className="w-16 h-16" />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#0D47A1] mb-1">
                {isLoginMode ? 'Login Akses Keuangan' : 'Pendaftaran Akun PIC / Admin'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isLoginMode ? 'Masuk untuk mengelola data sub bagian keuangan' : 'Daftar akun baru dengan hak akses PIC'}
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 text-xs p-3 rounded-xl mb-4 border border-rose-100 font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@rsudjatisari.go.id"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] outline-none"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLoginMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Hak Akses (Role PIC)</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#1565C0]/25"
                  >
                    <option value="viewer">Viewer (Hanya Lihat)</option>
                    <option value="pic_pajak">PIC Pajak (Monitoring PPN & Faktur DJP Coretax)</option>
                    <option value="pic_piutang">PIC Piutang & Asuransi & Listrik</option>
                    <option value="pic_pendapatan">PIC Pendapatan BLUD</option>
                    <option value="pic_pengeluaran">PIC Pengeluaran BLUD</option>
                    <option value="pic_hutang">PIC Hutang & APBD</option>
                    <option value="admin">Super Admin (Semua Akses)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 mt-2 bg-gradient-to-r from-[#1565C0] to-[#2E7D32] hover:opacity-95 text-white font-bold rounded-xl text-xs tracking-wide transition shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isLoginMode ? 'MASUK KE SISTEM' : 'DAFTAR AKUN PIC'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-xs font-medium text-slate-600 hover:text-[#1565C0]"
              >
                {isLoginMode ? 'Belum punya akun PIC? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[11px] text-slate-400">atau</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Masuk dengan Google</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
