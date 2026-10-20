import React from 'react';
import {
  BookOpen,
  Award,
  Users,
  Lightbulb,
  CheckCircle,
  FileCheck,
  FolderOpen,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Resource } from '../types';

interface SidebarStatsProps {
  resources: Resource[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSeedSample: () => void;
}

export const SidebarStats: React.FC<SidebarStatsProps> = ({
  resources,
  categories,
  selectedCategory,
  onSelectCategory,
  onSeedSample,
}) => {
  // Compute counts per category
  const categoryCounts = categories.map((cat) => ({
    name: cat,
    count: resources.filter((r) => r.category === cat && r.status === 'active').length,
  }));

  const activeResources = resources.filter((r) => r.status === 'active');
  const totalViews = activeResources.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
  const totalFavorites = activeResources.reduce((acc, curr) => acc + (curr.favoriteCount || 0), 0);

  return (
    <div className="space-y-5 text-xs">
      {/* Quick Stats Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" />
          <span>สถิติภาพรวมคลังปัญญา</span>
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100">
            <span className="text-[11px] text-blue-700 font-medium block">สื่อที่เผยแพร่</span>
            <span className="text-xl font-black text-blue-950 mt-0.5 block">
              {activeResources.length}
            </span>
          </div>

          <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-100">
            <span className="text-[11px] text-sky-700 font-medium block">หมวดหมู่วิชา</span>
            <span className="text-xl font-black text-sky-950 mt-0.5 block">
              {categories.length}
            </span>
          </div>

          <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100">
            <span className="text-[11px] text-indigo-700 font-medium block">ยอดเข้าชมสะสม</span>
            <span className="text-xl font-black text-indigo-950 mt-0.5 block">
              {totalViews}
            </span>
          </div>

          <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-100">
            <span className="text-[11px] text-rose-700 font-medium block">รายการโปรด</span>
            <span className="text-xl font-black text-rose-950 mt-0.5 block">
              {totalFavorites}
            </span>
          </div>
        </div>

        {/* Categories List */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-slate-500 font-semibold text-[11px] block mb-2">
            หมวดหมู่วิชายอดนิยม
          </span>
          <div className="space-y-1">
            {categoryCounts.slice(0, 6).map((cat) => (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer text-left ${
                  selectedCategory === cat.name
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate pr-2">{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    selectedCategory === cat.name
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guidelines Card */}
      <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-3xl p-5 border border-blue-100/80 space-y-3">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>แนวทางการแบ่งปัน</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-xs">
          คลังปัญญาเป็นพื้นที่เปิดเพื่อสนับสนุนการเรียนรู้ของทุกคน ร่วมกันสร้างสรรค์สังคมด้วยการ:
        </p>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>ระบุระดับชั้นและหมวดหมู่ให้ตรงกับเนื้อหา</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>ตรวจสอบความถูกต้องของลิงก์และเอกสาร</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>แบ่งปันเฉพาะสื่อที่มีสิทธิ์เผยแพร่เพื่อการศึกษา</span>
          </li>
        </ul>
      </div>

      {/* Seed Demo Data if empty or button */}
      {resources.length === 0 && (
        <div className="bg-white rounded-3xl p-5 border border-dashed border-blue-300 text-center space-y-3">
          <Sparkles className="w-6 h-6 text-blue-600 mx-auto" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">ยังไม่มีสื่อในระบบ</h4>
            <p className="text-slate-500 text-xs mt-0.5">
              คุณสามารถกดปุ่มด้านล่างเพื่อนำเข้าข้อมูลตัวอย่างสื่อการสอนจริงได้ทันที
            </p>
          </div>
          <button
            onClick={onSeedSample}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
          >
            นำเข้าชุดข้อมูลสื่อการเรียนรู้เริ่มต้น
          </button>
        </div>
      )}
    </div>
  );
};
