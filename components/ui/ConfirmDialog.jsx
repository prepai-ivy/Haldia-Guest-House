export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-card w-full max-w-md rounded-xl border p-6 space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>

        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border text-sm"
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-destructive text-white text-sm"
            disabled={loading}
          >
            {loading ? 'Deleting…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
