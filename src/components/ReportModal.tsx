import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { Resource } from '../types';
import { useAuth } from '../context/AuthContext';
import { submitReport } from '../services/reportService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  resource,
  onNotify,
}) => {
  const { currentUser, isSuspended } = useAuth();
  const [reason, setReason] = useState('ลิงก์เสียหรือไม่สามารถเปิดดูได้');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !resource) return null;

  const reasonsList = [
    'ลิงก์เสียหรือไม่สามารถเปิดดูได้',
    'ละเมิดลิขสิทธิ์ หรือคัดลอกผลงานผู้อื่น',
    'ข้อมูลไม่ถูกต้อง หรือเนื้อหาบิดเบือนความรู้',
    'เนื้อหาไม่เหมาะสม หรือมีถ้อยคำลามกอนาจาร',
    'สแปม โฆษณาสินค้า หรือเนื้อหาไม่ตรงหมวดหมู่',
    'อื่นๆ',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      onNotify('error', 'กรุณาเข้าสู่ระบบก่อนรายงานเนื้อหา');
      return;
    }

    if (isSuspended) {
      onNotify('error', 'บัญชีของคุณถูกระงับ ไม่สามารถรายงานได้');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport({
        resourceId: resource.id,
        resourceTitle: resource.title,
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email || '',
        reason,
        details: details.trim(),
      });
      onNotify('success', 'ส่งรายงานปัญหาเรียบร้อยแล้ว ผู้ดูแลระบบจะเข้าตรวจสอบในลำดับถัดไป');
      onClose();
    } catch (err: any) {
      onNotify('error', 'เกิดข้อผิดพลาดในการส่งรายงาน: ' + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-white/20">
              <Flag className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base">รายงานเนื้อหาไม่เหมาะสม</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <span className="text-slate-500 text-xs">สื่อที่กำลังรายงาน:</span>
            <p className="font-semibold text-slate-800 text-sm truncate mt-0.5">
              {resource.title}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              เหตุผลในการรายงาน <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5">
              {reasonsList.map((item) => (
                <label
                  key={item}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                    reason === item
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={item}
                    checked={reason === item}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำอธิบายเพิ่มเติม (ถ้ามี)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ระบุจุดที่พบปัญหา เช่น ลิงก์ไม่ทำงานที่นาทีที่เท่าไหร่ หรือปัญหาที่พบ..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>ส่งรายงาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
