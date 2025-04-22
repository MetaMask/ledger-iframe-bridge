import { useState } from 'react';

import useAvailableDevices from '../hooks/useAvailableDevices';
import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import { LEDGER_LIVE_PATH, WEBHID } from '../ledger-bridge';

export default function AvailableDevices() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { bridge, status } = useLedgerBridge();
  const discoveredDevices = useAvailableDevices();
  const noDevice = discoveredDevices.length === 0;

  const handleConnect = async () => {
    try {
      await bridge.unlock('connect', LEDGER_LIVE_PATH , 'messageId');
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  return (
    <div>
      <h2 className="text-white text-sm mb-2 flex items-center gap-2">
        Available devices ({discoveredDevices.length})
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <span className={`inline-block transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </h2>

      {isExpanded && (
        <div className="space-y-2">
          {noDevice ? (
            <div className="bg-[#2a2a2a] rounded-lg p-3 flex items-center justify-between group hover:bg-[#333333] transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">📱</span>
                <div>
                  <div className="text-white font-medium">No device found</div>
                  <div className="text-gray-400 text-sm">Connect your Ledger device to continue</div>
                </div>
              </div>
            </div>
          ) : (
            discoveredDevices.map((device) => (
              <div
                key={device.id}
                className="bg-[#2a2a2a] rounded-lg p-3 flex items-center justify-between group hover:bg-[#333333] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <div className="text-white font-medium">{device.deviceModel.name}</div>
                    <div className="text-gray-400 text-sm">
                      {device.transport === WEBHID ? 'USB' : 'Bluetooth'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={device.connected}
                  className="px-3 py-1 rounded-full bg-[#333333] text-white text-sm hover:bg-[#444444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {device.connected ? 'Connected' : 'Connect'}
                </button>
              </div>
            ))
          )
        }

        </div>
      )}
    </div>
  );
}
