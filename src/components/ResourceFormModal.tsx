import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Link,
  FileText,
  Video,
  Globe,
  FileCode,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Resource, ResourceType } from '../types';
import { useAuth } from '../context/AuthContext';
import { createResource, updateResource } from '../services/resourceService';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  gradeLevels: string[];
  editResource?: Resource | null;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  gradeLevels,
  editResource,
  onNotify,
}) => {
  const { currentUser, userProfile, isSuspended } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'วิทยาศาสตร์');
  const [gradeLevel, setGradeLevel] = useState(gradeLevels[0] || 'มัธยมปลาย');
  const [resourceType, setResourceType] = useState<ResourceType>('pdf');
  const [externalUrl, setExternalUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editResource) {
      setTitle(editResource.title);
      setDescription(editResource.description);
      setCategory(editResource.category);
      setGradeLevel(editResource.gradeLevel);
      setResourceType(editResource.resourceType);
      setExternalUrl(editResource.externalUrl || '');
      setFileUrl(editResource.fileUrl || '');
      setFileName(editResource.fileName || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0] || 'วิทยาศาสตร์');
      setGradeLevel(gradeLevels[0] || 'มัธยมปลาย');
      setResourceType('pdf');
      setExternalUrl('');
      setFileUrl('');
      setFileName('');
      setUploadProgress(null);
    }
  }, [editResource, isOpen, categories, gradeLevels]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      onNotify('error', 'ขนาดไฟล์ต้องไม่เกิน 20MB');
      return;
    }

    setFileName(file.name);
    setUploadProgress(10);

    try {
      // Attempt Firebase Storage upload
      const fileRef = ref(storage, `resources/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        async (error) => {
          console.warn('Storage upload error, using local data URL fallback:', error);
          // Fallback to Base64 reader if storage CORS or permissions need console setup
          const reader = new FileReader();
          reader.onload = () => {
            setFileUrl(reader.result as string);
            setUploadProgress(100);
            onNotify('info', `แนบไฟล์ ${file.name} เรียบร้อยแล้ว`);
          };
          reader.readAsDataURL(file);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setFileUrl(downloadUrl);
          setUploadProgress(100);
          onNotify('success', `อัปโหลดไฟล์ ${file.name} สำเร็จ!`);
        }
      );
    } catch (err) {
      // FileReader fallback
      const reader = new FileReader();
      reader.onload = () => {
        setFileUrl(reader.result as string);
        setUploadProgress(100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuspended) {
      onNotify('error', 'บัญชีของคุณถูกระงับ ไม่สามารถโพสต์สื่อได้');
      return;
    }

    if (!currentUser) {
      onNotify('error', 'กรุณาเข้าสู่ระบบก่อนทำการโพสต์');
      return;
    }

    if (title.trim().length < 3) {
      onNotify('error', 'ชื่อสื่อความรู้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (description.trim().length < 10) {
      onNotify('error', 'คำอธิบายต้องมีความยาวอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editResource) {
        await updateResource(editResource.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          gradeLevel,
          resourceType,
          externalUrl: externalUrl.trim() || undefined,
          fileUrl: fileUrl || undefined,
          fileName: fileName || undefined,
        });
        onNotify('success', 'แก้ไขข้อมูลสื่อการเรียนรู้สำเร็จ!');
      } else {
        await createResource({
          title: title.trim(),
          description: description.trim(),
          category,
          gradeLevel,
          resourceType,
          externalUrl: externalUrl.trim() || undefined,
          fileUrl: fileUrl || undefined,
          fileName: fileName || undefined,
          authorId: currentUser.uid,
          authorName: currentUser.displayName || userProfile?.displayName || 'สมาชิกคลังปัญญา',
          authorEmail: currentUser.email || '',
          status: 'active',
        });
        onNotify('success', 'แบ่งปันสื่อการเรียนรู้ใหม่สำเร็จแล้ว ขอบคุณที่ร่วมสร้างสรรค์สังคมแห่งการเรียนรู้!');
      }
      onClose();
    } catch (err: any) {
      onNotify('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-800 to-indigo-800 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {editResource ? 'แก้ไขสื่อการเรียนรู้' : 'แบ่งปันสื่อการเรียนรู้ใหม่'}
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">
              แบ่งปันเอกสาร สไลด์ หรือวิดีโอเพื่อสนับสนุนการศึกษาของนักเรียนไทย
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อสื่อการสอน / หัวข้อความรู้ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรคณิตศาสตร์ ม.ปลาย หรือ เทคนิคการเขียนโปรแกรม Python"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
          </div>

          {/* Category & Grade Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมวดหมู่วิชา <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระดับชั้นการศึกษา <span className="text-rose-500">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              >
                {gradeLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resource Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รูปแบบสื่อการสอน <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setResourceType('pdf')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  resourceType === 'pdf'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span className="text-xs">PDF / สไลด์</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceType('video')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  resourceType === 'video'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Video className="w-4 h-4 text-amber-600" />
                <span className="text-xs">วิดีโอบทเรียน</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceType('website')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  resourceType === 'website'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Globe className="w-4 h-4 text-sky-600" />
                <span className="text-xs">เว็บไซต์ค้นคว้า</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceType('doc')}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  resourceType === 'doc'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <FileCode className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">เอกสาร/แบบฝึกหัด</span>
              </button>
            </div>
          </div>

          {/* External URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              แนบลิงก์ภายนอก (YouTube, Google Drive, เว็บไซต์แหล่งข้อมูล)
            </label>
            <div className="relative">
              <Link className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... หรือ https://drive.google.com/..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* File Upload Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หรืออัปโหลดไฟล์สื่อการสอน (PDF, รูปภาพ, สไลด์ ไม่เกิน 20MB)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center transition bg-slate-50/50">
              {fileName ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="text-left truncate">
                      <p className="text-xs font-medium text-slate-800 truncate">{fileName}</p>
                      {uploadProgress !== null && uploadProgress < 100 && (
                        <p className="text-[10px] text-blue-600">กำลังอัปโหลด {uploadProgress}%</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName('');
                      setFileUrl('');
                      setUploadProgress(null);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block space-y-1.5">
                  <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                  <p className="text-xs font-medium text-slate-700">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-[11px] text-slate-400">
                    รองรับไฟล์ PDF, Word, PPT, รูปภาพ
                  </p>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำอธิบายรายละเอียดและสาระสำคัญ <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              minLength={10}
              maxLength={4000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายหัวข้อที่ครอบคลุม วัตถุประสงค์การเรียนรู้ หรือคำแนะนำการใช้งานสื่อนี้..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition leading-relaxed font-['Sarabun',sans-serif]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editResource ? 'บันทึกการแก้ไข' : 'เผยแพร่สื่อความรู้'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
