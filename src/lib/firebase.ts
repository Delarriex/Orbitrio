import { initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getFirestore,
  type Firestore,
  doc as firebaseDoc,
  collection as firebaseCollection,
  onSnapshot as firebaseOnSnapshot,
  getDoc as firebaseGetDoc,
  setDoc as firebaseSetDoc,
  updateDoc as firebaseUpdateDoc,
  deleteDoc as firebaseDeleteDoc,
  query as firebaseQuery,
  where as firebaseWhere
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup as firebaseSignInWithPopup,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from "firebase/auth";
import {
  getStorage,
  type FirebaseStorage,
  ref as firebaseStorageRef,
  uploadBytes as firebaseUploadBytes,
  getDownloadURL as firebaseGetDownloadURL
} from "firebase/storage";

const localDev = import.meta.env.VITE_LOCAL_DEV === "true";
const localDbKey = "orbitrio_local_db";
const localAuthKey = "orbitrio_local_auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = localDev ? (undefined as any) : initializeApp(firebaseConfig);

const firestoreDatabaseId = import.meta.env.VITE_FIRESTORE_DATABASE_ID;
export const db: Firestore | any = localDev ? ({} as any) : firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId as string) : getFirestore(app);
export const auth: Auth | any = localDev ? ({} as any) : getAuth(app);
export const storage: FirebaseStorage | any = localDev ? ({} as any) : getStorage(app);
export const googleProvider: GoogleAuthProvider | any = localDev ? ({} as any) : new GoogleAuthProvider();
if (!localDev) {
  googleProvider.setCustomParameters({ prompt: "select_account" });
}

const localListeners: Array<(user: any) => void> = [];

const readLocalStore = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocalStore = (key: string, value: any) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const getLocalDb = () => readLocalStore<Record<string, Record<string, any>>>(localDbKey, {});
const setLocalDb = (data: Record<string, Record<string, any>>) => writeLocalStore(localDbKey, data);
const getLocalAuth = () => readLocalStore<any>(localAuthKey, null);
const notifyLocalAuthListeners = (user: any) => {
  localListeners.forEach((listener) => listener(user));
};
const setLocalAuth = (user: any | null) => {
  writeLocalStore(localAuthKey, user);
  notifyLocalAuthListeners(user);
};

const createLocalDocRef = (collectionName: string, docId: string) => ({ __localDoc: true, collection: collectionName, id: docId, path: `${collectionName}/${docId}` });
const createLocalCollectionRef = (collectionName: string) => ({ __localCollection: true, collection: collectionName });
const createLocalQueryRef = (collectionRef: any, filters: Array<{ field: string; op: string; value: any }>) => ({ ...collectionRef, __localQuery: true, filters });

export const doc = (_db: any, collectionName: string, docId: string) => {
  return localDev ? createLocalDocRef(collectionName, docId) : firebaseDoc(_db, collectionName, docId);
};

export const collection = (_db: any, collectionName: string) => {
  return localDev ? createLocalCollectionRef(collectionName) : firebaseCollection(_db, collectionName);
};

export const where = (field: string, op: string, value: any) => {
  return localDev ? { field, op, value } : firebaseWhere(field, op as any, value);
};

export const query = (collectionRef: any, ...filters: any[]) => {
  return localDev ? createLocalQueryRef(collectionRef, filters) : firebaseQuery(collectionRef, ...filters);
};

const isPlainRecord = (value: any) => {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const sanitizeFirestoreData = (value: any): any => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => item === undefined ? null : sanitizeFirestoreData(item));
  }
  if (isPlainRecord(value)) {
    return Object.entries(value).reduce<Record<string, any>>((acc, [key, item]) => {
      if (item === undefined) return acc;
      acc[key] = sanitizeFirestoreData(item);
      return acc;
    }, {});
  }
  return value;
};

const getRefPath = (ref: any): string | null => {
  if (!ref) return null;
  if (typeof ref.path === "string") return ref.path;
  if (typeof ref._key?.path?.canonicalString === "function") return ref._key.path.canonicalString();
  if (typeof ref._query?.path?.canonicalString === "function") return ref._query.path.canonicalString();
  if (typeof ref._path?.canonicalString === "function") return ref._path.canonicalString();
  if (ref.collection && ref.id) return `${ref.collection}/${ref.id}`;
  if (ref.collection) return ref.collection;
  return null;
};

