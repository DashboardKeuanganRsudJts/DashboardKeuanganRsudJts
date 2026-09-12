import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  KeyRound, 
  Loader2, 
  Eye, 
  EyeOff, 
  Upload, 
  Trash2, 
  ExternalLink, 
  Sparkles,
  RefreshCw,
  BadgeCheck,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { 
  User as FirebaseUser, 
  updateProfile, 
  updateEmail, 
  verifyBeforeUpdateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { getEffectiveDisplayName, getEffectiveUserAvatar, setLocalUserProfile } from '../utils/userProfile';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  role?: string;
  isAdmin?: boolean;
  onProfileUpdated?: () => void;
}

type TabType = 'profile' | 'email' | 'password' | 'role_info';

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  role,
  isAdmin,
  onProfileUpdated
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Email fields
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check providers
  const isGoogleProvider = user?.providerData.some(p => p.providerId === 'google.com');
  const isPasswordProvider = user?.providerData.some(p => p.providerId === 'password');

  // Sync current user state on open
  useEffect(() => {
    if (user && isOpen) {
      const effectiveName = getEffectiveDisplayName(user);
      const effectiveAvatar = getEffectiveUserAvatar(user);

      setDisplayName(user.displayName || effectiveName);
      setPhotoURL(effectiveAvatar.startsWith('https://ui-avatars.com') ? '' : effectiveAvatar);
      setPhotoPreview(effectiveAvatar);
      setCurrentEmail(user.email || '');
      setNewEmail('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEmailCurrentPassword('');
      setSuccessMessage(null);
      setErrorMessage(null);
      setCustomUrlInput('');

      // Also read firestore document in case additional data exists
      const loadFirestoreData = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.displayName) {
              setDisplayName(data.displayName);
              setLocalUserProfile(user.uid, { displayName: data.displayName });
            }
            if (data.photoURL) {
              setPhotoURL(data.photoURL);
              setPhotoPreview(data.photoURL);
              setLocalUserProfile(user.uid, { photoURL: data.photoURL });
            }
          }
        } catch (e) {
          console.warn('Could not read user profile from firestore:', e);
        }
      };
      loadFirestoreData();
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  // Helper to translate Firebase Auth errors into helpful Indonesian
  const getIndonesianErrorMessage = (codeOrMsg: string): string => {
    if (codeOrMsg.includes('auth/invalid-profile-attribute') || codeOrMsg.includes('Photo URL too long')) {
      return 'Ukuran atau tautan foto tidak didukung oleh atribut standar Firebase Auth.';
    }
    if (codeOrMsg.includes('auth/wrong-password') || codeOrMsg.includes('auth/invalid-credential')) {
      return 'Kata sandi saat ini tidak valid. Silakan periksa kembali.';
    }
    if (codeOrMsg.includes('auth/weak-password')) {
      return 'Kata sandi baru terlalu lemah. Minimal harus terdiri dari 6 karakter.';
    }
    if (codeOrMsg.includes('auth/requires-recent-login')) {
      return 'Sesi login telah kedaluwarsa demi keamanan. Silakan masukkan kata sandi saat ini atau login ulang terlebih dahulu.';
    }
    if (codeOrMsg.includes('auth/email-already-in-use')) {
      return 'Alamat email baru tersebut sudah terdaftar pada akun lain.';
    }
    if (codeOrMsg.includes('auth/invalid-email')) {
      return 'Format alamat email tidak valid.';
    }
    if (codeOrMsg.includes('auth/too-many-requests')) {
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lalu coba lagi.';
    }
    if (codeOrMsg.includes('auth/operation-not-allowed')) {
      return 'Operasi pembaruan profil belum diaktifkan pada server autentikasi.';
    }
    return codeOrMsg;
  };

  // Compress image before saving to base64 or upload
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle local file selection for avatar
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('File yang diunggah harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file terlalu besar. Maksimal 5 MB.');
      return;
    }

    try {
      setErrorMessage(null);
      setPhotoFile(file);
      const compressedDataUrl = await compressImage(file);
      setPhotoPreview(compressedDataUrl);
      setPhotoURL(compressedDataUrl);
    } catch (err) {
      console.error('Failed to compress image:', err);
      setErrorMessage('Gagal memproses gambar foto profil.');
    }
  };

  // Preset Avatars
  const presetAvatars = [
    { label: 'Avatar Hijau', url: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user.email || 'User')}&background=059669&color=fff&size=200&bold=true` },
    { label: 'Avatar Biru', url: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user.email || 'User')}&background=0284c7&color=fff&size=200&bold=true` },
    { label: 'Avatar Ungu', url: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user.email || 'User')}&background=7c3aed&color=fff&size=200&bold=true` },
    { label: 'Avatar Emas', url: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user.email || 'User')}&background=d97706&color=fff&size=200&bold=true` },
  ];

  // 1. SAVE PROFILE (USERNAME & FOTO PROFIL)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let finalPhotoURL = photoURL;

      // If user uploaded a physical file, try uploading to Firebase Storage first
      if (photoFile) {
        try {
          const fileExt = photoFile.name.split('.').pop() || 'jpg';
          const avatarStorageRef = ref(storage, `avatars/${user.uid}/profile_${Date.now()}.${fileExt}`);
          await uploadBytes(avatarStorageRef, photoFile);
          finalPhotoURL = await getDownloadURL(avatarStorageRef);
        } catch (storageErr) {
          console.warn('Firebase Storage upload unavailable or failed, using optimized local/firestore photo:', storageErr);
          // Fallback to compressed base64 preview
          finalPhotoURL = photoPreview;
        }
      }

      // Safe photoURL for Firebase Auth (must be valid http/https and <= 2000 chars)
      // Firebase Auth rejects base64 data URLs with "auth/invalid-profile-attribute: Photo URL too long"
      const isStandardWebUrl = !!(finalPhotoURL && (finalPhotoURL.startsWith('http://') || finalPhotoURL.startsWith('https://')) && finalPhotoURL.length <= 2000);
      const authPhotoURL = isStandardWebUrl 
        ? finalPhotoURL 
        : (finalPhotoURL ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.trim() || user.email || 'User')}&background=059669&color=fff&size=200&bold=true` : null);

      // Update Firebase Auth Profile (with graceful fallback so auth limits never block profile saves)
      try {
        await updateProfile(user, {
          displayName: displayName.trim() || null,
          photoURL: authPhotoURL
        });
      } catch (authProfileErr: any) {
        console.warn('Firebase Auth updateProfile warning:', authProfileErr);
        try {
          await updateProfile(user, {
            displayName: displayName.trim() || null
          });
        } catch (nameErr) {
          console.warn('Firebase Auth updateProfile displayName fallback warning:', nameErr);
        }
      }

      // Update Firestore user document (Stores the real custom photo, whether storage URL or base64)
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: displayName.trim(),
          photoURL: finalPhotoURL || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('Could not update Firestore user document:', firestoreErr);
      }

      // Save to localStorage for instant loading, offline support, and immediate display
      setLocalUserProfile(user.uid, {
        displayName: displayName.trim(),
        photoURL: finalPhotoURL || ''
      });

      // Reload auth current user state if possible
      if (auth.currentUser) {
        try {
          await auth.currentUser.reload();
        } catch (reloadErr) {
          console.warn('Could not reload currentUser:', reloadErr);
        }
      }

      setPhotoURL(finalPhotoURL);
      setPhotoPreview(finalPhotoURL);
      setPhotoFile(null);
      setSuccessMessage('Profil (Nama & Foto Profil) berhasil diperbarui!');
      
      // Dispatch global event for other components
      window.dispatchEvent(new Event('user_profile_updated'));
      onProfileUpdated?.();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMessage(getIndonesianErrorMessage(err.message || 'Gagal memperbarui profil.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. CHANGE EMAIL
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.trim()) {
      setErrorMessage('Silakan masukkan alamat email baru.');
      return;
    }

    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setErrorMessage('Alamat email baru sama dengan alamat email saat ini.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Re-authenticate if user logged in via password and entered password
      if (isPasswordProvider && emailCurrentPassword) {
        const credential = EmailAuthProvider.credential(user.email || '', emailCurrentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      const targetEmail = newEmail.trim().toLowerCase();

      // Modern Firebase Auth uses verifyBeforeUpdateEmail
      let emailUpdatedImmediately = false;
      try {
        await verifyBeforeUpdateEmail(user, targetEmail);
        setSuccessMessage(`Email konfirmasi telah dikirim ke ${targetEmail}. Silakan klik tautan di email tersebut untuk menyelesaikan pembaruan alamat email Anda.`);
      } catch (verifyErr: any) {
        console.warn('verifyBeforeUpdateEmail unsupported or failed, trying updateEmail:', verifyErr);
        // Fallback to updateEmail
        await updateEmail(user, targetEmail);
        emailUpdatedImmediately = true;
      }

      if (emailUpdatedImmediately) {
        // Update firestore document
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          email: targetEmail,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        setCurrentEmail(targetEmail);
        setNewEmail('');
        setEmailCurrentPassword('');
        setSuccessMessage('Alamat email berhasil diperbarui!');
      }

      if (auth.currentUser) {
        await auth.currentUser.reload();
      }
      window.dispatchEvent(new Event('user_profile_updated'));
      onProfileUpdated?.();
    } catch (err: any) {
      console.error('Error updating email:', err);
      setErrorMessage(getIndonesianErrorMessage(err.message || 'Gagal memperbarui email.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. CHANGE PASSWORD
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal harus terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    if (isPasswordProvider && !currentPassword) {
      setErrorMessage('Silakan masukkan kata sandi saat ini untuk konfirmasi.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Re-authenticate first if password provider
      if (isPasswordProvider && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      // Update password
      await updatePassword(user, newPassword);

      // Record update timestamp in firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        passwordLastChanged: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Kata sandi berhasil diubah! Gunakan kata sandi baru untuk login berikutnya.');
    } catch (err: any) {
      console.error('Error changing password:', err);
      setErrorMessage(getIndonesianErrorMessage(err.message || 'Gagal mengubah kata sandi.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate Password Strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: 'Lemah', color: 'bg-rose-500 text-rose-500' };
    if (score <= 3) return { score, label: 'Sedang', color: 'bg-amber-500 text-amber-500' };
    return { score, label: 'Kuat & Aman', color: 'bg-emerald-500 text-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const getRoleBadge = (r?: string, admin?: boolean) => {
    if (admin || r === 'admin') return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400">Super Admin</span>;
    if (r === 'pic_piutang') return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-teal-500/20 border border-teal-500/40 text-teal-400 uppercase">PIC Piutang</span>;
    if (r === 'pic_pendapatan') return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 uppercase">PIC Pendapatan</span>;
    if (r === 'pic_pengeluaran') return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-400 uppercase">PIC Pengeluaran</span>;
    if (r === 'pic_hutang') return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 uppercase">PIC Hutang</span>;
    if (r === 'pic_pajak' || r === 'pic_ppn') return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-orange-500/20 border border-orange-500/40 text-orange-400 uppercase">PIC Pajak & PPN</span>;
    return <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-700/40 border border-slate-600/40 text-slate-300">Viewer Publik</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border ${
        isDark ? 'bg-[#0e141a] border-emerald-950/80 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* MODAL HEADER */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          isDark 
            ? 'bg-gradient-to-r from-[#121a22] to-[#0a1118] border-emerald-950/80' 
            : 'bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isDark 
                ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400' 
                : 'bg-emerald-100 border-emerald-200 text-emerald-800'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Pengaturan Profil Pengguna</h2>
                {getRoleBadge(role, isAdmin)}
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Kelola identitas, foto profil, email, dan kata sandi akun RSUD Jatisari
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-200/70 text-slate-400 hover:text-slate-700'
            }`}
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className={`flex border-b px-4 sm:px-6 overflow-x-auto gap-1 sm:gap-2 shrink-0 ${
          isDark ? 'bg-[#0a0f14] border-emerald-950/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setSuccessMessage(null); setErrorMessage(null); }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'profile'
                ? (isDark ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20' : 'border-emerald-600 text-emerald-800 bg-white')
                : (isDark ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-500 hover:text-slate-900')
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil & Foto</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('email'); setSuccessMessage(null); setErrorMessage(null); }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'email'
                ? (isDark ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20' : 'border-emerald-600 text-emerald-800 bg-white')
                : (isDark ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-500 hover:text-slate-900')
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Ubah Email</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('password'); setSuccessMessage(null); setErrorMessage(null); }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'password'
                ? (isDark ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20' : 'border-emerald-600 text-emerald-800 bg-white')
                : (isDark ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-500 hover:text-slate-900')
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Kata Sandi</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('role_info'); setSuccessMessage(null); setErrorMessage(null); }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'role_info'
                ? (isDark ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20' : 'border-emerald-600 text-emerald-800 bg-white')
                : (isDark ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-500 hover:text-slate-900')
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Hak Akses</span>
          </button>
        </div>

        {/* FEEDBACK BANNERS */}
        <div className="px-6 pt-4 shrink-0">
          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* TAB 1: PROFIL & FOTO */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* SECTION: FOTO PROFIL */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#12181f]/80 border-emerald-950/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-emerald-500">
                  Foto Profil Pengguna
                </label>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Avatar Preview */}
                  <div className="relative group shrink-0">
                    <img
                      src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user.email || 'User')}&background=059669&color=fff&size=200&bold=true`}
                      alt="Avatar Preview"
                      className="w-24 h-24 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-md bg-emerald-900"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                      title="Ubah Foto"
                    >
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">Ganti Foto</span>
                    </button>
                  </div>

                  {/* Actions & Preset */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          isDark 
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Unggah Foto dari Komputer</span>
                      </button>

                      {(photoPreview || photoURL) && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview('');
                            setPhotoURL('');
                            setPhotoFile(null);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isDark ? 'text-rose-400 hover:bg-rose-950/40' : 'text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset Foto</span>
                        </button>
                      )}
                    </div>

                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Format didukung: PNG, JPG, WebP. Foto akan otomatis dioptimasi untuk tampilan avatar SIM-RS.
                    </p>

                    {/* Quick Avatar Presets */}
                    <div className="pt-1">
                      <span className={`text-[11px] font-medium block mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Atau pilih gaya avatar default:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {presetAvatars.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setPhotoPreview(preset.url);
                              setPhotoURL(preset.url);
                              setPhotoFile(null);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
                              photoPreview === preset.url
                                ? (isDark ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300' : 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold')
                                : (isDark ? 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100')
                            }`}
                          >
                            <img src={preset.url} alt={preset.label} className="w-4 h-4 rounded-full" />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: USERNAME / DISPLAY NAME */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500">
                  Username / Nama Lengkap Tampilan
                </label>
                <div className="relative">
                  <User className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: dr. Bambang / Bayu Nugroho / PIC Piutang"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                      isDark 
                        ? 'bg-[#12181f] border-emerald-950/80 text-zinc-100 placeholder-zinc-500' 
                        : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-2xs'
                    }`}
                  />
                </div>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Nama ini akan ditampilkan di navbar, sidebar, riwayat transaksi, serta cetak bukti kwitansi RSUD Jatisari.
                </p>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-900/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Perubahan Profil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: UBAH EMAIL */}
          {activeTab === 'email' && (
            <form onSubmit={handleSaveEmail} className="space-y-5">
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#12181f]/80 border-emerald-950/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Alamat Email Saat Ini
                  </span>
                  <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    user.emailVerified 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>{user.emailVerified ? 'Terverifikasi' : 'Belum Diverifikasi'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  <span>{currentEmail}</span>
                </div>
              </div>

              {isGoogleProvider && (
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs leading-relaxed">
                  <strong>Catatan Akun Google:</strong> Akun ini menggunakan sistem autentikasi Google Workspace. Jika Anda mengubah email, pastikan alamat baru dapat menerima email verifikasi dari Google Firebase.
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500">
                  Alamat Email Baru
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nama.baru@rsudjatisari.id"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                      isDark 
                        ? 'bg-[#12181f] border-emerald-950/80 text-zinc-100 placeholder-zinc-500' 
                        : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-2xs'
                    }`}
                  />
                </div>
              </div>

              {isPasswordProvider && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Kata Sandi Saat Ini (Konfirmasi Keamanan)
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={emailCurrentPassword}
                      onChange={(e) => setEmailCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun saat ini"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                        isDark 
                          ? 'bg-[#12181f] border-emerald-950/80 text-zinc-100 placeholder-zinc-500' 
                          : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-2xs'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !newEmail}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-900/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Kirim Verifikasi / Perbarui Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: KATA SANDI */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-5">
              
              {isGoogleProvider && !isPasswordProvider ? (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-[#12181f]/80 border-emerald-950/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Login Google Authentication Aktif</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    Akun Anda terhubung melalui <strong>Google OAuth (Gmail)</strong>. Kata sandi akun Anda dikelola langsung oleh sistem keamanan Google.
                  </p>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Jika Anda ingin membuat kata sandi mandiri untuk masuk menggunakan form Email & Password tanpa Google, Anda dapat membuat kata sandi di bawah ini:
                  </p>
                </div>
              ) : null}

              {/* Current Password */}
              {isPasswordProvider && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama Anda"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                        isDark 
                          ? 'bg-[#12181f] border-emerald-950/80 text-zinc-100 placeholder-zinc-500' 
                          : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-2xs'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Kata Sandi Baru
                  </label>
                  {newPassword && (
                    <span className={`text-[11px] font-bold ${passwordStrength.color}`}>
                      Kekuatan: {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter kombinasi huruf & angka"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                      isDark 
                        ? 'bg-[#12181f] border-emerald-950/80 text-zinc-100 placeholder-zinc-500' 
                        : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-2xs'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {newPassword && (
                  <div className="w-full bg-zinc-700/40 h-1.5 rounded-full overflow-hidden flex gap-1 mt-1">
                    <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`}></div>
                    <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`}></div>
                    <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`}></div>
                    <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-transparent'}`}></div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500">
                  Ulangi Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className={`absolute left-3.5 top-3 w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru untuk konfirmasi"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                      isDark 
                        ? 'bg-[#12181f] border-emerald-950/80 text-zinc-100 placeholder-zinc-500' 
                        : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-2xs'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-900/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Kata Sandi...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Kata Sandi Baru</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: HAK AKSES & DETAIL AKUN */}
          {activeTab === 'role_info' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border space-y-4 ${
                isDark ? 'bg-[#12181f]/80 border-emerald-950/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700/40">
                  <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Peran & Hak Akses
                  </span>
                  <div>{getRoleBadge(role, isAdmin)}</div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-zinc-700/40">
                  <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    User ID (UID)
                  </span>
                  <code className="text-xs font-mono px-2 py-1 rounded bg-black/30 border border-zinc-700/40 truncate max-w-[200px] sm:max-w-none">
                    {user.uid}
                  </code>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-zinc-700/40">
                  <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Metode Login
                  </span>
                  <span className="text-xs font-medium">
                    {user.providerData.map(p => p.providerId === 'google.com' ? 'Google Workspace' : p.providerId === 'password' ? 'Email & Sandi' : p.providerId).join(', ') || 'Email & Sandi'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-zinc-700/40">
                  <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Terdaftar Sejak
                  </span>
                  <span className="text-xs font-medium">
                    {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Login Terakhir
                  </span>
                  <span className="text-xs font-medium">
                    {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                </div>
              </div>

              {/* Role explanation */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Keterangan Otoritas Sistem</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {isAdmin 
                    ? 'Anda memiliki wewenang Super Admin: Berhak mengakses, mengubah data, mengelola pengguna, dan mengatur seluruh konfigurasi sistem RSUD Jatisari.'
                    : role === 'pic_piutang'
                    ? 'Anda memiliki wewenang PIC Piutang: Berhak menambah, mengubah, mengunggah invoice, dan memvalidasi pembayaran modul Piutang (Perusahaan, Asuransi, Listrik Kantin).'
                    : role === 'pic_pendapatan'
                    ? 'Anda memiliki wewenang PIC Pendapatan: Berhak mengelola entri dan penerimaan pendapatan BLUD.'
                    : role === 'pic_pengeluaran'
                    ? 'Anda memiliki wewenang PIC Pengeluaran: Berhak mengelola realisasi belanja dan pengeluaran BLUD.'
                    : role === 'pic_hutang'
                    ? 'Anda memiliki wewenang PIC Hutang: Berhak mengelola pencatatan invoice dan pelunasan hutang obat, BMHP, dan belanja operasional.'
                    : role === 'pic_pajak' || role === 'pic_ppn'
                    ? 'Anda memiliki wewenang PIC Pajak & PPN: Berhak mengelola monitoring faktur pajak Coretax DJP.'
                    : 'Anda berada dalam mode Viewer: Hanya dapat melihat data rekapitulasi tanpa hak pengeditan.'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#0a0f14] border-emerald-950/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              SIM-RS Terintegrasi Cloud Firestore
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              isDark 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
            }`}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
