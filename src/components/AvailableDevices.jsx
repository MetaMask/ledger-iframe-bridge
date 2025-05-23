import { useTranslation } from 'react-i18next';
import { WEBHID } from '../ledger-bridge';
import { useLedgerRedux } from '../hooks/useLedgerRedux';
import useAvailableDevices from '../hooks/useAvailableDevices';

export default function AvailableDevices() {
  const { t } = useTranslation();
  const { bridge, status, sessionId } = useLedgerRedux();
  const discoveredDevices = useAvailableDevices();
  const noDevice = discoveredDevices.length === 0;
  const isConnected = status === 'Connected' && sessionId !== null;

  const handleConnect = async () => {
    try {
      if (bridge) {
        await bridge.createConnection();
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  if (noDevice) {
    return (
      <div className="w-full">
        <h3 className="text-white text-sm font-medium mb-3">
          {t('availableDevices.title')}
        </h3>
        <div className="text-center text-gray-400 text-sm py-8">
          {t('availableDevices.noDevicesFound')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-white text-sm font-medium mb-3">
        {t('availableDevices.title')}
      </h3>
      <div className="space-y-2">
        {discoveredDevices.map((device) => (
          <div
            key={device.id}
            className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-4 flex items-center justify-between hover:bg-[#333333] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4a4a4a] rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-600 rounded"></div>
              </div>
              <div className="flex flex-col">
                <div className="text-white font-medium text-sm">
                  {device.deviceModel.name}
                </div>
                <div className="text-gray-400 text-xs">
                  {t('buttons.connected')}{' '}
                  {device.transport === WEBHID
                    ? t('availableDevices.viaUsb')
                    : t('availableDevices.viaBluetooth')}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleConnect}
              disabled={device.connected || isConnected}
              className="hover:text-white  disabled:bg-gray-600 disabled:opacity-50 text-[#037dd6] px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#037dd6] focus:ring-opacity-50 disabled:cursor-not-allowed"
            >
              {device.connected
                ? t('buttons.connected')
                : isConnected
                ? t('availableDevices.unavailable')
                : t('buttons.connect')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
