import React from 'react';
import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import { WEBHID, BLE, LEDGER_LIVE_PATH } from '../ledger-bridge';

export default function Home() {
  const { bridge } = useLedgerBridge();

  const handleUSBSelect = () => {
    console.log('USB device selection clicked');
    bridge.updateTransportTypePreference(
      'test-usb',WEBHID, 'messageId'
    );
    bridge.unlock('test-usb-connect', LEDGER_LIVE_PATH, 'messageId');
  };

  const handleBLESelect = () => {
    console.log('BLE device selection clicked');
    bridge.updateTransportTypePreference(
      'test-ble',BLE, 'messageId'
    );
    bridge.unlock('test-ble-connect', LEDGER_LIVE_PATH, 'messageId');
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
    {/* Image placeholder - replace with actual image path */}
    <div className="mb-8">
      <img
        src="/ledger-devices.png"
        alt="Ledger Devices"
        className="max-w-md mx-auto"
      />
    </div>

    <h1 className="text-4xl font-bold mb-4 text-center text-white">
      Metamask Ledger Bridge
    </h1>

    <p className="text-gray-400 mb-8 text-center">
      Use this application to test Ledger hardware device features.
    </p>

    <div className="flex flex-col sm:flex-row gap-4">
      <button
        onClick={handleUSBSelect}
        className="bg-white text-black px-6 py-3 rounded-full hover:bg-gray-200 transition-colors"
      >
        Select a USB device
      </button>

      <button
        onClick={handleBLESelect}
        className="bg-white text-black px-6 py-3 rounded-full hover:bg-gray-200 transition-colors"
      >
        Select a BLE device
      </button>
    </div>

  </main>
  );
}
