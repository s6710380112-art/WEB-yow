import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ContentReport, ReportStatus } from '../types';

const COLLECTION_NAME = 'reports';

export const subscribeToReports = (
  callback: (reports: ContentReport[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: ContentReport[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ContentReport[];
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

export const submitReport = async (
  data: Omit<ContentReport, 'id' | 'status' | 'createdAt' | 'resolvedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      status: 'pending' as ReportStatus,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    await updateDoc(docRef, {
      status,
      resolvedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${reportId}`);
  }
};
