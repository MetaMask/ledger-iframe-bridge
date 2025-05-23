import { useEffect, useMemo, useRef } from 'react';
import { useLedgerRedux } from './useLedgerRedux';

export default function useAvailableDevices() {
  const { dmk, discoveredDevices, connectedDevice, actions } = useLedgerRedux();

  const subscription = useRef(null);

  useEffect(() => {
    if (!dmk) return;

    if (!subscription.current) {
      console.log('Starting device discovery');
      subscription.current = dmk
        .listenToAvailableDevices({})
        .subscribe((devices) => {
          console.log('Discovered devices:', devices);
          actions.setDiscoveredDevices(devices);
        });
    }

    return () => {
      if (subscription.current) {
        actions.setDiscoveredDevices([]);
        subscription.current.unsubscribe();
        subscription.current = null;
      }
    };
  }, [dmk]);

  const result = useMemo(
    () =>
      discoveredDevices.map((device) => ({
        ...device,
        connected:
          connectedDevice &&
          (connectedDevice.id === device.id ||
            (typeof connectedDevice === 'object' &&
              Object.values(connectedDevice).some(
                (cd) => cd && cd.id === device.id,
              ))),
      })),
    [discoveredDevices, connectedDevice],
  );

  return result;
}
