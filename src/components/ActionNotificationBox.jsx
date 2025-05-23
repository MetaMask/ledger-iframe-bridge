import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceStatus } from '@ledgerhq/device-management-kit';
import { useLedgerRedux } from '../hooks/useLedgerRedux';

export default function ActionNotificationBox() {
  const { t } = useTranslation();
  const { actionState, deviceStatus, sessionId } = useLedgerRedux();

  // Map device status from DMK to display status
  const getDisplayStatus = useCallback(() => {
    // Map DMK device status to display status
    switch (deviceStatus) {
      case DeviceStatus.CONNECTED:
        return t('buttons.connected');
      case DeviceStatus.LOCKED:
        return t('common.locked');
      case DeviceStatus.NOT_CONNECTED:
        return t('common.disconnected');
      default:
        return t('buttons.connected');
    }
  }, [deviceStatus, t]);

  // Determine status color based on display status
  const getStatusColor = useCallback(
    (status) => {
      const busyText = t('common.busy');
      const connectedText = t('buttons.connected');
      const disconnectedText = t('common.disconnected');
      const lockedText = t('common.locked');

      if (status === connectedText) {
        return 'text-green-400';
      } else if (status === busyText) {
        return 'text-amber-400';
      } else if (status === lockedText) {
        return 'text-yellow-400';
      } else if (status === disconnectedText || status === t('common.error')) {
        return 'text-red-400';
      } else {
        return 'text-gray-400';
      }
    },
    [t],
  );

  // Format action state for display
  const getDisplayAction = useCallback(() => {
    if (!actionState || actionState === 'none' || actionState === 'None') {
      return t('actions.none');
    }

    // Map specific action states to translation keys
    switch (actionState) {
      case 'sign Transaction':
        return t('actions.signTransaction');
      case 'sign Typed Data':
        return t('actions.signTypedData');
      case 'sign Personal Message':
        return t('actions.signPersonalMessage');
      default:
        // Capitalize first letter and format for unmapped actions
        return actionState.charAt(0).toUpperCase() + actionState.slice(1);
    }
  }, [actionState, t]);

  const currentDeviceStatus = getDisplayStatus();
  const currentAction = getDisplayAction();
  const displaySessionId = sessionId || 'aaqytb';

  return (
    <div className="w-full space-y-4">
      {/* Device Status */}
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-medium">
          {t('actionStatus.deviceStatus')}
        </span>
        <span
          className={`text-sm font-medium ${getStatusColor(
            currentDeviceStatus,
          )}`}
        >
          {currentDeviceStatus}
        </span>
      </div>

      {/* Current Action */}
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-medium">
          {t('actionStatus.currentAction')}
        </span>
        <span className="text-gray-400 text-sm">{currentAction}</span>
      </div>

      {/* Session ID */}
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-medium">
          {t('actionStatus.sessionId')}
        </span>
        <span className="text-gray-400 text-sm font-mono">
          {displaySessionId}
        </span>
      </div>
    </div>
  );
}
