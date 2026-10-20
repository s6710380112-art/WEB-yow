import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Resource, ResourceType } from '../types';

const COLLECTION_NAME = 'resources';

export const subscribeToResources = (
  callback: (resources: Resource[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Resource[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Resource[];
      callback(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
};

export const fetchResourceById = async (id: string): Promise<Resource | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    // Increment viewCount safely
    try {
      await updateDoc(docRef, {
        viewCount: increment(1),
      });
    } catch (e) {
      // Non-blocking view count update
    }

    return { id: snap.id, ...snap.data() } as Resource;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${id}`);
  }
};

export const createResource = async (
  data: Omit<Resource, 'id' | 'viewCount' | 'favoriteCount' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      viewCount: 0,
      favoriteCount: 0,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateResource = async (
  id: string,
  data: Partial<Resource>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
};

export const deleteResource = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};

// Initial Thai educational seed data if database is fresh
export const seedSampleResourcesIfEmpty = async (authorId: string, authorName: string, authorEmail: string) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return; // Already populated
    }

    const initialSeeds = [
      {
        title: 'สรุปสูตรฟิสิกส์ ม.ปลาย ฉบับกระชับ พร้อมตัวอย่างโจทย์สอบเข้ามหาวิทยาลัย',
        description: 'รวมสูตรฟิสิกส์ กลศาสตร์ คลื่น แสง เสียง ไฟฟ้าสถิต และฟิสิกส์นิวเคลียร์ จัดหมวดหมู่อย่างเป็นระบบ มีคำอธิบายตัวแปร และเทคนิคจำง่าย เหมาะสำหรับนักเรียนชั้น ม.4 - ม.6 ที่กำลังเตรียมตัวสอบ A-Level และ TPAT',
        category: 'วิทยาศาสตร์',
        gradeLevel: 'มัธยมปลาย',
        resourceType: 'pdf' as ResourceType,
        externalUrl: 'https://docs.google.com/viewer?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'สรุปสูตรฟิสิกส์_มปลาย_TCAS.pdf',
        authorId,
        authorName,
        authorEmail,
        status: 'active' as const,
        viewCount: 142,
        favoriteCount: 38,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        title: 'คอร์สปูพื้นฐานการเขียนโปรแกรมด้วยภาษา Python สำหรับผู้เริ่มต้นและนักเรียน',
        description: 'วิดีโอบทเรียนเรียนรู้ Python ตั้งแต่เริ่มต้น: ตัวแปร ชนิดข้อมูล โครงสร้างเงื่อนไข Loop ฟังก์ชัน และการเขียนอัลกอริทึมแก้ปัญหา พร้อมแบบฝึกหัดท้ายบทเรียน',
        category: 'คอมพิวเตอร์และเทคโนโลยี',
        gradeLevel: 'มัธยมต้น',
        resourceType: 'video' as ResourceType,
        externalUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
        authorId,
        authorName,
        authorEmail,
        status: 'active' as const,
        viewCount: 285,
        favoriteCount: 74,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        title: 'สรุปหลักไวยากรณ์ภาษาอังกฤษ Essential English Grammar 12 Tenses เข้าใจง่าย',
        description: 'สรุปโครงสร้างและหลักการใช้ Tense ทั้ง 12 กาล เทคนิคแยก Past, Present, Future พร้อมสัญญาณบอกเวลา (Time markers) และแบบทดสอบความเข้าใจ',
        category: 'ภาษาต่างประเทศ',
        gradeLevel: 'มัธยมปลาย',
        resourceType: 'doc' as ResourceType,
        externalUrl: 'https://en.wikipedia.org/wiki/Grammar',
        authorId,
        authorName,
        authorEmail,
        status: 'active' as const,
        viewCount: 198,
        favoriteCount: 52,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        title: 'ระบบนิเวศและชีววิทยาของพืช: การสังเคราะห์ด้วยแสงและการลำเลียงสาร',
        description: 'บทเรียนชีววิทยาเชิงลึก อธิบายกลไกปฏิกิริยาแสง (Light Reaction) วัฏจักรคัลวิน (Calvin Cycle) และเนื้อเยื่อท่อลำเลียงไซเลม-โฟลเอ็ม พร้อมแผนภาพประกอบชัดเจน',
        category: 'วิทยาศาสตร์',
        gradeLevel: 'มหาวิทยาลัย',
        resourceType: 'pdf' as ResourceType,
        externalUrl: 'https://www.sciencedirect.com',
        fileName: 'ชีววิทยาพืช_Cell_Physiology.pdf',
        authorId,
        authorName,
        authorEmail,
        status: 'active' as const,
        viewCount: 97,
        favoriteCount: 26,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        title: 'คลังโจทย์และเฉลยคณิตศาสตร์: แคลคูลัสเบื้องต้นและการประยุกต์อนุพันธ์',
        description: 'แบบฝึกหัดแคลคูลัส 1 เรื่องลิมิต ความต่อเนื่อง อนุพันธ์ กฎลูกโซ่ และการหาจุดสูงสุดต่ำสุดสัมพัทธ์ พร้อมเฉลยละเอียดทีละขั้นตอน',
        category: 'คณิตศาสตร์',
        gradeLevel: 'อาชีวศึกษา/ปวช.-ปวส.',
        resourceType: 'pdf' as ResourceType,
        externalUrl: 'https://mathworld.wolfram.com',
        fileName: 'โจทย์แคลคูลัส_อนุพันธ์_เฉลย.pdf',
        authorId,
        authorName,
        authorEmail,
        status: 'active' as const,
        viewCount: 164,
        favoriteCount: 45,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        title: 'ประวัติศาสตร์เอเชียตะวันออกเฉียงใต้และการกำเนิดอารยธรรมในลุ่มแม่น้ำเจ้าพระยา',
        description: 'แหล่งข้อมูลและบทความวิชาการเกี่ยวกับเส้นทางการค้าทางทะเล การแลกเปลี่ยนวัฒนธรรม และพัฒนาการของรัฐโบราณในภูมิภาคเอเชียตะวันออกเฉียงใต้',
        category: 'สังคมศึกษาและประวัติศาสตร์',
        gradeLevel: 'บุคคลทั่วไป',
        resourceType: 'website' as ResourceType,
        externalUrl: 'https://www.silpa-mag.com',
        authorId,
        authorName,
        authorEmail,
        status: 'active' as const,
        viewCount: 88,
        favoriteCount: 19,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    ];

    for (const item of initialSeeds) {
      await addDoc(collection(db, COLLECTION_NAME), item);
    }
  } catch (e) {
    console.warn('Initial seeding notice:', e);
  }
};
