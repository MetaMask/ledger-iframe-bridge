import React from 'react';
import { WEBHID, BLE } from '../ledger-bridge';
import AvailableDevices from '../components/AvailableDevices';
import DeviceSession from '../components/DeviceSession';
import ActionNotificationBox from '../components/ActionNotificationBox';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useLedgerRedux } from '../hooks/useLedgerRedux';

export default function Home() {
  const { t } = useTranslation();
  const { bridge, status, connectedDevice, sessionId } = useLedgerRedux();
  const isConnected = status === 'Connected' && sessionId !== null;

  const handleUSBSelect = () => {
    console.log('USB device selection clicked');
    if (bridge) {
      bridge.updateTransportTypePreference('test-usb', WEBHID, 'messageId');
      bridge.createConnection();
    }
  };

  const handleBLESelect = () => {
    console.log('BLE device selection clicked');
    if (bridge) {
      bridge.updateTransportTypePreference('test-ble', BLE, 'messageId');
      bridge.createConnection();
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#1a1a1a] relative">
      {/* MetaMask Logo - Top Left */}
      <div className="absolute top-6 left-6">
        <img
          src="/metamask.svg"
          alt="MetaMask"
          className="w-24 h-24"
          style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
        />
      </div>

      {/* Language switcher in the top right */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      {/* Help text - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="text-center text-gray-400 text-sm">
          {t('app.helpText')}{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300">
            {t('app.learnMore')}
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        {/* Ledger Devices Image */}
        <div className="mb-4">
          <img
            src="/ledger-devices.png"
            alt="Ledger Devices"
            className="max-w-80 mx-auto"
          />
        </div>

        {/* Connect Ledger Title */}
        <h1 className="text-3xl font-semibold text-white text-center mb-6">
          {t('app.connectLedger')}
        </h1>

        {/* Connect Buttons - Only show when not connected */}
        {!isConnected && (
          <div className="flex gap-3 w-full mb-8">
            <button
              type="button"
              onClick={handleUSBSelect}
              className="flex-1 bg-transparent border-2 border-[#037dd6] text-[#037dd6] font-medium px-6 py-3 rounded-xl hover:bg-[#037dd6] hover:text-white transition-all duration-200 text-sm"
            >
              {t('connectOptions.usb')}
            </button>
            <button
              type="button"
              onClick={handleBLESelect}
              className="flex-1 bg-transparent border-2 border-[#037dd6] text-[#037dd6] font-medium px-6 py-3 rounded-xl hover:bg-[#037dd6] hover:text-white transition-all duration-200 text-sm"
            >
              {t('connectOptions.bluetooth')}
            </button>
          </div>
        )}

        {/* Device Status Section */}
        <div className="w-full">
          {isConnected ? <DeviceSession /> : <AvailableDevices />}
        </div>

        {/* Device Status Details - Only show when connected */}
        {isConnected && <ActionNotificationBox />}
      </div>
    </main>
  );
}