const getDocIdFromPath = (path: string | null) => {
  if (!path) return null;
  const parts = normalizeFirestorePath(path).split("/").filter(Boolean);
  return parts.length % 2 === 0 ? parts[parts.length - 1] : null;
};

const getCollectionPathFromPath = (path: string | null) => {
  if (!path) return null;
  const parts = normalizeFirestorePath(path).split("/").filter(Boolean);
  if (parts.length % 2 === 0) return parts.slice(0, -1).join("/");
  return parts.join("/");
};

const normalizeFirestorePath = (path: string) => {
  const documentsMarker = "/documents/";
  const documentsIndex = path.indexOf(documentsMarker);
  return documentsIndex === -1 ? path : path.slice(documentsIndex + documentsMarker.length);
};
const createLocalDocSnapshot = (data: any, id: string) => ({
  exists: () => data !== null && data !== undefined,
  data: () => data,
  id,
});

const createLocalCollectionSnapshot = (docs: Array<{ id: string; data: any }>) => ({
  docs: docs.map((doc) => ({ id: doc.id, data: () => doc.data })),
  empty: docs.length === 0,
  forEach: (fn: (doc: any) => void) => docs.forEach((doc) => fn({ id: doc.id, data: () => doc.data })),
});

export const getDoc = async (docRef: any) => {
  if (!localDev) {
    try {
      return await firebaseGetDoc(docRef);
    } catch (error) {
      logFirestoreError(error, OperationType.GET, getRefPath(docRef));
      throw error;
    }
  }
  const dbData = getLocalDb();
  const collectionStore = dbData[docRef.collection] || {};
  const data = collectionStore[docRef.id] ?? null;
  return createLocalDocSnapshot(data, docRef.id);
};

export const setDoc = async (docRef: any, data: any, options?: { merge?: boolean }) => {
  const sanitizedData = sanitizeFirestoreData(data);
  if (!localDev) {
    try {
      return await firebaseSetDoc(docRef, sanitizedData, options);
    } catch (error) {
      logFirestoreError(error, options?.merge ? OperationType.UPDATE : OperationType.CREATE, getRefPath(docRef));
      throw error;
    }
  }
  const dbData = getLocalDb();
  const collectionStore = dbData[docRef.collection] || {};
  const existing = collectionStore[docRef.id] || {};
  collectionStore[docRef.id] = options?.merge ? { ...existing, ...sanitizedData } : sanitizedData;
  dbData[docRef.collection] = collectionStore;
  setLocalDb(dbData);
};

export const updateDoc = async (docRef: any, update: any) => {
  const sanitizedUpdate = sanitizeFirestoreData(update);
  if (!localDev) {
    try {
      return await firebaseUpdateDoc(docRef, sanitizedUpdate);
    } catch (error) {
      logFirestoreError(error, OperationType.UPDATE, getRefPath(docRef));
      throw error;
    }
  }
  const dbData = getLocalDb();
  const collectionStore = dbData[docRef.collection] || {};
  const existing = collectionStore[docRef.id] || {};
  collectionStore[docRef.id] = { ...existing, ...sanitizedUpdate };
  dbData[docRef.collection] = collectionStore;
  setLocalDb(dbData);
};

export const deleteDoc = async (docRef: any) => {
  if (!localDev) {
    try {
      return await firebaseDeleteDoc(docRef);
    } catch (error) {
      logFirestoreError(error, OperationType.DELETE, getRefPath(docRef));
      throw error;
    }
  }
  const dbData = getLocalDb();
  const collectionStore = dbData[docRef.collection] || {};
  delete collectionStore[docRef.id];
  dbData[docRef.collection] = collectionStore;
  setLocalDb(dbData);
};

