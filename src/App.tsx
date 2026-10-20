import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { BannerAnnouncement } from './components/BannerAnnouncement';
import { SearchBarAndFilters } from './components/SearchBarAndFilters';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { ResourceFormModal } from './components/ResourceFormModal';
import { ReportModal } from './components/ReportModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SidebarStats } from './components/SidebarStats';
import { ToastContainer } from './components/Toast';
import {
  subscribeToResources,
  seedSampleResourcesIfEmpty,
  deleteResource,
} from './services/resourceService';
import { subscribeToUserFavorites, toggleFavorite } from './services/favoriteService';
import { subscribeToSiteSettings, DEFAULT_SETTINGS } from './services/adminService';
import { testConnection } from './firebase';
import {
  Resource,
  Favorite,
  SiteSettings,
  NotificationToast,
} from './types';
import {
  BookOpen,
  Sparkles,
  Heart,
  Layers,
  FolderPlus,
  Loader2,
  FolderOpen,
  Info,
  ExternalLink,
  ChevronRight,
  Shield,
} from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, isAdmin, isModerator } = useAuth();

  // Navigation State
  const [activeView, setActiveView] = useState<'home' | 'my-resources' | 'favorites' | 'admin'>('home');

  // Data States
  const [resources, setResources] = useState<Resource[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoadingResources, setIsLoadingResources] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'favorites'>('latest');

  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editTargetResource, setEditTargetResource] = useState<Resource | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [reportResource, setReportResource] = useState<Resource | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Test connection on mount as mandated by skill
  useEffect(() => {
    testConnection();
  }, []);

  // Subscribe to site settings
  useEffect(() => {
    const unsub = subscribeToSiteSettings((s) => setSettings(s));
    return () => unsub();
  }, []);

  // Subscribe to resources
  useEffect(() => {
    setIsLoadingResources(true);
    const unsub = subscribeToResources(
      (items) => {
        setResources(items);
        setIsLoadingResources(false);
      },
      (err) => {
        console.error(err);
        setIsLoadingResources(false);
      }
    );
    return () => unsub();
  }, []);

  // Subscribe to user favorites
  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }
    const unsub = subscribeToUserFavorites(
      currentUser.uid,
      (favs) => setFavorites(favs),
      (err) => console.error(err)
    );
    return () => unsub();
  }, [currentUser]);

  // Seed initial educational resources if collection is empty
  const handleSeedSample = async () => {
    try {
      addToast('info', 'กำลังนำเข้าข้อมูลตัวอย่างสื่อการเรียนรู้...');
      await seedSampleResourcesIfEmpty(
        currentUser?.uid || 'system_seed',
        currentUser?.displayName || 'คณาจารย์คลังปัญญา',
        currentUser?.email || 'admin@knowledgehub.ac.th'
      );
      addToast('success', 'นำเข้าสื่อการเรียนรู้ตัวอย่างเรียบร้อยแล้ว');
    } catch (e: any) {
      addToast('error', 'ไม่สามารถนำเข้าข้อมูลได้: ' + (e.message || ''));
    }
  };

  // Toggle favorite handler
  const handleToggleFavorite = async (resource: Resource) => {
    if (!currentUser) {
      setAuthModalTab('login');
      setAuthModalOpen(true);
      addToast('info', 'กรุณาเข้าสู่ระบบเพื่อบันทึกรายการโปรด');
      return;
    }

    const isFav = favorites.some((f) => f.resourceId === resource.id);
    try {
      const added = await toggleFavorite(currentUser.uid, resource, isFav);
      addToast(
        'success',
        added
          ? `บันทึก "${resource.title}" ในรายการโปรดแล้ว`
          : `ลบออกจากรายการโปรดแล้ว`
      );
    } catch (err: any) {
      addToast('error', 'เกิดข้อผิดพลาดในการบันทึกรายการโปรด: ' + (err.message || ''));
    }
  };

  // Delete resource handler
  const handleDeleteResource = async (resource: Resource) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${resource.title}"?`)) {
      try {
        await deleteResource(resource.id);
        if (selectedResource?.id === resource.id) {
          setSelectedResource(null);
        }
        addToast('success', 'ลบสื่อการเรียนรู้เรียบร้อยแล้ว');
      } catch (err: any) {
        addToast('error', 'ไม่สามารถลบสื่อได้: ' + (err.message || ''));
      }
    }
  };

  // Filtered resources calculation
  const displayedResources = useMemo(() => {
    let list = [...resources];

    // Status filter: guests & regular members only see active resources
    if (activeView === 'home' && !isModerator) {
      list = list.filter((r) => r.status === 'active');
    }

    // View specific filtering
    if (activeView === 'my-resources') {
      if (!currentUser) return [];
      list = list.filter((r) => r.authorId === currentUser.uid);
    } else if (activeView === 'favorites') {
      if (!currentUser) return [];
      const favIds = new Set(favorites.map((f) => f.resourceId));
      list = list.filter((r) => favIds.has(r.id));
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((r) => r.category === selectedCategory);
    }

    // Grade Level filter
    if (selectedGradeLevel !== 'all') {
      list = list.filter((r) => r.gradeLevel === selectedGradeLevel);
    }

    // Resource Type filter
    if (selectedType !== 'all') {
      list = list.filter((r) => r.resourceType === selectedType);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.authorName && r.authorName.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'popular') {
      list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortBy === 'favorites') {
      list.sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0));
    } else {
      // Latest
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    }

    return list;
  }, [
    resources,
    favorites,
    activeView,
    currentUser,
    isModerator,
    selectedCategory,
    selectedGradeLevel,
    selectedType,
    searchQuery,
    sortBy,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif]">
      {/* Navbar */}
      <Navbar
        activeView={activeView}
        onNavigate={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={(tab = 'login') => {
          setAuthModalTab(tab);
          setAuthModalOpen(true);
        }}
        onOpenCreate={() => {
          setEditTargetResource(null);
          setFormModalOpen(true);
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
        favoriteCount={favorites.length}
      />

      {/* Site Announcement Banner */}
      <BannerAnnouncement
        message={settings.announcement}
        isActive={settings.announcementActive}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* View: Admin Dashboard */}
        {activeView === 'admin' ? (
          <AdminDashboard
            resources={resources}
            settings={settings}
            onSelectResource={(r) => setSelectedResource(r)}
            onNotify={addToast}
          />
        ) : (
          <div className="space-y-6">
            {/* Hero / Header per view */}
            {activeView === 'home' && (
              <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-2xl space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-sm border border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    <span>ศูนย์รวมองค์ความรู้เพื่อคนไทย</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                    {settings.siteTitle || 'คลังปัญญา - แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษา'}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-['Sarabun',sans-serif]">
                    {settings.siteDescription ||
                      'ค้นคว้าและร่วมแบ่งปันเอกสาร สไลด์ แบบฝึกหัด วิดีโอ และบทเรียนออนไลน์สำหรับนักเรียน นักศึกษา และครูอาจารย์'}
                  </p>
                </div>
                {/* Decorative background shapes */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none hidden md:block"></div>
                <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
              </div>
            )}

            {activeView === 'my-resources' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                    <Layers className="w-4 h-4" />
                    <span>จัดการสื่อการสอนของฉัน</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">สื่อที่คุณร่วมแบ่งปัน</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    รวมสื่อการเรียนรู้ทั้งหมดที่คุณได้โพสต์ไว้ในระบบ สามารถแก้ไขหรือลบได้ตลอดเวลา
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditTargetResource(null);
                    setFormModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition cursor-pointer self-start sm:self-auto"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>โพสต์สื่อใหม่</span>
                </button>
              </div>
            )}

            {activeView === 'favorites' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 mb-1">
                  <Heart className="w-4 h-4 fill-rose-600" />
                  <span>คลังสื่อที่คุณชื่นชอบ</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">รายการโปรดที่บันทึกไว้</h1>
                <p className="text-xs text-slate-500 mt-1">
                  เข้าถึงสื่อที่คุณบุ๊กมาร์กไว้ได้สะดวกรวดเร็ว ซิงค์ตรงกันทุกอุปกรณ์ผ่านบัญชีของคุณ
                </p>
              </div>
            )}

            {/* Search and Filters Bar */}
            <SearchBarAndFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedGradeLevel={selectedGradeLevel}
              onGradeLevelChange={setSelectedGradeLevel}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              categories={settings.categories || []}
              gradeLevels={settings.gradeLevels || []}
              totalResults={displayedResources.length}
            />

            {/* Layout Grid: Content Cards + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Main Content Column (3 cols) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Loading State */}
                {isLoadingResources ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 animate-pulse"
                      >
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-12 bg-slate-100 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2 pt-2"></div>
                      </div>
                    ))}
                  </div>
                ) : displayedResources.length === 0 ? (
                  /* Empty State */
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <FolderOpen className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">ไม่พบข้อมูลสื่อการเรียนรู้</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                        {activeView === 'favorites'
                          ? 'คุณยังไม่มีรายการโปรดที่บันทึกไว้ ลองกดรูปหัวใจที่สื่อที่สนใจเพื่อบันทึกไว้ดูภายหลัง'
                          : activeView === 'my-resources'
                          ? 'คุณยังไม่ได้โพสต์สื่อการเรียนรู้ กดปุ่ม "แบ่งปันสื่อใหม่" เพื่อเริ่มต้นแบ่งปันผลงาน'
                          : 'ไม่พบเนื้อหาที่ตรงกับเงื่อนไขการค้นหาของคุณ ลองเปลี่ยนคำค้นหรือล้างตัวกรอง'}
                      </p>
                    </div>

                    {activeView === 'home' && resources.length === 0 && (
                      <button
                        onClick={handleSeedSample}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
                      >
                        นำเข้าสื่อการเรียนรู้ตัวอย่าง (6 วิชาหลัก)
                      </button>
                    )}
                  </div>
                ) : (
                  /* Cards Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {displayedResources.map((resource) => {
                      const isFav = favorites.some((f) => f.resourceId === resource.id);

                      return (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          isFavorited={isFav}
                          onSelect={(r) => setSelectedResource(r)}
                          onToggleFavorite={handleToggleFavorite}
                          onOpenReport={(r) => setReportResource(r)}
                          onEdit={
                            currentUser?.uid === resource.authorId || isModerator
                              ? (r) => {
                                  setEditTargetResource(r);
                                  setFormModalOpen(true);
                                }
                              : undefined
                          }
                          onDelete={
                            currentUser?.uid === resource.authorId || isModerator
                              ? handleDeleteResource
                              : undefined
                          }
                          onNotify={addToast}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sidebar Column (1 col) */}
              <div className="lg:col-span-1 space-y-6">
                <SidebarStats
                  resources={resources}
                  categories={settings.categories || []}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => setSelectedCategory(cat)}
                  onSeedSample={handleSeedSample}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 text-sm">คลังปัญญา</span>
            <span className="text-slate-400">|</span>
            <span>แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษาไทย</span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400">
            เชื่อมต่อฐานข้อมูล Google Cloud Firestore & Firebase Auth จริง
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        onNotify={addToast}
      />

      <ResourceFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditTargetResource(null);
        }}
        categories={settings.categories || []}
        gradeLevels={settings.gradeLevels || []}
        editResource={editTargetResource}
        onNotify={addToast}
      />

      <ResourceDetailModal
        resource={selectedResource}
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        isFavorited={
          selectedResource
            ? favorites.some((f) => f.resourceId === selectedResource.id)
            : false
        }
        onToggleFavorite={handleToggleFavorite}
        onOpenReport={(r) => setReportResource(r)}
        onEdit={
          selectedResource &&
          (currentUser?.uid === selectedResource.authorId || isModerator)
            ? (r) => {
                setEditTargetResource(r);
                setFormModalOpen(true);
              }
            : undefined
        }
        onDelete={
          selectedResource &&
          (currentUser?.uid === selectedResource.authorId || isModerator)
            ? handleDeleteResource
            : undefined
        }
        onNotify={addToast}
      />

      <ReportModal
        isOpen={!!reportResource}
        onClose={() => setReportResource(null)}
        resource={reportResource}
        onNotify={addToast}
      />

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onNotify={addToast}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
