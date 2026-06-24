import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Config parsed from provisioned Firebase credentials
const firebaseConfig = {
  projectId: "atlantean-marker-g8gvj",
  appId: "1:624560246851:web:800777675448fba47fc4f6",
  apiKey: "AIzaSyAG1Gj8cqEgEZcaZh17jDSfPXECTco5fP4",
  authDomain: "atlantean-marker-g8gvj.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-c5a41e8d-ed3a-4337-a9d3-2b1a6c769373",
  storageBucket: "atlantean-marker-g8gvj.firebasestorage.app",
  messagingSenderId: "624560246851"
};

const app = initializeApp(firebaseConfig);

// Connect specifying the custom database ID from AI Studio
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
export { GoogleAuthProvider };

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
  operationType: OperationType;
  path: string | null;
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
