
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import ConfirmationModal from './ui/ConfirmationModal';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils';

interface RecurringSeriesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesId: string | null;
  transactions: Transaction[];
  categories?: Category[];
  onUpdateEndDate: (recurringId: string, newEndDate: string) => void;
  onUpdateSeries: (recurringId: string, updates: Partial<Transaction>) => void;
}

const RecurringSeriesManagerModal: React.FC<RecurringSeriesManagerModalProps> = ({ 
  isOpen, 
  onClose, 
  seriesId, 
  transactions,
  categories = [],
  onUpdateEndDate,
  onUpdateSeries
}) => {
  const [newEndDate, setNewEndDate] = useState('');
  const [editForm, setEditForm] = useState({
      name: '',
      amount: '',
      category_id: ''
  });
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  // Filter transactions for this series
  const seriesTransactions = useMemo(() => {
    if (!seriesId) return [];
    return transactions
      .filter(tx => tx.recurring_id === seriesId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [seriesId, transactions]);

  // Derived Statistics
  const firstTx = seriesTransactions[0];
  const lastTx = seriesTransactions[seriesTransactions.length - 1];
  const upcomingTxs = seriesTransactions.filter(tx => new Date(tx.date) > new Date());
  
  // Set initial state when series opens
  useEffect(() => {
    if (lastTx) {
        setNewEndDate(lastTx.date);
    }
    if (firstTx) {
        setEditForm({
            name: firstTx.name,
            amount: firstTx.amount.toString(),
            category_id: firstTx.category_id || ''
        });
    }
    setIsEditingDetails(false);
    setShowStopConfirm(false);
  }, [seriesId, lastTx, firstTx, isOpen]);

  if (!seriesId || !firstTx) return null;

  const handleStopNowClick = () => {
    setShowStopConfirm(true);
  };

  const handleConfirmStop = () => {
    const today = new Date().toISOString().slice(0, 10);
    onUpdateEndDate(seriesId, today);
    onClose();
  };

  const handleUpdateDate = () => {
    onUpdateEndDate(seriesId, newEndDate);
    onClose();
  };

  const handleSaveDetails = () => {
      onUpdateSeries(seriesId, {
          name: editForm.name,
          amount: parseFloat(editForm.amount),
          category_id: editForm.category_id || null
      });
      setIsEditingDetails(false);
  };

  const inputStyles = "bg-zinc-800 w-full p-2 rounded-md border border-zinc-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-white mt-1";

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage Subscription / Recurring">
        <div className="space-y-6">
          
          {/* Header / Info Card */}
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
              {!isEditingDetails ? (
                  <>
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <h3 className="font-bold text-lg text-white mb-1">{firstTx.name}</h3>
                              <p className="text-zinc-400 text-sm">
                                  {formatCurrency(firstTx.amount)} / period
                              </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setIsEditingDetails(true)}>
                              Edit Details
                          </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                          <div className="bg-zinc-900 p-2 rounded">
                              <span className="block text-zinc-500 text-xs uppercase">Upcoming Items</span>
                              <span className="block text-white font-mono text-lg">{upcomingTxs.length}</span>
                          </div>
                          <div className="bg-zinc-900 p-2 rounded">
                              <span className="block text-zinc-500 text-xs uppercase">Current End Date</span>
                              <span className="block text-white font-mono text-lg">{lastTx.date}</span>
                          </div>
                      </div>
                  </>
              ) : (
                  <div className="space-y-3">
                      <h3 className="text-white font-semibold mb-2">Edit Series Details</h3>
                      <div>
                          <label className="text-xs text-zinc-400">Name</label>
                          <input 
                              value={editForm.name} 
                              onChange={e => setEditForm({...editForm, name: e.target.value})}
                              className={inputStyles}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-zinc-400">Amount (All Future & Past)</label>
                          <input 
                              type="number" 
                              step="0.01"
                              value={editForm.amount} 
                              onChange={e => setEditForm({...editForm, amount: e.target.value})}
                              className={inputStyles}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-zinc-400">Category</label>
                          <select 
                              value={editForm.category_id} 
                              onChange={e => setEditForm({...editForm, category_id: e.target.value})}
                              className={inputStyles}
                          >
                              <option value="">Uncategorized</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                          <Button variant="secondary" size="sm" onClick={() => setIsEditingDetails(false)}>Cancel</Button>
                          <Button size="sm" onClick={handleSaveDetails}>Save Changes</Button>
                      </div>
                  </div>
              )}
          </div>

          {/* Action Area */}
          <div className="border-t border-zinc-800 pt-4 space-y-4">
              <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Update End Date</label>
                  <p className="text-xs text-zinc-500 mb-2">Extend the series or cut it short by picking a new date.</p>
                  <div className="flex gap-2">
                      <input 
                          type="date" 
                          value={newEndDate}
                          onChange={(e) => setNewEndDate(e.target.value)}
                          className="bg-zinc-800 flex-grow p-2 rounded-md border border-zinc-700 focus:ring-sky-500 focus:border-sky-500 text-white" 
                      />
                      <Button onClick={handleUpdateDate} size="sm">Update</Button>
                  </div>
              </div>

              <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink-0 mx-4 text-zinc-600 text-xs uppercase">Or</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              <Button onClick={handleStopNowClick} variant="danger" className="w-full">
                  Stop Subscription (Cancel)
              </Button>
              <p className="text-center text-xs text-zinc-500">
                  Sets the end date to today. Future transactions are removed.
              </p>
          </div>
        </div>
      </Modal>

      <ConfirmationModal 
        isOpen={showStopConfirm}
        onClose={() => setShowStopConfirm(false)}
        onConfirm={handleConfirmStop}
        title="Stop Subscription?"
        message="Are you sure? This will delete all future transactions in this series. Past transactions will remain."
        confirmLabel="Yes, Stop Subscription"
        isDanger={true}
      />
    </>
  );
};

export default RecurringSeriesManagerModal;
