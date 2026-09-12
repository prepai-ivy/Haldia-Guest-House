"use client";

import { useState } from "react";
import { Paperclip, X, Loader2 } from "lucide-react";
import { uploadFile, deleteUploadedFile } from "@/services/uploadApi";

export function AttachmentUpload({ blobPath, fileName, onUploaded, onRemove, folder = "booking-attachments" }) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after a remove
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const result = await uploadFile(file, folder);
      onUploaded(result.blobPath, result.fileName);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setRemoving(true);
    try {
      await deleteUploadedFile(blobPath);
    } catch (err) {
      // Don't block clearing the form field over a delete failure — just surface it.
      console.error("[AttachmentUpload] delete failed", err);
    } finally {
      setRemoving(false);
      onRemove();
    }
  }

  if (blobPath) {
    return (
      <div className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-secondary/40">
        <div className="flex items-center gap-2 min-w-0">
          <Paperclip size={16} className="text-muted-foreground shrink-0" />
          <span className="text-sm truncate">{fileName || "Attachment"}</span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="text-muted-foreground hover:text-destructive shrink-0 disabled:opacity-50"
          aria-label="Remove attachment"
        >
          {removing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="flex items-center justify-center gap-2 p-3 border border-dashed rounded-lg cursor-pointer hover:bg-secondary/40 text-sm text-muted-foreground transition-colors">
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Paperclip size={16} /> Attach supporting document (image or PDF, max 5MB)
          </>
        )}
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
