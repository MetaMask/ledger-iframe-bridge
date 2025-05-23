import { useNavigate } from 'react-router-dom';
import { DeviceStatus } from '@ledgerhq/device-management-kit';
import { useTranslation } from 'react-i18next';
import { useLedgerRedux } from '../hooks/useLedgerRedux';
import './MenuItem.css';

export default function MenuItem({ icon, label, id }) {
  const { t } = useTranslation();
  const { bridge, deviceStatus } = useLedgerRedux();
  const navigate = useNavigate();

  const isDisabled =
    id !== 'Home' && (!bridge || deviceStatus !== DeviceStatus.CONNECTED);

  const handleClick = () => {
    switch (id) {
      case 'Home':
        navigate('/');
        break;
      case 'test-eth-commands':
        navigate('/test-eth-commands');
        break;
      default:
        console.log(`Clicked ${label}`);
    }
  };

  return (
    <button
      className="menu-item"
      onClick={handleClick}
      disabled={isDisabled}
      type="button"
    >
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
    </button>
  );
}
