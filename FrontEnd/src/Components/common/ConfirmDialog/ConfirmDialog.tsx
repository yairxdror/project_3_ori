import React from "react";
import "./ConfirmDialog.css";
import Button from "../Button/Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<Props> = ({
  open,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  isBusy = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-card">
        <h3 className="confirm-title">{title}</h3>
        {description && <p className="confirm-desc">{description}</p>}

        <div className="confirm-actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isBusy}>
            {cancelText}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isBusy}>
            {isBusy ? "Deleting..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;