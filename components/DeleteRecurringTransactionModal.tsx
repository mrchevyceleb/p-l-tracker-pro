
import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface DeleteRecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteSingle: () => void;
  onDeleteSeries: () => void;
}

const DeleteRecurringTransactionModal: React.FC<DeleteRecurringTransactionModalProps> = ({ 
  isOpen, onClose, onDeleteSingle, onDeleteSeries 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Recurring Transaction">
      <div className="space-y-4">
        <p className="text-zinc-300">This transaction is part of a recurring series. What would you like to delete?</p>
        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={() => { onDeleteSingle(); onClose(); }} variant="secondary" className="w-full">
            Delete Only This Transaction
          </Button>
          <Button onClick={() => { onDeleteSeries(); onClose(); }} variant="danger" className="w-full">
            Delete Entire Series
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteRecurringTransactionModal;
