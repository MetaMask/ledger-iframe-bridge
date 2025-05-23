import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceStatus } from '@ledgerhq/device-management-kit';
import { useLedgerRedux } from '../hooks/useLedgerRedux';
import { WEBHID } from '../ledger-bridge';

export default function DeviceSession() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { bridge, transportType, connectedDevice, deviceStatus } =
    useLedgerRedux();

  if (!bridge || !connectedDevice) {
    return null;
  }

  // Determine display status
  const getDisplayStatus = () => {
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
  };

  const displayStatus = getDisplayStatus();
  const transportDisplay =
    transportType === WEBHID
      ? t('availableDevices.viaUsb')
      : t('availableDevices.viaBluetooth');

  // Determine status text and color
  const getStatusDisplay = () => {
    if (displayStatus === t('common.busy')) {
      return { text: t('common.busy'), color: 'text-amber-400' };
    } else if (displayStatus === t('common.locked')) {
      return { text: t('common.locked'), color: 'text-yellow-400' };
    } else {
      return {
        text: `${t('buttons.connected')} ${transportDisplay}`,
        color: 'text-green-400',
      };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-[#2d3748] border border-[#4a5568] rounded-lg p-4 flex items-center justify-between hover:bg-[#374151] transition-all duration-200 focus:outline-none"
      >
        <div className="flex flex-col items-start">
          <div className="text-white font-medium text-lg">
            {connectedDevice.name}
          </div>
          <div className={`text-sm ${statusDisplay.color}`}>
            {statusDisplay.text}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 bg-[#2d3748] border border-[#4a5568] rounded-lg p-4">
          <button
            type="button"
            onClick={async () => {
              await bridge.disconnect();
              setIsExpanded(false);
            }}
            className="text-red-400 hover:text-red-300 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#374151] hover:bg-[#4a5568] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {t('buttons.disconnect')}
          </button>
        </div>
      )}
    </div>
  );
}
