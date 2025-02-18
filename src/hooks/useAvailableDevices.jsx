import { useEffect, useMemo, useRef, useState } from "react";
import { useLedgerBridge } from "../providers/LedgerBridgeProvider";

export default function useAvailableDevices(){
  const { dmk, connectedDevice } = useLedgerBridge();
  const [discoveredDevices, setDiscoveredDevices] = useState([]);

  const subscription = useRef(null);
  useEffect(() => {
    console.log('dmk is', dmk);
    if (!dmk) return;
    if (!subscription.current) {
      console.log('subscription is not current, making new subscription');
      subscription.current = dmk.listenToKnownDevices().subscribe((devices) => {
        console.log('devices is', devices);
        setDiscoveredDevices(devices);
      });
    }
    return () => {
      if (subscription.current) {
        setDiscoveredDevices([]);
        subscription.current.unsubscribe();
        subscription.current = null;
      }
    };
  }, [dmk]);

  const result = useMemo(
    () =>
      discoveredDevices.map((device) => ({
        ...device,
        connected: connectedDevice && Object.values(connectedDevice).some(
          (connectedDevice) => connectedDevice.id === device.id,
        ),
      })),
    [discoveredDevices],
  );

  return result;
}
