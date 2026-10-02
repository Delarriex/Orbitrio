import { useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadDepositProof } from "../services/depositProofService";

export function useDepositProofUpload(client: SupabaseClient, userId?: string) {
  // Preserve completed uploads on save failure, but never across auth changes.
  const uploads = useMemo(() => new Map<File, string>(), [client, userId]);
  return {
    clear: () => uploads.clear(),
    upload: async (file: File) => {
      let path = uploads.get(file);
      if (!path) {
        path = await uploadDepositProof(client, userId || "", file);
        uploads.set(file, path);
      }
      return path;
    }
  };
}
