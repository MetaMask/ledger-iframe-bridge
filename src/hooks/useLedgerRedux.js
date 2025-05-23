import { useSelector, useDispatch } from 'react-redux';
import {
  setBridge,
  setDmk,
  setConnectionStatus,
  setConnectedDevice,
  setSessionId,
  setActionState,
  setDeviceStatus,
  setTransportType,
  setError,
  setDiscoveredDevices,
  resetLedgerState,
} from '../store/ledgerSlice';

export const useLedgerRedux = () => {
  const ledgerState = useSelector((state) => state.ledger);
  const dispatch = useDispatch();

  const actions = {
    setBridge: (bridge) => dispatch(setBridge(bridge)),
    setDmk: (dmk) => dispatch(setDmk(dmk)),
    setConnectionStatus: (payload) => dispatch(setConnectionStatus(payload)),
    setConnectedDevice: (device) => dispatch(setConnectedDevice(device)),
    setSessionId: (sessionId) => dispatch(setSessionId(sessionId)),
    setActionState: (actionState) => dispatch(setActionState(actionState)),
    setDeviceStatus: (deviceStatus) => dispatch(setDeviceStatus(deviceStatus)),
    setTransportType: (transportType) =>
      dispatch(setTransportType(transportType)),
    setError: (error) => dispatch(setError(error)),
    setDiscoveredDevices: (devices) => dispatch(setDiscoveredDevices(devices)),
    resetLedgerState: () => dispatch(resetLedgerState()),
  };

  return {
    ...ledgerState,
    actions,
  };
};

export default useLedgerRedux;
