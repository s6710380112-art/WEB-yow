import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ModerationLog, SiteSettings, UserProfile, UserRole, UserStatus } from '../types';

const SETTINGS_DOC_ID = 'general';

export const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: 'คลังปัญญา - แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษา',
  siteDescription: 'ศูนย์รวมสื่อการเรียนรู้ แหล่งค้นคว้า เอกสารประกอบการสอน วิดีโอ และบทเรียนออนไลน์สำหรับนักเรียน นักศึกษา และครูอาจารย์ไทย',
  announcement: 'ยินดีต้อนรับสู่ คลังปัญญา! ร่วมแบ่งปันเอกสาร สไลด์ หรือวิดีโอเพื่อสนับสนุนการเรียนรู้ของทุกคนได้แล้ววันนี้',
  announcementActive: true,
  categories: [
    'วิทยาศาสตร์',
    'คณิตศาสตร์',
    'คอมพิวเตอร์และเทคโนโลยี',
    'ภาษาไทย',
    'ภาษาต่างประเทศ',
    'สังคมศึกษาและประวัติศาสตร์',
    'สุขศึกษาและพลศึกษา',
    'ศิลปะและดนตรี',
    'การงานอาชีพและการเงิน',
  ],
  gradeLevels: [
    'ประถมศึกษา',
    'มัธยมต้น',
    'มัธยมปลาย',
    'อาชีวศึกษา/ปวช.-ปวส.',
    'มหาวิทยาลัย',
    'บุคคลทั่วไป',
  ],
};

export const subscribeToSiteSettings = (
  callback: (settings: SiteSettings) => void,
  onError?: (error: Error) => void
) => {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as SiteSettings);
      } else {
        // Init default settings
        setDoc(docRef, {
          ...DEFAULT_SETTINGS,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
        callback(DEFAULT_SETTINGS);
      }
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, `settings/${SETTINGS_DOC_ID}`);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
};

export const updateSiteSettings = async (
  settings: Partial<SiteSettings>,
  adminUid: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: adminUid,
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `settings/${SETTINGS_DOC_ID}`);
  }
};

export const subscribeToUsers = (
  callback: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      })) as UserProfile[];
      callback(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, 'users');
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
};

export const updateUserRole = async (
  targetUid: string,
  newRole: UserRole,
  adminUid: string
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', targetUid);
    await updateDoc(userDocRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
    });

    if (newRole === 'admin') {
      await setDoc(doc(db, 'admins', targetUid), {
        role: 'admin',
        addedAt: serverTimestamp(),
      });
    }

    await logModerationAction({
      moderatorId: adminUid,
      moderatorEmail: '',
      action: 'change_role',
      targetId: targetUid,
      targetType: 'user',
      details: `เปลี่ยนบทบาทเป็น ${newRole}`,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
  }
};

export const updateUserStatus = async (
  targetUid: string,
  newStatus: UserStatus,
  adminUid: string
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', targetUid);
    await updateDoc(userDocRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    await logModerationAction({
      moderatorId: adminUid,
      moderatorEmail: '',
      action: newStatus === 'suspended' ? 'suspend_user' : 'activate_user',
      targetId: targetUid,
      targetType: 'user',
      details: `เปลี่ยนสถานะเป็น ${newStatus}`,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
  }
};

export const logModerationAction = async (
  data: Omit<ModerationLog, 'id' | 'timestamp'>
): Promise<void> => {
  try {
    await setDoc(doc(collection(db, 'moderationLogs')), {
      ...data,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Logging moderation failed', err);
  }
};

export const subscribeToModerationLogs = (
  callback: (logs: ModerationLog[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, 'moderationLogs'), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ModerationLog[];
      callback(logs);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, 'moderationLogs');
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
};