export const onSnapshot = (ref: any, callback: (snapshot: any) => void, onError?: (error: any) => void) => {
  if (!localDev) {
    return firebaseOnSnapshot(ref, callback, (error) => {
      logFirestoreError(error, getDocIdFromPath(getRefPath(ref)) ? OperationType.GET : OperationType.LIST, getRefPath(ref));
      if (onError) onError(error);
    });
  }
  try {
    const dbData = getLocalDb();
    if (ref.__localCollection || ref.__localQuery) {
      let docs = Object.entries(dbData[ref.collection] || {}).map(([id, data]) => ({ id, data }));
      if (ref.__localQuery && Array.isArray(ref.filters)) {
        docs = docs.filter(({ data }) => ref.filters.every((filter: any) => {
          if (filter.op !== "==") return true;
          return data?.[filter.field] === filter.value;
        }));
      }
      callback(createLocalCollectionSnapshot(docs));
    } else if (ref.__localDoc) {
      const collectionStore = dbData[ref.collection] || {};
      const data = collectionStore[ref.id] ?? null;
      callback(createLocalDocSnapshot(data, ref.id));
    }
  } catch (error) {
    if (onError) onError(error);
  }
  return () => {};
};

export const ref = (storageRef: any, path: string) => {
  return localDev ? { __localStorageRef: true, path } : firebaseStorageRef(storageRef, path);
};

export const uploadBytes = async (storageRef: any, file: File) => {
  if (!localDev) {
    return firebaseUploadBytes(storageRef, file);
  }
  return Promise.resolve({ ref: storageRef });
};

export const getDownloadURL = async (storageRef: any) => {
  if (!localDev) {
    return firebaseGetDownloadURL(storageRef);
  }
  return Promise.resolve(`local://${storageRef.path}`);
};

export const signInWithEmailAndPassword = async (_auth: any, email: string, password: string) => {
  if (!localDev) {
    return firebaseSignInWithEmailAndPassword(_auth, email, password);
  }
  const user = { email, displayName: email.split("@")[0], uid: email, emailVerified: true };
  setLocalAuth(user);
  return { user };
};

export const createUserWithEmailAndPassword = async (_auth: any, email: string, password: string) => {
  if (!localDev) {
    return firebaseCreateUserWithEmailAndPassword(_auth, email, password);
  }
  const user = { email, displayName: email.split("@")[0], uid: email, emailVerified: true };
  setLocalAuth(user);
  return { user };
};

export const signInWithPopup = async (_auth: any, _provider: any) => {
  if (!localDev) {
    return firebaseSignInWithPopup(_auth, _provider);
  }
  const stubUser = { email: "localdev@orbitrio.test", displayName: "Local Dev", uid: "localdev" };
  setLocalAuth(stubUser);
  return { user: stubUser };
};

export const signOut = async (_auth: any) => {
  if (!localDev) {
    return firebaseSignOut(_auth);
  }
  setLocalAuth(null);
};

export const onAuthStateChanged = (_auth: any, callback: (user: any) => void) => {
  if (!localDev) {
    return firebaseOnAuthStateChanged(_auth, callback);
  }
  localListeners.push(callback);
  callback(getLocalAuth());
  return () => {
    const index = localListeners.indexOf(callback);
    if (index !== -1) localListeners.splice(index, 1);
  };
};

export const sendPasswordResetEmail = async (_auth: any, email: string) => {
  if (!localDev) {
    return firebaseSendPasswordResetEmail(_auth, email);
  }
  return Promise.resolve();
};


export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

export interface FirestoreErrorInfo {
  error: string;
  code?: string | null;
  operationType: OperationType;
  path: string | null;
  collectionPath: string | null;
  documentId: string | null;
  currentUserEmail: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const buildFirestoreErrorInfo = (error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo => {
  const currentUserEmail = auth.currentUser?.email || null;
  const errorCode = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : null;
  const normalizedPath = path ? normalizeFirestorePath(path) : null;
  return {
    error: error instanceof Error ? error.message : String(error),
    code: errorCode,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: currentUserEmail,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    },
    operationType,
    path: normalizedPath,
    collectionPath: getCollectionPathFromPath(normalizedPath),
    documentId: getDocIdFromPath(normalizedPath),
    currentUserEmail
  };
};

export const logFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  const label = errInfo.code === "permission-denied"
    ? "Firestore permission-denied:"
    : "Firestore Error:";
  console.error(label, JSON.stringify(errInfo));
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

