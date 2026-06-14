"use client";

export function GoogleLinkButton({
  isAnonymous,
  onLink,
}: {
  isAnonymous: boolean;
  onLink: () => void;
}) {
  if (!isAnonymous) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
        ✓ Progres tersimpan ke akun Google
      </div>
    );
  }
  return (
    <button
      onClick={onLink}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink/30"
    >
      <span className="text-base">🔗</span>
      Masuk dengan Google — simpan progres lintas-device
    </button>
  );
}
