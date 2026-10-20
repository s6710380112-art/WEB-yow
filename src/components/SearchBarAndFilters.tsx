import React from 'react';
import { Search, X, SlidersHorizontal, FileText, Video, Globe, FileCode, RotateCcw } from 'lucide-react';
import { ResourceType } from '../types';

interface SearchBarAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedGradeLevel: string;
  onGradeLevelChange: (grade: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  sortBy: 'latest' | 'popular' | 'favorites';
  onSortByChange: (sort: 'latest' | 'popular' | 'favorites') => void;
  categories: string[];
  gradeLevels: string[];
  totalResults: number;
}

export const SearchBarAndFilters: React.FC<SearchBarAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedGradeLevel,
  onGradeLevelChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortByChange,
  categories,
  gradeLevels,
  totalResults,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedGradeLevel !== 'all' ||
    selectedType !== 'all' ||
    sortBy !== 'latest';

  const resetAllFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    onGradeLevelChange('all');
    onTypeChange('all');
    onSortByChange('latest');
  };

  return (
    <div className="space-y-4">
      {/* Hero Search Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-4 text-blue-600 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อสื่อการสอน, หัวข้อบทเรียน, วิชา หรือสาระความรู้..."
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              aria-label="ล้างคำค้นหา"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ทุกหมวดหมู่
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter Dropdowns & Sorters Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Grade Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium hidden sm:inline">ระดับชั้น:</span>
            <select
              value={selectedGradeLevel}
              onChange={(e) => onGradeLevelChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">ทุกระดับชั้น</option>
              {gradeLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium hidden sm:inline">รูปแบบสื่อ:</span>
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">ทุกรูปแบบสื่อ</option>
              <option value="pdf">เอกสาร PDF / สไลด์</option>
              <option value="video">วิดีโอบทเรียน</option>
              <option value="website">เว็บไซต์ / แหล่งค้นคว้า</option>
              <option value="doc">บทความ / เอกสารคำสอน</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium hidden sm:inline">เรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="latest">ล่าสุด</option>
              <option value="popular">ยอดเข้าชมสูงสุด</option>
              <option value="favorites">บันทึกมากที่สุด</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        {/* Counter summary */}
        <div className="text-slate-500 text-[11px] font-medium ml-auto">
          พบ <span className="font-bold text-blue-700">{totalResults}</span> รายการ
        </div>
      </div>
    </div>
  );
};
