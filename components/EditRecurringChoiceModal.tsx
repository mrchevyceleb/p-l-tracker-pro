import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface EditRecurringChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSingle: () => void;
  onEditSeries: () => void;
}

const EditRecurringChoiceModal: React.FC<EditRecurringChoiceModalProps> = ({ isOpen, onClose, onEditSingle, onEditSeries }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Recurring Transaction">
      <div className="space-y-4">
        <p className="text-zinc-300">This is a recurring transaction. How would you like to apply your changes?</p>
        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={onEditSingle} variant="primary" className="w-full">
            Edit This Transaction Only
          </Button>
          <Button onClick={onEditSeries} variant="secondary" className="w-full">
            Edit The Entire Series
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditRecurringChoiceModal;
