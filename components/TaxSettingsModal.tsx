
import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { TaxConfig } from '../types';
import { getStandardDeduction } from '../utils/tax';

interface TaxSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TaxConfig;
  onSave: (config: TaxConfig) => void;
}

const TaxSettingsModal: React.FC<TaxSettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<TaxConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const inputStyles = "bg-zinc-800 w-full p-2 rounded-md border border-zinc-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 mt-1 text-white";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tax Settings">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        
        {/* Mode Switcher */}
        <div className="flex items-center gap-4 bg-zinc-800/50 p-2 rounded-lg">
            <button 
                onClick={() => setLocalConfig({...localConfig, mode: 'simple'})}
                className={`flex-1 py-2 rounded-md font-medium transition-all ${localConfig.mode === 'simple' ? 'bg-sky-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
                Simple Mode
            </button>
             <button 
                onClick={() => setLocalConfig({...localConfig, mode: 'smart'})}
                className={`flex-1 py-2 rounded-md font-medium transition-all ${localConfig.mode === 'smart' ? 'bg-sky-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
                Smart Mode
            </button>
        </div>

        {localConfig.mode === 'simple' ? (
             <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-lg font-medium text-zinc-300">
                    Flat Savings Rate ({localConfig.simpleRate}%)
                </label>
                <p className="text-zinc-400 text-sm mb-3">Manually set a percentage of net profit to set aside.</p>
                <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={localConfig.simpleRate}
                    onChange={(e) => setLocalConfig({...localConfig, simpleRate: Number(e.target.value)})}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-4 bg-sky-900/20 border border-sky-900/50 rounded-lg">
                    <p className="text-sm text-sky-200">Smart Mode calculates Self-Employment Tax, Federal Income Tax (2025 brackets), State Tax (PA), and Deductions automatically.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400">Filing Status</label>
                        <select 
                            value={localConfig.filingStatus}
                            onChange={(e) => setLocalConfig({...localConfig, filingStatus: e.target.value as 'single' | 'married_joint'})}
                            className={inputStyles}
                        >
                            <option value="single">Single</option>
                            <option value="married_joint">Married Filing Jointly</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400">Dependents (Children)</label>
                        <input 
                            type="number"
                            min="0"
                            value={localConfig.dependents}
                            onChange={(e) => setLocalConfig({...localConfig, dependents: Math.max(0, parseInt(e.target.value) || 0)})}
                            className={inputStyles}
                        />
                    </div>
                </div>

                {/* Spouse Section (MFJ Only) */}
                {localConfig.filingStatus === 'married_joint' && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-4">
                         <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                             Spouse Income
                         </h4>
                         <div>
                             <label className="block text-sm font-medium text-zinc-400">Spouse W-2 Gross Income (Annual)</label>
                             <input 
                                type="number"
                                min="0"
                                value={localConfig.spouseGrossIncome || 0}
                                onChange={(e) => setLocalConfig({...localConfig, spouseGrossIncome: parseFloat(e.target.value) || 0})}
                                className={inputStyles}
                                placeholder="0.00"
                             />
                         </div>
                          <div>
                             <label className="block text-sm font-medium text-zinc-400">Spouse Federal Tax Withheld (Annual)</label>
                             <input 
                                type="number"
                                min="0"
                                value={localConfig.spouseFederalWithholding || 0}
                                onChange={(e) => setLocalConfig({...localConfig, spouseFederalWithholding: parseFloat(e.target.value) || 0})}
                                className={inputStyles}
                                placeholder="0.00"
                             />
                             <p className="text-xs text-zinc-500 mt-1">Total tax already paid from spouse's paycheck.</p>
                         </div>
                          <div>
                            <div className="flex justify-between">
                                <label className="block text-sm font-medium text-zinc-400">Pretax Deductions (% of Gross)</label>
                                <span className="text-sm font-mono text-white">{localConfig.spousePretaxDeductionPercent || 10}%</span>
                            </div>
                             <input 
                                type="range"
                                min="0"
                                max="20"
                                step="1"
                                value={localConfig.spousePretaxDeductionPercent ?? 10}
                                onChange={(e) => setLocalConfig({...localConfig, spousePretaxDeductionPercent: Number(e.target.value)})}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer mt-2"
                             />
                             <p className="text-xs text-zinc-500 mt-1">Est. deduction for 401k, Health Insurance, HSA (Reduces taxable income).</p>
                         </div>
                    </div>
                )}

                <div className="border-t border-zinc-800 pt-4 mt-4 text-sm text-zinc-400 space-y-2">
                    <div className="flex justify-between">
                        <span>Standard Deduction ({localConfig.filingStatus === 'single' ? 'Single' : 'Joint'}):</span>
                        <span className="text-white font-mono">${getStandardDeduction(localConfig.filingStatus).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Self-Employment Tax Rate:</span>
                        <span className="text-white font-mono">15.3%</span>
                    </div>
                     <div className="flex justify-between">
                        <span>PA State Tax Rate:</span>
                        <span className="text-white font-mono">3.07%</span>
                    </div>
                </div>
            </div>
        )}
        
        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800 mt-6">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </Modal>
  );
};

export default TaxSettingsModal;
