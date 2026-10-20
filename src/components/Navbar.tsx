import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  PlusCircle,
  Heart,
  ShieldAlert,
  LogOut,
  User,
  Shield,
  Layers,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeView: 'home' | 'my-resources' | 'favorites' | 'admin';
  onNavigate: (view: 'home' | 'my-resources' | 'favorites' | 'admin') => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onOpenCreate: () => void;
  onOpenProfile: () => void;
  favoriteCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onOpenAuth,
  onOpenCreate,
  onOpenProfile,
  favoriteCount,
}) => {
  const { currentUser, userProfile, isAdmin, isModerator, isSuspended, logout, resendVerification } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResend = async () => {
    try {
      await resendVerification();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Unverified Email Warning Banner */}
      {currentUser && !currentUser.emailVerified && !currentUser.isAnonymous && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-1.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>
              อีเมลของคุณยังไม่ได้รับการยืนยันตัวตน กรุณาตรวจสอบกล่องจดหมาย หรือกดยืนยันใหม่
            </span>
          </div>
          <button
            onClick={handleResend}
            disabled={verificationSent}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline ml-2 cursor-pointer disabled:text-slate-400"
          >
            {verificationSent ? 'ส่งอีเมลยืนยันแล้ว!' : 'ส่งอีเมลยืนยันอีกครั้ง'}
          </button>
        </div>
      )}

      {/* Suspended Alert Banner */}
      {isSuspended && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2 text-xs flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span className="font-medium">
            บัญชีของคุณอยู่ในสถานะ "ระงับการใช้งาน" กรุณาติดต่อผู้ดูแลระบบเพื่อขอข้อมูลเพิ่มเติม
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left group transition cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-blue-700 transition">
                คลังปัญญา
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              แพลตฟอร์มรวบรวมและแบ่งปันความรู้
            </p>
          </div>
        </button>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeView === 'home'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            คลังความรู้ทั้งหมด
          </button>

          {currentUser && (
            <>
              <button
                onClick={() => onNavigate('favorites')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeView === 'favorites'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${activeView === 'favorites' ? 'fill-blue-600 text-blue-600' : 'text-slate-400'}`} />
                <span>รายการโปรด</span>
                {favoriteCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-blue-600 text-white font-bold rounded-full">
                    {favoriteCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onNavigate('my-resources')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeView === 'my-resources'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>สื่อของฉัน</span>
              </button>
            </>
          )}

          {isModerator && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                  : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>แดชบอร์ดผู้ดูแล</span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Post Content Button */}
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth('login');
              } else {
                onOpenCreate();
              }
            }}
            disabled={isSuspended}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">แบ่งปันสื่อความรู้</span>
            <span className="sm:hidden">โพสต์</span>
          </button>

          {/* Auth Section */}
          {!currentUser ? (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>เข้าสู่ระบบ</span>
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-white shadow-xs">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden lg:block text-left pr-1">
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    {userProfile?.role === 'admin' ? (
                      <span className="text-purple-600 font-semibold">ผู้ดูแลระบบ</span>
                    ) : userProfile?.role === 'moderator' ? (
                      <span className="text-indigo-600 font-semibold">ผู้ตรวจการ</span>
                    ) : (
                      <span>สมาชิกทั่วไป</span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {currentUser.displayName || 'ผู้ใช้งาน'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          userProfile?.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : userProfile?.role === 'moderator'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {userProfile?.role === 'admin'
                          ? 'ผู้ดูแลระบบ (Admin)'
                          : userProfile?.role === 'moderator'
                          ? 'ผู้ตรวจการ (Moderator)'
                          : 'สมาชิก (Member)'}
                      </span>
                      {isSuspended && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          ถูกระงับ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>ข้อมูลโปรไฟล์ของฉัน</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate('my-resources');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>สื่อที่ฉันโพสต์แบ่งปัน</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate('favorites');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-slate-400" />
                      <span>รายการที่บันทึกไว้ ({favoriteCount})</span>
                    </button>

                    {isModerator && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-indigo-700 font-medium hover:bg-indigo-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span>ระบบจัดการส่วนกลาง (Admin)</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
