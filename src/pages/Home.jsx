import React from 'react';
import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import { WEBHID, BLE, LEDGER_LIVE_PATH } from '../ledger-bridge';
import AvailableDevices from '../components/AvailableDevices';
import DeviceSession from '../components/DeviceSession';
import ActionNotificationBox from '../components/ActionNotificationBox';

export default function Home() {
  const { bridge, status, connectedDevice, sessionId } = useLedgerBridge();
  const isConnected = status === 'Connected' && sessionId !== null;

  const handleUSBSelect = () => {
    console.log('USB device selection clicked');
    bridge.updateTransportTypePreference(
      'test-usb', WEBHID, 'messageId'
    );
    bridge.createConnection();
  };

  const handleBLESelect = () => {
    console.log('BLE device selection clicked');
    bridge.updateTransportTypePreference(
      'test-ble', BLE, 'messageId'
    );
    bridge.createConnection();
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-[#1a1a1a]">
    {/* Image placeholder - replace with actual image path */}
    <div className="mb-10 transform hover:scale-105 transition-transform duration-300">
      <img
        src="/ledger-devices.png"
        alt="Ledger Devices"
        className="max-w-md mx-auto drop-shadow-xl"
      />
    </div>

    <h1 className="text-4xl font-bold mb-8 text-center text-white tracking-tight">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">Metamask Ledger Bridge</span>
    </h1>

    <div className="flex flex-col w-full max-w-xl mx-auto mb-6">
      <DeviceSession />
    </div>

    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl mx-auto mb-6">
      <button
        type="button"
        onClick={handleUSBSelect}
        disabled={isConnected}
        className={`flex-1 bg-gradient-to-r ${isConnected ? 'from-gray-500 to-gray-600' : 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white font-medium px-6 py-3 rounded-full transition-all duration-300 w-full text-center sm:max-w-none shadow-lg transform ${isConnected ? '' : 'hover:scale-105'} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        Select a USB device
      </button>

      <button
        type="button"
        onClick={handleBLESelect}
        disabled={isConnected}
        className={`flex-1 bg-gradient-to-r ${isConnected ? 'from-gray-500 to-gray-600' : 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'} text-white font-medium px-6 py-3 rounded-full transition-all duration-300 w-full text-center sm:max-w-none shadow-lg transform ${isConnected ? '' : 'hover:scale-105'} focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        Select a BLE device
      </button>
    </div>

    <div className="flex flex-col w-full max-w-xl mx-auto">
      {isConnected ? (
        <ActionNotificationBox />
      ) : (
        <AvailableDevices />
      )}
    </div>

  </main>
  );
}
