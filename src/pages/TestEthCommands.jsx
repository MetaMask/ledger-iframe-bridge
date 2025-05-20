import React, { useCallback } from 'react';
import { useLedgerBridge } from '../providers/LedgerBridgeProvider';
import { useDeviceSessionState } from '../hooks/useDeviceSessionState';
import { useTranslation } from 'react-i18next';
import './TestEthCommands.css';
import { DeviceStatus } from '@ledgerhq/device-management-kit';
import { LEDGER_LIVE_PATH } from '../ledger-bridge';

export default function TestEthCommands() {
  const { t } = useTranslation();
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
  }, [bridge])

  const handleSignPersonalMessage = useCallback(async () => {
    try {
      const hdPath = LEDGER_LIVE_PATH;
      const message = "0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765";

      await bridge.signPersonalMessage("test-sign-personal-message", hdPath, message, "test", undefined);
    } catch (error) {
      console.error(error);
    }
  }, [bridge])

  const handleSignTypedData = useCallback(async () => {
    try {
      const hdPath = LEDGER_LIVE_PATH;

      // EIP-712 typed data v4 structure
      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' }
          ]
        },
        primaryType: 'Mail',
        domain: {
          name: 'Ledger DMK Test',
          version: '1',
          chainId: 1,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
        },
        message: {
          from: {
            name: 'Alice',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
          },
          contents: 'Hello, this is a test of DMK Sign Typed Data V4!'
        }
      };

      await bridge.signTypedData("test-sign-typed-data", hdPath, typedData, "test", undefined);
    } catch (error) {
      console.error(error);
    }
  }, [bridge])
  return (
    <div className="page-container">
      {bridge && (
        <>
          <h2 className="text-2xl font-bold text-white mb-4">{t('menu.testEthCommands')}</h2>
          <div className="button-group">
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => handleSignTransaction()}
            >
              {t('ethCommands.signTransaction')}
            </button>
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => handleSignPersonalMessage()}
            >
              {t('ethCommands.signPersonalMessage')}
            </button>
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => handleSignTypedData()}
            >
              {t('ethCommands.signTypedData')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
