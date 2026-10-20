import React from 'react';
import {
  FileText,
  Video,
  Globe,
  FileCode,
  Eye,
  Heart,
  Share2,
  Flag,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Resource } from '../types';
import { useAuth } from '../context/AuthContext';

interface ResourceCardProps {
  resource: Resource;
  isFavorited: boolean;
  onSelect: (resource: Resource) => void;
  onToggleFavorite: (resource: Resource) => void;
  onOpenReport: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorited,
  onSelect,
  onToggleFavorite,
  onOpenReport,
  onEdit,
  onDelete,
  onNotify,
}) => {
  const { currentUser, isAdmin, isModerator } = useAuth();
  const isAuthor = currentUser?.uid === resource.authorId;
  const canManage = isAuthor || isModerator;

  const getMediaBadge = () => {
    switch (resource.resourceType) {
      case 'pdf':
        return {
          icon: <FileText className="w-3.5 h-3.5" />,
          label: 'PDF / เอกสาร',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          gradient: 'from-rose-500/10 to-orange-500/10',
        };
      case 'video':
        return {
          icon: <Video className="w-3.5 h-3.5" />,
          label: 'วิดีโอบทเรียน',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          gradient: 'from-amber-500/10 to-red-500/10',
        };
      case 'website':
        return {
          icon: <Globe className="w-3.5 h-3.5" />,
          label: 'เว็บไซต์/บทความ',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          gradient: 'from-sky-500/10 to-blue-500/10',
        };
      case 'doc':
      default:
        return {
          icon: <FileCode className="w-3.5 h-3.5" />,
          label: 'สไลด์/แบบฝึกหัด',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          gradient: 'from-emerald-500/10 to-teal-500/10',
        };
    }
  };

  const badge = getMediaBadge();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    onNotify('success', 'คัดลอกลิงก์สื่อการเรียนรู้นี้เรียบร้อยแล้ว');
  };

  return (
    <div
      onClick={() => onSelect(resource)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Top Banner with Type Gradient */}
      <div className={`p-4 bg-gradient-to-br ${badge.gradient} border-b border-slate-100 flex items-start justify-between gap-2`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Media Type Badge */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.bg}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </span>

          {/* Category Pill */}
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {resource.category}
          </span>

          {/* Grade Level Badge */}
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
            {resource.gradeLevel}
          </span>
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(resource);
          }}
          className={`p-2 rounded-xl transition-all ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white shadow-xs'
          }`}
          aria-label={isFavorited ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
        </button>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Status Alert if Hidden */}
          {resource.status === 'hidden' && (
            <div className="mb-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>สื่อนี้ถูกซ่อนโดยผู้ดูแลระบบ</span>
            </div>
          )}

          <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition line-clamp-2 text-base leading-snug">
            {resource.title}
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        </div>

        {/* Card Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
          {/* Author snippet */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
              {(resource.authorName || 'U')[0].toUpperCase()}
            </div>
            <span className="truncate max-w-[100px] text-slate-700 font-medium">
              {resource.authorName || 'สมาชิก'}
            </span>
          </div>

          {/* Counters & Actions */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              <span>{resource.viewCount || 0}</span>
            </span>

            <span className="flex items-center gap-1 text-slate-400">
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'text-rose-500 fill-rose-500' : ''}`} />
              <span>{resource.favoriteCount || 0}</span>
            </span>

            {/* Quick Share */}
            <button
              onClick={handleShare}
              className="p-1 hover:text-blue-600 rounded-md transition"
              title="คัดลอกลิงก์"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Flag Report */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenReport(resource);
              }}
              className="p-1 hover:text-amber-600 rounded-md transition"
              title="รายงานเนื้อหาไม่เหมาะสม"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            {/* Author / Moderator Actions */}
            {canManage && (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(resource);
                    }}
                    className="p-1 hover:text-blue-600 transition"
                    title="แก้ไข"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(resource);
                    }}
                    className="p-1 hover:text-rose-600 transition"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
