
import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

export type Frequency = 'weekly' | 'monthly' | 'yearly';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (frequency: Frequency, endDate: string) => void;
}

const RecurringTransactionModal: React.FC<RecurringTransactionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    today.setFullYear(today.getFullYear() + 1);
    return today.toISOString().slice(0, 10);
  });

  const handleSave = () => {
    onSave(frequency, endDate);
    onClose();
  };
  
  const inputStyles = "mt-1 block w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-white";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Recurring Transaction">
      <div className="space-y-4">
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-zinc-400">Frequency</label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            className={inputStyles}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-zinc-400">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputStyles}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={handleSave}>Set Recurring</Button>
        </div>
      </div>
    </Modal>
  );
};

export default RecurringTransactionModal;