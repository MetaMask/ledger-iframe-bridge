import { createContext, useEffect, useState, useContext } from 'react';
import { getLedgerBridge, initializeLedgerBridge } from '../bridge';
import { WEBHID } from '../ledger-bridge';

const LedgerBridgeContext = createContext({
  bridge: null,
  status: 'disconnected',
  transportType: null,
  connectedDevice: null,
  dmk: null,
  sessionId: null,
});

export const LedgerBridgeProvider = ({ children }) => {

  const [ledgerBridge, setLedgerBridge] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [transportType, setTransportType] = useState(null);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [dmk, setDmk] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const bridge = initializeLedgerBridge();
    setLedgerBridge(bridge);
    const sessionId = bridge && bridge.sessionId;
    const dmk = bridge && bridge.dmk;
    const connectedDevice = bridge && bridge.connectedDevice;
    const status = sessionId ? 'Connected' : 'Disconnected';
    const transportType = bridge && bridge.transportType === WEBHID ? 'USB' : 'Bluetooth';
    setDmk(dmk);
    setSessionId(sessionId);
    setConnectedDevice(connectedDevice);
    setStatus(status);
    setTransportType(transportType);

    const timer = setInterval(() => {
      //reset ledger bridge
      const bridge = getLedgerBridge();
      setLedgerBridge(bridge);
      const sessionId = bridge && bridge.sessionId;
      const dmk = bridge && bridge.dmk;
      const connectedDevice = bridge && bridge.connectedDevice;
      const status = sessionId ? 'Connected' : 'Disconnected';
      const transportType = bridge && bridge.transportType === WEBHID ? 'USB' : 'Bluetooth';
      setDmk(dmk);
      setSessionId(sessionId);
      setConnectedDevice(connectedDevice);
      setStatus(status);
      setTransportType(transportType);
    }, 2000);

    return () => {
      // clean up
      if(bridge) {
        bridge.close().then(() => {
          console.log('Closed bridge');
        });
      }
      timer && clearInterval(timer);
    }
  }, []);

  return (
    <LedgerBridgeContext.Provider value={ {
      bridge:ledgerBridge,
      status,
      transportType,
      connectedDevice,
      dmk,
      sessionId,
    } }>
      {children}
    </LedgerBridgeContext.Provider>
  );
};

export const useLedgerBridge = () => {
  const returnObj = useContext(LedgerBridgeContext);
  // console.log('returnObj', returnObj);

  return returnObj;
};
