import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Favorite, Resource } from '../types';

const COLLECTION_NAME = 'favorites';

export const subscribeToUserFavorites = (
  userId: string,
  callback: (favorites: Favorite[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Favorite[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Favorite[];
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

export const toggleFavorite = async (
  userId: string,
  resource: Resource,
  isCurrentlyFavorited: boolean
): Promise<boolean> => {
  const favDocId = `${userId}_${resource.id}`;
  const favDocRef = doc(db, COLLECTION_NAME, favDocId);
  const resourceDocRef = doc(db, 'resources', resource.id);

  try {
    if (isCurrentlyFavorited) {
      await deleteDoc(favDocRef);
      try {
        await updateDoc(resourceDocRef, {
          favoriteCount: increment(-1),
        });
      } catch (e) {
        // Non-blocking counter decrement
      }
      return false;
    } else {
      const newFav: Omit<Favorite, 'id'> = {
        userId,
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourceCategory: resource.category,
        resourceType: resource.resourceType,
        createdAt: serverTimestamp(),
      };
      await setDoc(favDocRef, newFav);
      try {
        await updateDoc(resourceDocRef, {
          favoriteCount: increment(1),
        });
      } catch (e) {
        // Non-blocking counter increment
      }
      return true;
    }
  } catch (err) {
    handleFirestoreError(
      err,
      isCurrentlyFavorited ? OperationType.DELETE : OperationType.CREATE,
      `${COLLECTION_NAME}/${favDocId}`
    );
  }
};
