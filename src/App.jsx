import Sidebar from './components/Sidebar';
import { WEBHID, BLE, LEDGER_LIVE_PATH } from './ledger-bridge';
import { LedgerBridgeProvider, useLedgerBridge } from './providers/LedgerBridgeProvider';
import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <LedgerBridgeProvider>
      <MainAppContent />
    </LedgerBridgeProvider>
  );
}

function MainAppContent() {
  const { bridge } = useLedgerBridge();

  const handleUSBSelect = () => {
    console.log('USB device selection clicked');
    console.log(bridge);
    bridge.updateTransportTypePreference(
      'test-usb',WEBHID, 'messageId'
    );
    bridge.unlock('test-usb-connect', LEDGER_LIVE_PATH, 'messageId');
  };

  const handleBLESelect = () => {
    console.log('BLE device selection clicked');
    console.log( bridge);
    bridge.updateTransportTypePreference(
      'test-ble',BLE, 'messageId'
    );
    bridge.unlock('test-ble-connect', LEDGER_LIVE_PATH, 'messageId');
  };

  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      {/* <Sidebar /> */}

      <div className="flex-1 overflow-auto">

        <Outlet />
      </div>
    </div>
  );
}
