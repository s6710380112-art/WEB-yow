import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, CheckCircle2, AlertTriangle, Save, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const { currentUser, userProfile, updateUserProfileData, resendVerification } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
    } else if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [userProfile, currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      onNotify('error', 'กรุณาระบุชื่อแสดง');
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfileData({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      onNotify('success', 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
      onClose();
    } catch (e: any) {
      onNotify('error', 'เกิดข้อผิดพลาดในการบันทึกโปรไฟล์: ' + (e.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification();
      setVerifySent(true);
      onNotify('success', 'ส่งลิงก์ยืนยันตัวตนไปยังอีเมลของคุณแล้ว');
    } catch (e: any) {
      onNotify('error', 'ไม่สามารถส่งอีเมลได้: ' + (e.message || ''));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-blue-500/20 text-blue-200">
              <User className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base">โปรไฟล์ผู้ใช้งาน</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Avatar & Role Badge */}
          <div className="flex items-center gap-3.5 pb-2 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
              {(displayName || currentUser.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{displayName || 'ผู้ใช้งาน'}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    userProfile?.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {userProfile?.status === 'active' ? 'สถานะ: ปกติ' : 'สถานะ: ถูกระงับ'}
                </span>
              </div>
            </div>
          </div>

          {/* Email & Verification status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อีเมลบัญชีผู้ใช้
            </label>
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
              <span className="font-mono text-xs">{currentUser.email}</span>
              {currentUser.emailVerified ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ยืนยันแล้ว</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={verifySent}
                  className="text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  {verifySent ? 'ส่งลิงก์แล้ว' : 'ส่งอีเมลยืนยัน'}
                </button>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อแสดง (Display Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ชื่อ-นามสกุล หรือนามแฝงสำหรับแสดงบนสื่อ"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Bio / School */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ข้อมูลประวัติย่อ / สถาบันการศึกษา / วิชาที่สนใจ
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="เช่น คุณครูกลุ่มสาระการเรียนรู้วิทยาศาสตร์ หรือ นักเรียนชั้น ม.6 แผนการเรียนวิทย์-คณิต"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-['Sarabun',sans-serif]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium"
            >
              ปิด
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
