import React, { useState, useEffect } from 'react';
import {
  Shield,
  Flag,
  Users,
  Settings,
  History,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Plus,
  Save,
  Search,
  Check,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { ContentReport, ModerationLog, Resource, SiteSettings, UserProfile, UserRole, UserStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToReports,
  updateReportStatus,
} from '../services/reportService';
import {
  subscribeToUsers,
  updateUserRole,
  updateUserStatus,
  subscribeToModerationLogs,
  updateSiteSettings,
  logModerationAction,
} from '../services/adminService';
import { updateResource, deleteResource } from '../services/resourceService';

interface AdminDashboardProps {
  resources: Resource[];
  settings: SiteSettings;
  onSelectResource: (resource: Resource) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  resources,
  settings,
  onSelectResource,
  onNotify,
}) => {
  const { currentUser, isAdmin, isModerator } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'resources' | 'users' | 'settings' | 'logs'>('reports');

  // Reports state
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [reportFilter, setReportFilter] = useState<'pending' | 'resolved' | 'dismissed' | 'all'>('pending');

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Logs state
  const [logs, setLogs] = useState<ModerationLog[]>([]);

  // Settings state (local form)
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [announcementActive, setAnnouncementActive] = useState(settings.announcementActive);
  const [categories, setCategories] = useState<string[]>(settings.categories);
  const [gradeLevels, setGradeLevels] = useState<string[]>(settings.gradeLevels);
  const [newCategory, setNewCategory] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Delete resource confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSiteTitle(settings.siteTitle);
    setSiteDescription(settings.siteDescription);
    setAnnouncement(settings.announcement);
    setAnnouncementActive(settings.announcementActive);
    setCategories(settings.categories || []);
    setGradeLevels(settings.gradeLevels || []);
  }, [settings]);

  // Subscriptions
  useEffect(() => {
    if (!isModerator) return;

    const unsubReports = subscribeToReports((data) => setReports(data));
    const unsubUsers = subscribeToUsers((data) => setUsers(data));
    const unsubLogs = subscribeToModerationLogs((data) => setLogs(data));

    return () => {
      unsubReports();
      unsubUsers();
      unsubLogs();
    };
  }, [isModerator]);

  if (!isModerator) {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="text-xs text-slate-500">
          หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) และผู้ตรวจการ (Moderator) เท่านั้น
        </p>
      </div>
    );
  }

  // Handle report status change
  const handleUpdateReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await updateReportStatus(reportId, status);
      await logModerationAction({
        moderatorId: currentUser?.uid || '',
        moderatorEmail: currentUser?.email || '',
        action: `report_${status}`,
        targetId: reportId,
        targetType: 'resource',
        details: `อัปเดตสถานะรายงานเป็น ${status}`,
      });
      onNotify('success', `อัปเดตสถานะรายงานเรียบร้อยแล้ว (${status})`);
    } catch (e: any) {
      onNotify('error', 'ไม่สามารถอัปเดตสถานะรายงานได้: ' + (e.message || ''));
    }
  };

  // Toggle hide / unhide resource
  const handleToggleResourceStatus = async (resource: Resource) => {
    const newStatus = resource.status === 'active' ? 'hidden' : 'active';
    try {
      await updateResource(resource.id, { status: newStatus });
      await logModerationAction({
        moderatorId: currentUser?.uid || '',
        moderatorEmail: currentUser?.email || '',
        action: newStatus === 'hidden' ? 'hide_resource' : 'unhide_resource',
        targetId: resource.id,
        targetType: 'resource',
        details: `${newStatus === 'hidden' ? 'ซ่อน' : 'เปิดแสดง'} สื่อหัวข้อ: ${resource.title}`,
      });
      onNotify('success', `เปลี่ยนสถานะเป็น ${newStatus === 'hidden' ? 'ซ่อนสื่อแล้ว' : 'แสดงสื่อแล้ว'}`);
    } catch (e: any) {
      onNotify('error', 'เกิดข้อผิดพลาด: ' + (e.message || ''));
    }
  };

  // Confirm delete resource
  const handleConfirmDeleteResource = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteResource(deleteTarget.id);
      await logModerationAction({
        moderatorId: currentUser?.uid || '',
        moderatorEmail: currentUser?.email || '',
        action: 'delete_resource',
        targetId: deleteTarget.id,
        targetType: 'resource',
        details: `ลบสื่อถาวร: ${deleteTarget.title}`,
      });
      onNotify('success', `ลบสื่อ "${deleteTarget.title}" ออกจากระบบเรียบร้อยแล้ว`);
      setDeleteTarget(null);
    } catch (e: any) {
      onNotify('error', 'เกิดข้อผิดพลาดในการลบสื่อ: ' + (e.message || ''));
    } finally {
      setIsDeleting(false);
    }
  };

  // User role change
  const handleChangeUserRole = async (targetUid: string, newRole: UserRole) => {
    if (!isAdmin) {
      onNotify('error', 'เฉพาะผู้ดูแลระบบหลัก (Admin) เท่านั้นที่สามารถเปลี่ยนบทบาทสมาชิกได้');
      return;
    }
    try {
      await updateUserRole(targetUid, newRole, currentUser?.uid || '');
      onNotify('success', `ปรับเปลี่ยนบทบาทสมาชิกเป็น "${newRole}" เรียบร้อยแล้ว`);
    } catch (e: any) {
      onNotify('error', 'ไม่สามารถเปลี่ยนบทบาทได้: ' + (e.message || ''));
    }
  };

  // User suspension toggle
  const handleToggleUserStatus = async (targetUser: UserProfile) => {
    const nextStatus: UserStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(targetUser.uid, nextStatus, currentUser?.uid || '');
      onNotify('success', `${nextStatus === 'suspended' ? 'ระงับบัญชี' : 'ยกเลิกการระงับบัญชี'} สำเร็จ`);
    } catch (e: any) {
      onNotify('error', 'ไม่สามารถปรับสถานะบัญชีได้: ' + (e.message || ''));
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSiteSettings(
        {
          siteTitle: siteTitle.trim(),
          siteDescription: siteDescription.trim(),
          announcement: announcement.trim(),
          announcementActive,
          categories,
          gradeLevels,
        },
        currentUser?.uid || ''
      );
      await logModerationAction({
        moderatorId: currentUser?.uid || '',
        moderatorEmail: currentUser?.email || '',
        action: 'update_settings',
        targetId: 'general',
        targetType: 'settings',
        details: 'บันทึกการตั้งค่าเว็บไซต์และหมวดหมู่ใหม่',
      });
      onNotify('success', 'บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว ข้อมูลมีผลทันที!');
    } catch (e: any) {
      onNotify('error', 'ไม่สามารถบันทึกการตั้งค่าได้: ' + (e.message || ''));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Category additions & removals
  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      onNotify('info', 'มีหมวดหมู่นี้อยู่แล้ว');
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  // Grade level additions & removals
  const handleAddGradeLevel = () => {
    const trimmed = newGradeLevel.trim();
    if (!trimmed) return;
    if (gradeLevels.includes(trimmed)) {
      onNotify('info', 'มีระดับชั้นนี้อยู่แล้ว');
      return;
    }
    setGradeLevels([...gradeLevels, trimmed]);
    setNewGradeLevel('');
  };

  const handleRemoveGradeLevel = (lvl: string) => {
    setGradeLevels(gradeLevels.filter((g) => g !== lvl));
  };

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const filteredReports = reports.filter((r) => {
    if (reportFilter === 'all') return true;
    return r.status === reportFilter;
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-xl bg-blue-500/20 text-blue-300">
                <Shield className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-blue-200 tracking-wider uppercase">
                ระบบจัดการส่วนกลาง (Admin Dashboard)
              </span>
            </div>
            <h1 className="text-2xl font-black">ศูนย์ควบคุมและบริหารจัดการเว็บไซต์</h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-1">
              ตรวจสอบรายงานเนื้อหา จัดการสมาชิก ควบคุมความปลอดภัย และปรับแต่งการตั้งค่าระบบ
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center">
              <div className="text-lg font-bold text-white">{resources.length}</div>
              <div className="text-[11px] text-blue-200">สื่อทั้งหมด</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center">
              <div className="text-lg font-bold text-amber-300">{pendingReportsCount}</div>
              <div className="text-[11px] text-blue-200">รายงานรอตรวจ</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center">
              <div className="text-lg font-bold text-white">{users.length}</div>
              <div className="text-[11px] text-blue-200">สมาชิก</div>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white text-blue-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>รายงานเนื้อหา</span>
            {pendingReportsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-white text-blue-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>สื่อทั้งหมด ({resources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-blue-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>จัดการสมาชิก ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-blue-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>ตั้งค่าเว็บไซต์</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-white text-blue-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติการดูแลระบบ</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Reports Management */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">รายการรายงานปัญหาและเนื้อหาไม่เหมาะสม</h2>
              <p className="text-xs text-slate-500">
                ตรวจสอบข้อร้องเรียนจากสมาชิก เช่น ลิงก์เสีย ละเมิดลิขสิทธิ์ หรือเนื้อหาไม่ตรงตามเกณฑ์
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-xl">
              {(['pending', 'resolved', 'dismissed', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setReportFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    reportFilter === filter
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'pending' && `รอตรวจสอบ (${pendingReportsCount})`}
                  {filter === 'resolved' && 'จัดการแล้ว'}
                  {filter === 'dismissed' && 'ยกเลิกคำขอ'}
                  {filter === 'all' && 'ทั้งหมด'}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">ไม่มีรายการรายงานในสถานะนี้</p>
              <p className="mt-1">ระบบอยู่ในสถานะเรียบร้อยและปลอดภัย</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const targetResource = resources.find((r) => r.id === report.resourceId);

                return (
                  <div
                    key={report.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] ${
                            report.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : report.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {report.status === 'pending' && 'รอตรวจสอบ'}
                          {report.status === 'resolved' && 'แก้ไขแล้ว'}
                          {report.status === 'dismissed' && 'ยกเลิก'}
                        </span>
                        <span className="font-bold text-rose-700">{report.reason}</span>
                      </div>

                      <div className="text-slate-400 text-[11px]">
                        ผู้รายงาน: {report.reporterEmail || report.reporterId}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        <span>สื่อเป้าหมาย: {report.resourceTitle}</span>
                        {targetResource && (
                          <button
                            onClick={() => onSelectResource(targetResource)}
                            className="text-blue-600 hover:text-blue-800 underline text-xs font-normal"
                          >
                            (ดูตัวอย่างสื่อ)
                          </button>
                        )}
                      </div>
                      {report.details && (
                        <p className="mt-1 text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                          {report.details}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {targetResource && (
                          <button
                            onClick={() => handleToggleResourceStatus(targetResource)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                              targetResource.status === 'active'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {targetResource.status === 'active' ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>ซ่อนสื่อทันที</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>ยกเลิกการซ่อนสื่อ</span>
                              </>
                            )}
                          </button>
                        )}

                        {targetResource && (
                          <button
                            onClick={() => setDeleteTarget(targetResource)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-medium transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบสื่อถาวร</span>
                          </button>
                        )}
                      </div>

                      {report.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateReport(report.id, 'dismissed')}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                          >
                            ยกเลิกรายงาน
                          </button>
                          <button
                            onClick={() => handleUpdateReport(report.id, 'resolved')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
                          >
                            ตรวจสอบเสร็จสิ้น
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Resources Management */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">จัดการสื่อทั้งหมดในระบบ</h2>
            <p className="text-xs text-slate-500">
              ควบคุมสถานะสื่อ (Active / Hidden) หรือลบสื่อที่มีปัญหา
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">ชื่อสื่อการสอน</th>
                  <th className="py-3 px-3">หมวดหมู่</th>
                  <th className="py-3 px-3">ผู้โพสต์</th>
                  <th className="py-3 px-3 text-center">สถิติ (เข้าชม/บันทึก)</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                  <th className="py-3 px-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 truncate max-w-[120px]">
                      {item.authorName || item.authorEmail}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500">
                      {item.viewCount || 0} / {item.favoriteCount || 0}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status === 'active' ? 'เผยแพร่' : 'ซ่อนอยู่'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => onSelectResource(item)}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded"
                        title="ดูเนื้อหา"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleToggleResourceStatus(item)}
                        className="p-1 text-slate-500 hover:text-amber-600 rounded"
                        title={item.status === 'active' ? 'ซ่อนสื่อ' : 'เปิดแสดงสื่อ'}
                      >
                        {item.status === 'active' ? (
                          <EyeOff className="w-4 h-4 inline" />
                        ) : (
                          <Eye className="w-4 h-4 inline" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1 text-slate-500 hover:text-rose-600 rounded"
                        title="ลบสื่อถาวร"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">จัดการข้อมูลและสิทธิ์สมาชิก</h2>
              <p className="text-xs text-slate-500">
                ปรับเปลี่ยนบทบาท (สมาชิก / ผู้ตรวจการ / ผู้ดูแลระบบ) และระงับบัญชีผู้ใช้งาน
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อ หรืออีเมล..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">สมาชิก</th>
                  <th className="py-3 px-3">อีเมล</th>
                  <th className="py-3 px-3 text-center">บทบาท (Role)</th>
                  <th className="py-3 px-3 text-center">สถานะบัญชี</th>
                  <th className="py-3 px-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {(u.displayName || u.email || 'U')[0].toUpperCase()}
                      </div>
                      <span>{u.displayName || 'ไม่มีชื่อแสดง'}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-3 text-center">
                      {isAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeUserRole(u.uid, e.target.value as UserRole)}
                          className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="member">สมาชิกทั่วไป</option>
                          <option value="moderator">ผู้ตรวจการ (Moderator)</option>
                          <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status === 'active' ? 'ปกติ' : 'ถูกระงับ'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          u.status === 'active'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {u.status === 'active' ? 'ระงับบัญชี' : 'ปลดระงับ'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Site Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">ตั้งค่าเว็บไซต์ส่วนกลาง (ไม่ต้องแก้โค้ด)</h2>
            <p className="text-xs text-slate-500">
              แก้ไขชื่อเว็บไซต์ คำอธิบาย ข้อความประกาศ และหมวดหมู่ความรู้ บันทึกตรงลง Firestore
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อเว็บไซต์ (Site Title)
                </label>
                <input
                  type="text"
                  required
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำอธิบายเว็บไซต์ (Site Description)
                </label>
                <textarea
                  rows={3}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    ข้อความประกาศแถบด้านบน (Announcement Banner)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementActive}
                      onChange={(e) => setAnnouncementActive(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>เปิดแสดงแถบประกาศ</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="ข้อความประกาศข่าวสาร กิจกรรม หรือการปรับปรุงระบบ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Category Pills Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่วิชาความรู้ (เพิ่ม/ลบได้อิสระ)
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl border border-slate-200 bg-slate-50 min-h-[90px]">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-blue-500 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่ม</span>
                  </button>
                </div>
              </div>

              {/* Grade Levels Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ระดับชั้นการศึกษา
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl border border-slate-200 bg-slate-50 min-h-[80px]">
                  {gradeLevels.map((lvl) => (
                    <span
                      key={lvl}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200 text-slate-800"
                    >
                      <span>{lvl}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGradeLevel(lvl)}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newGradeLevel}
                    onChange={(e) => setNewGradeLevel(e.target.value)}
                    placeholder="พิมพ์ระดับชั้นใหม่..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddGradeLevel}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่ม</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSavingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>บันทึกการตั้งค่าเว็บไซต์</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Moderation Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">ประวัติการดำเนินงานของผู้ดูแลระบบ (Audit Logs)</h2>
            <p className="text-xs text-slate-500">
              เก็บบันทึกการกระทำทุกอย่างเพื่อความโปร่งใสและตรวจสอบได้
            </p>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              ยังไม่มีบันทึกประวัติการดำเนินงาน
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">การกระทำ (Action)</th>
                    <th className="py-3 px-3">เป้าหมาย (Target)</th>
                    <th className="py-3 px-3">รายละเอียด</th>
                    <th className="py-3 px-3">ผู้ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-semibold text-blue-700">{log.action}</td>
                      <td className="py-3 px-3 text-slate-600">{log.targetType}: {log.targetId}</td>
                      <td className="py-3 px-3 font-sans text-slate-800 max-w-xs">{log.details}</td>
                      <td className="py-3 px-3 text-slate-500">{log.moderatorEmail || log.moderatorId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Resource Deletion */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบสื่อถาวร</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบสื่อ "<span className="font-semibold text-slate-800">{deleteTarget.title}</span>"?
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteResource}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>ยืนยันลบสื่อถาวร</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
