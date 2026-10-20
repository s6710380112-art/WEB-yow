import React from 'react';
import {
  X,
  Heart,
  Share2,
  Flag,
  FileText,
  Video,
  Globe,
  FileCode,
  Calendar,
  User,
  Eye,
  ExternalLink,
  Download,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Resource } from '../types';
import { useAuth } from '../context/AuthContext';

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorited: boolean;
  onToggleFavorite: (resource: Resource) => void;
  onOpenReport: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  isFavorited,
  onToggleFavorite,
  onOpenReport,
  onEdit,
  onDelete,
  onNotify,
}) => {
  const { currentUser, isModerator } = useAuth();

  if (!isOpen || !resource) return null;

  const isAuthor = currentUser?.uid === resource.authorId;
  const canManage = isAuthor || isModerator;

  // Extract YouTube ID if valid
  const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const youtubeEmbedUrl = getYouTubeEmbedUrl(resource.externalUrl);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    onNotify('success', 'คัดลอกลิงก์เรียบร้อยแล้ว');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Breadcrumb & Navigation Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate pr-4">
            <span className="hover:text-blue-600 cursor-pointer" onClick={onClose}>
              คลังความรู้
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700 truncate">{resource.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 truncate max-w-[200px]">{resource.title}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Header Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800">
                {resource.category}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                {resource.gradeLevel}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                {resource.resourceType === 'pdf' && 'เอกสาร PDF'}
                {resource.resourceType === 'video' && 'วิดีโอบทเรียน'}
                {resource.resourceType === 'website' && 'เว็บไซต์ / แหล่งค้นคว้า'}
                {resource.resourceType === 'doc' && 'สไลด์ / แบบฝึกหัด'}
              </span>
              {resource.status === 'hidden' && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700">
                  สถานะ: ซ่อนจากบุคคลทั่วไป
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {resource.title}
            </h1>

            {/* Author meta & counters */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-slate-100 pb-4 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {(resource.authorName || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{resource.authorName || 'สมาชิกคลังปัญญา'}</div>
                  <div className="text-[11px] text-slate-500">
                    แบ่งปันโดย: {resource.authorEmail || 'สมาชิก'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>เข้าชม {resource.viewCount || 0} ครั้ง</span>
                </span>
                <span className="flex items-center gap-1">
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  <span>บันทึก {resource.favoriteCount || 0} คน</span>
                </span>
              </div>
            </div>
          </div>

          {/* Media Player or File Embed Preview */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-900/5 p-4 sm:p-6 overflow-hidden">
            {youtubeEmbedUrl ? (
              <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md">
                <iframe
                  src={youtubeEmbedUrl}
                  title={resource.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : resource.externalUrl ? (
              <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    {resource.resourceType === 'pdf' ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <Globe className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">แหล่งเรียนรู้ภายนอก</h4>
                    <p className="text-xs text-slate-500 truncate max-w-sm sm:max-w-md">
                      {resource.externalUrl}
                    </p>
                  </div>
                </div>
                <a
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <span>เปิดดูแหล่งเรียนรู้</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : resource.fileUrl ? (
              <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {resource.fileName || 'ไฟล์สื่อการสอนที่แนบมา'}
                    </h4>
                    <p className="text-xs text-slate-500">คลิกปุ่มเพื่อดาวน์โหลดหรือเปิดไฟล์</p>
                  </div>
                </div>
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={resource.fileName || 'resource-file'}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์</span>
                </a>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                ไม่มีไฟล์แนบหรือลิงก์ภายนอกสำหรับสื่อนี้
              </div>
            )}
          </div>

          {/* Description Content */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">รายละเอียดและคำอธิบาย</h3>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-['Sarabun',sans-serif]">
              {resource.description}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Favorite Button */}
              <button
                onClick={() => onToggleFavorite(resource)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isFavorited ? 'บันทึกในรายการโปรดแล้ว' : 'บันทึกเป็นรายการโปรด'}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>แชร์สื่อ</span>
              </button>

              {/* Report */}
              <button
                onClick={() => onOpenReport(resource)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
              >
                <Flag className="w-4 h-4" />
                <span>รายงานปัญหา</span>
              </button>
            </div>

            {/* Manage Buttons */}
            {canManage && (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(resource)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(resource)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบสื่อนี้</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
