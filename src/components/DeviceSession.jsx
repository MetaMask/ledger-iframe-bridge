import { useState } from 'react';
import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import {useDeviceSessionState} from '../hooks/useDeviceSessionState';

export default function DeviceSession() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { bridge, transportType, connectedDevice, sessionId } = useLedgerBridge();
  const state = useDeviceSessionState(sessionId);

  if (!bridge || !connectedDevice) {
    return (
      <div className="w-full bg-[#2a2a2a] text-white rounded-lg p-3 flex items-center justify-between group hover:bg-[#333333] transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xl">📱</span>
          <div>
            <div className="font-medium">No selected device</div>
            <div className="text-green-500 text-sm">
              Not Connected • {transportType || 'USB'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-white text-sm mb-2">Device sessions (1)</h2>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-[#2a2a2a] text-white rounded-lg p-3 flex items-center justify-between group hover:bg-[#333333] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📱</span>
          <div>
            <div className="font-medium">{connectedDevice.name}</div>
            <div className="text-green-500 text-sm">
              {state?.deviceStatus} • {transportType}
            </div>
          </div>
        </div>
        <span className={`text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 bg-[#2a2a2a] rounded-lg p-3">
          <button
            type="button"
            onClick={async () => await bridge.disconnect()}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
