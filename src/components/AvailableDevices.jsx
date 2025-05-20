import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAvailableDevices from '../hooks/useAvailableDevices';
import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import { LEDGER_LIVE_PATH, WEBHID } from '../ledger-bridge';

export default function AvailableDevices() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const { bridge, status, connectedDevice, sessionId } = useLedgerBridge();
  const discoveredDevices = useAvailableDevices();
  const noDevice = discoveredDevices.length === 0;
  const isConnected = status === 'Connected' && sessionId !== null;

  const handleConnect = async () => {
    try {
      await bridge.createConnection()
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-white text-sm font-medium mb-3 px-1 flex items-center gap-2">
        {t('availableDevices.title')} ({discoveredDevices.length})
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors bg-[#333] h-5 w-5 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
        >
          <span className={`inline-block transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </h2>

      {isExpanded && (
        <div className="space-y-3">
          {noDevice ? (
            <div className="bg-gradient-to-r from-[#2a2a2a] to-[#232323] rounded-xl p-4 flex items-center justify-between group hover:bg-[#333333] transition-all duration-300 shadow-lg border border-gray-800">
              <div className="flex items-center gap-4">
                <div className="bg-[#333] p-3 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <div className="text-white font-medium text-lg">{t('availableDevices.noDevices')}</div>
                  <div className="text-gray-400 text-sm">{t('buttons.connect')}</div>
                </div>
              </div>
            </div>
          ) : (
            discoveredDevices.map((device) => (
              <div
                key={device.id}
                className="bg-gradient-to-r from-[#2a2a2a] to-[#232323] rounded-xl p-4 flex items-center justify-between group hover:bg-[#333333] transition-all duration-300 shadow-lg border border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#333] p-3 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <div className="text-white font-medium text-lg">{device.deviceModel.name}</div>
                    <div className="text-gray-400 text-sm font-medium">
                      {device.transport === WEBHID ? t('availableDevices.usb') : t('availableDevices.bluetooth')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={device.connected || isConnected}
                  className={`px-4 py-2 rounded-full ${device.connected || isConnected ? 'bg-[#333333] opacity-70' : device.transport === WEBHID ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'} text-white text-sm font-medium shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 ${device.transport === WEBHID ? 'focus:ring-blue-400' : 'focus:ring-green-400'} focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100`}
                >
                  {device.connected ? t('buttons.disconnect') : isConnected ? t('common.notAvailable') : t('buttons.connect')}
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
