import DeviceSession from './DeviceSession';
import AvailableDevices from './AvailableDevices';
import MenuItem from './MenuItem';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const { t } = useTranslation();
  
  const menuItems = [
    { id: 'Home', label: t('menu.home'), icon: '🏠' },
    // { id: 'commands', label: 'Commands', icon: '📋' },
    // { id: 'device-actions', label: 'Device actions', icon: '📱' },
    // { id: 'apdu', label: 'APDU', icon: '🖥' },
    // { id: 'install-app', label: 'Install app', icon: '📦' },
    // { id: 'signers', label: 'Signers', icon: '🔐' },
    // { id: 'crypto-assets', label: 'Crypto Assets', icon: '💰' },
    { id: 'test-eth-commands', label: t('menu.testEthCommands'), icon: '⚡' },
  ];

  return (
    <div className="w-64 bg-[#1c1c1c] h-screen flex flex-col">
      <div className="p-4">
        <h1 className="text-white text-xl font-bold mb-6">
          {t('app.title')}
        </h1>

        <div className="space-y-6">
          <DeviceSession />
          <AvailableDevices />

          <div>
            <h2 className="text-white text-sm mb-2">{t('sidebar.menu')}</h2>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <MenuItem key={item.id} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4">
        <div className="mb-4 w-full flex justify-center">
          <LanguageSwitcher />
        </div>
        <div className="text-gray-600 text-xs text-center">
          {t('app.footer')}
        </div>
      </div>
    </div>
  );
}
