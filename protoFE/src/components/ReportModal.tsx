"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

export function ReportModal({
  open,
  target,
  onClose,
  onSubmit,
}: {
  open: boolean;
  target: "motion" | "ai_response" | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const label =
    target === "motion" ? "mosi hari ini" : "respons AI ini";

  return (
    <Modal open={open} onClose={onClose} title="Laporkan konten">
      <p className="text-sm text-ink/60">
        Kamu melaporkan <strong>{label}</strong>. Laporan membantu menjaga
        keamanan konten.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Alasan (opsional)…"
        className="mt-3 w-full resize-none rounded-xl bg-paper p-3 text-sm outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-brand"
      />
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" full onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="danger"
          full
          onClick={() => {
            onSubmit(reason);
            setReason("");
          }}
        >
          Laporkan
        </Button>
      </div>
    </Modal>
  );
}
