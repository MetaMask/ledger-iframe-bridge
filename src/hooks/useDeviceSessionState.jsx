import { useEffect, useState } from 'react';
import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import { DeviceStatus } from '@ledgerhq/device-management-kit';

export const useDeviceSessionState = (sessionId) => {
  const { bridge, connectedDevice } = useLedgerBridge();
  const [state, setState] = useState();

  useEffect(() => {
    if(sessionId && connectedDevice) {
      const subscription = bridge.dmk.getDeviceSessionState({
        sessionId,
      }).subscribe((state) => {
        if(state.deviceStatus === DeviceStatus.NOT_CONNECTED && connectedDevice) {
         bridge.disconnect();
         setState(undefined);
        } else {
          setState(state);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [sessionId, connectedDevice]);


  return state;
};
