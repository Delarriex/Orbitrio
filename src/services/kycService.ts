import type { KycSubmission, KycStatus } from "../types";

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
