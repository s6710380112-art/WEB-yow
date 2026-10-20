import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'forgot';
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onNotify,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const { loginWithEmail, loginWithGoogle, registerWithEmail, resetPassword } = useAuth();

  if (!isOpen) return null;

  const getThaiErrorMessage = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'รูปแบบอีเมลไม่ถูกต้อง';
      case 'auth/user-disabled':
        return 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      case 'auth/email-already-in-use':
        return 'อีเมลนี้ได้ลงทะเบียนในระบบแล้ว';
      case 'auth/weak-password':
        return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      case 'auth/popup-closed-by-user':
        return 'หน้าต่างเข้าสู่ระบบด้วย Google ถูกปิดก่อนทำรายการสำเร็จ';
      case 'auth/cancelled-popup-request':
        return 'การเชื่อมต่อถูกยกเลิก';
      default:
        return error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onNotify('error', 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      onNotify('success', 'เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับ!');
      onClose();
    } catch (err: any) {
      onNotify('error', getThaiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !password) {
      onNotify('error', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    if (password.length < 6) {
      onNotify('error', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      onNotify('error', 'รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }
    setIsLoading(true);
    try {
      await registerWithEmail(displayName, email, password);
      onNotify(
        'success',
        'ลงทะเบียนสมาชิกสำเร็จ! ระบบได้ส่งอีเมลยืนยันตัวตนไปยัง ' + email
      );
      onClose();
    } catch (err: any) {
      onNotify('error', getThaiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      onNotify('success', 'เข้าสู่ระบบด้วย Google สำเร็จ');
      onClose();
    } catch (err: any) {
      onNotify('error', getThaiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      onNotify('error', 'กรุณากรอกอีเมลที่ใช้ลงทะเบียน');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email);
      setForgotSent(true);
      onNotify('success', 'ระบบส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว');
    } catch (err: any) {
      onNotify('error', getThaiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-500/30 rounded-lg text-blue-200">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">
              ระบบสมาชิกคลังปัญญา
            </span>
          </div>
          <h2 className="text-xl font-bold">
            {tab === 'login' && 'เข้าสู่ระบบเพื่อใช้งาน'}
            {tab === 'register' && 'สมัครสมาชิกใหม่'}
            {tab === 'forgot' && 'รีเซ็ตรหัสผ่าน'}
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            {tab === 'login' && 'เข้าถึงคลังความรู้ บันทึกรายการโปรด และโพสต์สื่อการสอน'}
            {tab === 'register' && 'สร้างบัญชีสำหรับนักเรียน นักศึกษา และครูอาจารย์'}
            {tab === 'forgot' && 'ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ'}
          </p>

          {/* Tab Selector */}
          {tab !== 'forgot' && (
            <div className="flex bg-blue-950/40 p-1 rounded-xl mt-4 border border-blue-400/20">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-white text-blue-950 shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-white text-blue-950 shadow-sm'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                สมัครสมาชิก
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Google Sign In Button */}
          {tab !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all shadow-sm hover:border-slate-300 active:scale-[0.99] disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                เข้าสู่ระบบด้วย Google
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium">หรือด้วยอีเมล</span>
                </div>
              </div>
            </>
          )}

          {/* Form: Login */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@school.ac.th"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    รหัสผ่าน (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setForgotSent(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label="แสดงหรือซ่อนรหัสผ่าน"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          )}

          {/* Form: Register */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล หรือชื่อแสดง (Display Name)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี หรือ ครูสมศรี"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label="แสดงหรือซ่อนรหัสผ่าน"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยืนยันรหัสผ่านอีกครั้ง
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                เมื่อลงทะเบียน ระบบจะส่งอีเมลยืนยันตัวตน (Email Verification) ไปยังกล่องจดหมายของคุณโดยอัตโนมัติ
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? 'กำลังสร้างบัญชี...' : 'ยืนยันการสมัครสมาชิก'}
              </button>
            </form>
          )}

          {/* Form: Forgot Password */}
          {tab === 'forgot' && (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800">ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    กรุณาตรวจสอบกล่องข้อความหรือโฟลเดอร์ Junk/Spam ที่อีเมล <span className="font-semibold text-slate-900">{email}</span> และคลิกลิงก์เพื่อตั้งรหัสผ่านใหม่
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('login');
                      setForgotSent(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition"
                  >
                    กลับสู่หน้าเข้าสู่ระบบ
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-slate-600">
                    ใส่อีเมลที่คุณใช้ลงทะเบียน เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านใหม่ผ่าน Firebase Password Reset API
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      อีเมลของคุณ
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-60"
                    >
                      {isLoading ? 'กำลังส่งลิงก์...' : 'ส่งลิงก์รีเซ็ต'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
