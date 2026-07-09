import { db, doc, getDoc, updateDoc } from "../lib/firebase";
import type { KycSubmission, KycStatus } from "../types";

export const KYC_COLLECTION_NAME = "users";

export const KYC_DOCUMENT_TYPES = [
  "Government ID",
  "Passport",
  "Driver\'s License"
] as const;

export const createKycSubmission = (submission: KycSubmission): KycSubmission => {
  const submissionDate = new Date().toISOString();
  const documentType = submission.documentType || submission.idType || "Government ID";

  return {
    ...submission,
    documentType,
    idType: submission.idType || documentType,
    submissionDate,
    status: "pending",
    adminNotes: "",
    rejectionReason: "",
    reviewedAt: undefined
  };
};

export const reviewKycSubmission = (
  current: KycSubmission,
  status: Extract<KycStatus, "approved" | "rejected">,
  adminNotes = ""
): KycSubmission => ({
  ...current,
  status,
  adminNotes,
  rejectionReason: status === "rejected" ? adminNotes : "",
  reviewedAt: new Date().toISOString()
});

export const getKycDocumentPath = (email: string) => `${KYC_COLLECTION_NAME}/${email}`;

export const createSubmission = async (email: string, submission: KycSubmission): Promise<KycSubmission> => {
  const payload = createKycSubmission(submission);
  const userDocRef = doc(db, KYC_COLLECTION_NAME, email);

  console.log("[KYC] firestore write", {
    collection: KYC_COLLECTION_NAME,
    path: getKycDocumentPath(email),
    documentId: email,
    payload
  });

  try {
    await updateDoc(userDocRef, { kyc: payload });
    console.log("[KYC] firestore success", { path: getKycDocumentPath(email) });
    return payload;
  } catch (error) {
    console.log("[KYC] firestore failure", { path: getKycDocumentPath(email), error });
    throw error;
  }
};

export const updateSubmission = async (email: string, submission: KycSubmission): Promise<KycSubmission> => {
  const userDocRef = doc(db, KYC_COLLECTION_NAME, email);

  console.log("[KYC] firestore write", {
    collection: KYC_COLLECTION_NAME,
    path: getKycDocumentPath(email),
    documentId: email,
    payload: submission
  });

  try {
    await updateDoc(userDocRef, { kyc: submission });
    console.log("[KYC] firestore success", { path: getKycDocumentPath(email) });
    return submission;
  } catch (error) {
    console.log("[KYC] firestore failure", { path: getKycDocumentPath(email), error });
    throw error;
  }
};

export const getUserSubmission = async (email: string): Promise<KycSubmission | null> => {
  const userDocRef = doc(db, KYC_COLLECTION_NAME, email);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) return null;
  return (userSnap.data().kyc as KycSubmission | undefined) || null;
};

export const adminReview = async (
  email: string,
  status: Extract<KycStatus, "approved" | "rejected">,
  adminNotes = ""
): Promise<KycSubmission> => {
  const current = await getUserSubmission(email);
  if (!current) {
    throw new Error(`No KYC submission found for ${email}`);
  }

  return updateSubmission(email, reviewKycSubmission(current, status, adminNotes));
};