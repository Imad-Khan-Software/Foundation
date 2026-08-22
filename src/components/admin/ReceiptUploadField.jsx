import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB — receipts can be photos or PDFs

// Unlike ImageUploadField, this uploads to a PRIVATE bucket (donation
// receipts or expense receipts), so it never calls getPublicUrl — there is
// no public URL for a private file. It stores the storage *path* only;
// viewing the file later requires generating a short-lived signed URL on
// demand (see the "View receipt" button in Donations.jsx / Expenses.jsx),
// so nobody can access a receipt just by guessing or sharing a link.
export default function ReceiptUploadField({
  value,
  onChange,
  onError,
  bucket = "donation-receipts",
  label = "Receipt / proof (optional)",
}) {
  const [uploading, setUploading] = useState(false);

  async function handleChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isAllowed = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAllowed) {
      onError("Please choose an image or PDF file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      onError("Receipt file must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `receipts/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    setUploading(false);

    if (error) {
      onError("Receipt upload failed. Please try again.");
      return;
    }
    onChange(path);
  }

  return (
    <div>
      <p className="block text-sm font-medium text-pine-dark mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {value && (
          <span className="text-xs text-ink/50 truncate max-w-[10rem]">
            {value.split("/").pop()}
          </span>
        )}
        <label className="inline-flex items-center rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-pine-dark hover:bg-ink/5 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-education focus-within:ring-offset-2 focus-within:ring-offset-paper">
          {uploading ? "Uploading…" : value ? "Replace file" : "Upload file"}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={handleChange}
            disabled={uploading}
          />
        </label>
      </div>
      <p className="mt-1.5 text-xs text-ink/40">
        Private — only admins can view this. Not shown publicly.
      </p>
    </div>
  );
}
