import React, { useEffect, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { useSupabaseClient } from "../../lib/supabase";
import { kycErrorMessage, signKycImage } from "../../services/kycService";

export function KycImageViewer({ title, path, ownerId }: { title: string; path?: string; ownerId: string }) {
  const { session } = useSession();
  return <ImageContent key={`${session?.id}:${ownerId}:${path}`} title={title} path={path} ownerId={ownerId} />;
}
function ImageContent({ title, path, ownerId }: { title: string; path?: string; ownerId: string }) {
  const client = useSupabaseClient();
  const [link, setLink] = useState<{ url: string; expiresAt: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!path);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!path) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    setLoading(true); setError(""); setLink(null);
    signKycImage(client, ownerId, path).then(result => {
      if (!active) return;
      setLink(result);
      timer = setTimeout(() => setAttempt(value => value + 1), Math.max(0, result.expiresAt - Date.now()));
    }).catch(err => { if (active) setError(kycErrorMessage(err, "Unable to load image. Please retry.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timer); };
  }, [client, path, ownerId, attempt]);
  return <div className="min-w-0 space-y-3 rounded-xl border border-orbit-border bg-orbit-card p-3">
    <p className="text-xs font-bold text-orbit-white">{title}</p>
    {!path && <p className="text-xs text-orbit-gray-text">Not provided</p>}
    {loading && <p role="status" className="text-xs text-orbit-gray-text">Loading image…</p>}
    {error && <p role="alert" className="text-xs text-orbit-red">{error}</p>}
    {link && <a href={link.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="block text-xs text-orbit-accent"
      onClick={event => { if (Date.now() >= link.expiresAt) { event.preventDefault(); setAttempt(value => value + 1); } }}>
      <img src={link.url} alt={title} referrerPolicy="no-referrer" className="mb-2 h-48 w-full rounded-lg object-contain"
        onError={() => { setLink(null); setError("Image failed to load. Try refreshing the image."); }} />
      Open full-size image
    </a>}
    {path && <button type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)} className="min-h-11 text-xs text-orbit-accent underline disabled:opacity-50">{error ? "Retry image" : "Refresh image"}</button>}
  </div>;
}
