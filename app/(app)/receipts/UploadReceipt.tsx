"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.85));
}

export default function UploadReceipt({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true); setMsg("Uploading…");
    try {
      const supabase = createClient();
      const blob = await shrink(file);
      const type = blob.type || file.type;
      const ext = type === "application/pdf" ? "pdf" : type.split("/")[1] ?? "jpg";
      const path = `${householdId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("receipts").upload(path, blob, { contentType: type });
      if (up.error) throw new Error(up.error.message);
      const { data: row, error } = await supabase.from("receipts").insert({ household_id: householdId, file_path: path }).select("id").single();
      if (error || !row) throw new Error(error?.message ?? "Could not save receipt");
      setMsg("Reading receipt…");
      const res = await fetch("/api/receipts/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ receiptId: row.id }) });
      const body = await res.json();
      setMsg(res.ok ? "Done. Check the details below." : body.error);
      router.refresh();
    } catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  }

  return (
    <div className="card space-y-2">
      <h2 className="font-semibold">Add a receipt</h2>
      <input type="file" accept="image/*,application/pdf" capture="environment" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
      {msg && <p className="text-sm muted">{msg}</p>}
    </div>
  );
}
