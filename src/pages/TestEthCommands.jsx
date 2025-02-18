import React, { useCallback } from 'react';
import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import { useDeviceSessionState } from '../hooks/useDeviceSessionState';
import './TestEthCommands.css';
import { DeviceStatus } from '@ledgerhq/device-management-kit';
import { LEDGER_LIVE_PATH } from '../ledger-bridge';

export default function TestEthCommands() {
  const { bridge, sessionId } = useLedgerBridge();
  const state = useDeviceSessionState(sessionId);

  const isDisabled = !bridge || state?.deviceStatus !== DeviceStatus.CONNECTED;


  const handleSignTransaction = useCallback(async () => {
    try {
      const hdPath = LEDGER_LIVE_PATH;
      const tx = "02eb83aa36a718843b9aca008502540be400825208940c54fccd2e384b4bb6f2e405bf5cbc15a017aafb8080c0";

      await bridge.signTransaction("test-sign-transaction", hdPath, tx, "test", undefined);
    } catch (error) {
      console.error(error);
    }
  }, [])

  const handleSignPersonalMessage = useCallback(async () => {
    try {
      const hdPath = LEDGER_LIVE_PATH;
      const message = "0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765";

      await bridge.signPersonalMessage("test-sign-personal-message", hdPath, message, "test", undefined);
    } catch (error) {
      console.error(error);
    }
  }, [])
  return (
    <div className="page-container">
      {bridge && (
        <>
          <h2 className="text-2xl font-bold text-white mb-4">Test ETH Commands</h2>
          <div className="button-group">
            <button
              disabled={isDisabled}
              onClick={() => handleSignTransaction()}
            >
              Test Sign Transaction
            </button>
            <button
              disabled={isDisabled}
              onClick={() => handleSignPersonalMessage()}
            >
              Test Sign Personal Message
            </button>
            <button
              disabled={isDisabled}
              onClick={() => console.log('Sign Typed Data V4 clicked')}
            >
              Test Sign Typed Data V4
            </button>
          </div>
        </>
      )}
    </div>
  );
}
