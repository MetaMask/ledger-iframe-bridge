import DeviceSession from './DeviceSession';
import AvailableDevices from './AvailableDevices';
import MenuItem from './MenuItem';

export default function Sidebar() {
  const menuItems = [
    { id: 'Home', label: 'Home', icon: '🏠' },
    // { id: 'commands', label: 'Commands', icon: '📋' },
    // { id: 'device-actions', label: 'Device actions', icon: '📱' },
    // { id: 'apdu', label: 'APDU', icon: '🖥' },
    // { id: 'install-app', label: 'Install app', icon: '📦' },
    // { id: 'signers', label: 'Signers', icon: '🔐' },
    // { id: 'crypto-assets', label: 'Crypto Assets', icon: '💰' },
    { id: 'test-eth-commands', label: 'Test ETH Commands', icon: '⚡' },
  ];

  return (
    <div className="w-64 bg-[#1c1c1c] h-screen flex flex-col">
      <div className="p-4">
        <h1 className="text-white text-xl font-bold mb-6">
          Metamask Ledger Bridge
        </h1>

        <div className="space-y-6">
          <DeviceSession />
          <AvailableDevices />

          <div>
            <h2 className="text-white text-sm mb-2">Menu</h2>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <MenuItem key={item.id} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4">
        <div className="text-gray-600 text-xs mt-2">
          Metamask Ledger Bridge
        </div>
      </div>
    </div>
  );
}
