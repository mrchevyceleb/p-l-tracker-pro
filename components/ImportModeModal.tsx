import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

export type ImportMode = 'standard' | 'bank-statement';

interface ImportModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: ImportMode) => void;
}

const ImportModeModal: React.FC<ImportModeModalProps> = ({ isOpen, onClose, onSelectMode }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Import Format">
      <div className="space-y-4">
        <p className="text-zinc-400">Select the format that matches your file:</p>

        <button
          onClick={() => onSelectMode('standard')}
          className="w-full p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-left transition-colors group"
        >
          <div className="font-semibold text-white group-hover:text-sky-400">Standard CSV</div>
          <div className="text-sm text-zinc-400 mt-1">
            6 columns: Date, Name, Type, Amount, Category, Notes
          </div>
        </button>

        <button
          onClick={() => onSelectMode('bank-statement')}
          className="w-full p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-left transition-colors group"
        >
          <div className="font-semibold text-white group-hover:text-sky-400">Bank Statement</div>
          <div className="text-sm text-zinc-400 mt-1">
            3 columns: Transaction Date, Description, Amount
          </div>
          <div className="text-xs text-sky-400 mt-2">
            Auto-categorizes vendors like GOOGLE, OPENAI, ZOHO, etc.
          </div>
        </button>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportModeModal;
