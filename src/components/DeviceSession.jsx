import { useState } from 'react';
import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import {useDeviceSessionState} from '../hooks/useDeviceSessionState';

export default function DeviceSession() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { bridge, transportType, connectedDevice, sessionId } = useLedgerBridge();
  const state = useDeviceSessionState(sessionId);

  if (!bridge || !connectedDevice) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="w-full bg-gradient-to-r from-[#2a2a2a] to-[#232323] text-white rounded-xl p-4 flex items-center justify-between group hover:bg-[#333333] transition-all duration-300 shadow-lg border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="bg-[#333] p-3 rounded-full flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <div>
              <div className="font-medium text-lg">No selected device</div>
              <div className="text-green-500 text-sm font-medium">
                Not Connected • {transportType || 'USB'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-white text-sm font-medium mb-3 px-1">Device sessions (1)</h2>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-[#2a2a2a] to-[#232323] text-white rounded-xl p-4 flex items-center justify-between group hover:bg-[#333333] transition-all duration-300 shadow-lg border border-gray-800 focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className="bg-[#333] p-3 rounded-full flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <div className="text-left">
            <div className="font-medium text-lg">{connectedDevice.name}</div>
            <div className="text-green-500 text-sm font-medium">
              {state?.deviceStatus} • {transportType}
            </div>
          </div>
        </div>
        <span className={`text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''} bg-[#333] h-8 w-8 rounded-full flex items-center justify-center`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 bg-[#2a2a2a] rounded-xl p-4 shadow-lg border border-gray-800 animate-fadeIn">
          <button
            type="button"
            onClick={async () => await bridge.disconnect()}
            className="text-red-400 hover:text-red-300 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#333] hover:bg-[#444] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4" aria-hidden="true">
              <title>Close icon</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
