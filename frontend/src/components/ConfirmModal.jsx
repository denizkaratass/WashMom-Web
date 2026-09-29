import Modal from './Modal.jsx'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Evet',
  cancelText = 'Vazgeç',
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} size="sm">
      <p className="text-ink-soft">{message}</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
          {cancelText}
        </button>
        <button
          type="button"
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Bekle...' : confirmText}
        </button>
      </div>
    </Modal>
  )
}
