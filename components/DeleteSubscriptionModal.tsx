
import React from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface DeleteSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEndSubscription: () => void;
  onDeleteAll: () => void;
  subscriptionName?: string;
}

const DeleteSubscriptionModal: React.FC<DeleteSubscriptionModalProps> = ({
  isOpen, onClose, onEndSubscription, onDeleteAll, subscriptionName
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="End or Delete Subscription">
      <div className="space-y-4">
        <p className="text-zinc-300">
          What would you like to do with <span className="font-semibold text-white">{subscriptionName || 'this subscription'}</span>?
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 space-y-2">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-white">End Subscription</span>
            </div>
            <p className="text-sm text-zinc-400">
              Stop future payments but keep all past transaction history intact for your records.
            </p>
            <Button onClick={() => { onEndSubscription(); onClose(); }} variant="secondary" className="w-full mt-2">
              End Subscription (Keep History)
            </Button>
          </div>

          <div className="p-4 rounded-lg border border-red-900/50 bg-red-950/20 space-y-2">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="font-semibold text-white">Delete All History</span>
            </div>
            <p className="text-sm text-zinc-400">
              Permanently remove all transactions (past and future) associated with this subscription.
            </p>
            <Button onClick={() => { onDeleteAll(); onClose(); }} variant="danger" className="w-full mt-2">
              Delete Everything
            </Button>
          </div>

          <Button onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteSubscriptionModal;
