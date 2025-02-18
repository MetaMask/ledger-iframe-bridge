import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import { useNavigate } from 'react-router-dom';
import { useDeviceSessionState } from '../hooks/useDeviceSessionState';
import { DeviceStatus } from '@ledgerhq/device-management-kit';
import './MenuItem.css';

export default function MenuItem({ icon, label, id }) {
  const { bridge, sessionId } = useLedgerBridge();
  const navigate = useNavigate();
  const state = useDeviceSessionState(sessionId);

  const isDisabled = id !== 'Home' && (!bridge || state?.deviceStatus !== DeviceStatus.CONNECTED);

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
    >
      <span className="icon">{icon}</span>
      <span className="label">{label}</span>
    </button>
  );
}
