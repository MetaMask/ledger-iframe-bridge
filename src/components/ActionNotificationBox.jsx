import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ActionNotificationBox() {
  const { t } = useTranslation();
  const { actionState, deviceStatus } = useLedgerBridge();
  
  // Determine status color based on device status
  const getStatusColorClass = () => {
    switch(deviceStatus?.toLowerCase()) {
      case 'connected':
        return 'from-green-400 to-green-600';
      case 'pending':
      case 'loading':
        return 'from-amber-400 to-amber-600';
      case 'disconnected':
      case 'error':
        return 'from-red-400 to-red-600';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  // Determine action icon/style based on action state
  const getActionIndicator = () => {
    switch(actionState?.toLowerCase()) {
      case 'processing':
        return (
          <div className="animate-pulse flex items-center">
            <div className="h-3 w-3 bg-amber-400 rounded-full mr-2" />
            <span className="font-medium">{t('actionStatus.processing')}</span>
          </div>
        );
      case 'approved':
      case 'success':
        return (
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-400 rounded-full mr-2" />
            <span className="font-medium text-green-400">{actionState}</span>
          </div>
        );
      case 'rejected':
      case 'error':
        return (
          <div className="flex items-center">
            <div className="h-3 w-3 bg-red-400 rounded-full mr-2" />
            <span className="font-medium text-red-400">{actionState}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gray-400 rounded-full mr-2" />
            <span className="font-medium">{actionState || t('actionStatus.waiting')}</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-[#222222] rounded-2xl p-6 shadow-lg border border-gray-800 transform transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
          {t('actionStatus.deviceStatus')}
        </h2>
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getStatusColorClass()} text-white text-sm font-medium shadow-inner`}>
          {deviceStatus || t('common.notAvailable')}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
            {t('actionStatus.currentAction')}
          </h2>
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium shadow-inner">
            {actionState || t('actionStatus.waiting')}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
            {t('actionStatus.sessionId')}
          </h2>
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-400 to-indigo-600 text-white text-sm font-medium shadow-inner font-mono">
            {Math.random().toString(36).substring(2, 8)}
          </div>
        </div>
      </div>
    </div>
  );
}