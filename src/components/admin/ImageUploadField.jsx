import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB — same limit as the Settings logo upload

// A small reusable "photo" field: shows the current image (or a placeholder
// circle), a file input styled as a button, and uploads directly to the
// given Supabase Storage bucket on selection — same pattern as the logo
// upload in pages/admin/Settings.jsx, just generalized for reuse across
// Executives, Members, and Branches.
export default function ImageUploadField({ label, bucket, pathPrefix, value, onChange, onError, shape = "circle" }) {
  const [uploading, setUploading] = useState(false);

  async function handleChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      onError("Image must be smaller than 2MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${pathPrefix}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      // Same reasoning as Executives.jsx — log the real Storage/RLS error
      // so a permission problem is distinguishable from a network problem.
      console.error("Image upload failed:", uploadError);
      setUploading(false);
      onError("Image upload failed. Please try again.");
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setUploading(false);
    onChange(data.publicUrl);
  }

  return (
    <div>
      <p className="block text-sm font-medium text-pine-dark mb-1.5">{label}</p>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`h-14 w-14 shrink-0 overflow-hidden bg-pine/10 grid place-items-center text-pine-dark font-display text-sm ${
            shape === "circle" ? "rounded-full" : "rounded-lg"
          }`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
              <path d="M4 16l4.5-6 3 4 2.5-3L20 16M4 6h16v14H4z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <label className="inline-flex items-center rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-pine-dark hover:bg-ink/5 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-education focus-within:ring-offset-2 focus-within:ring-offset-paper">
          {uploading ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleChange}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
