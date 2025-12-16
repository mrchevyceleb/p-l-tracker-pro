
import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', isDanger = false 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-zinc-300">{message}</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={() => { onConfirm(); onClose(); }} variant={isDanger ? 'danger' : 'primary'}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
