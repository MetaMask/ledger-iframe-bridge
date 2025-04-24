import { ContextModuleBuilder } from '@ledgerhq/context-module';
import {
  DeviceManagementKitBuilder,
  DeviceActionStatus,
  hexaStringToBuffer,
} from '@ledgerhq/device-management-kit';
import { SignerEthBuilder } from '@ledgerhq/device-signer-kit-ethereum';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import { Observable } from 'rxjs';
import { hexToAscii } from './utils/HexUtils';
import { DeviceStatus } from '@ledgerhq/device-management-kit';

export const WEBHID = 'WEB-HID';
export const BLE = 'WEB-BLE';

export const LEDGER_LIVE_PATH = `m/44'/60'/0'/0/0`;
export const LEDGER_BIP44_PATH = `m/44'/60'/0'/0`;
export const LEDGER_LEGACY_PATH = `m/44'/60'/0'`;

export default class LedgerBridge {
  sessionId;
  transportType = WEBHID;
  dmk;
  connectedDevice;
  ethSigner;
  deviceStatus;
  actionState = 'None';
  interval;

  source;

  constructor() {
    this.dmk = new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .addTransport(webBleTransportFactory)
      // .addLogger(new ConsoleLogger())
      // .addLogger(new FlipperDmkLogger())
      .build();

    this.addEventListeners();
  }

  addEventListeners() {
    // Listen for window close events
    window.addEventListener('beforeunload', async () => {
      console.log('Window is closing, cleaning up Ledger Bridge');
      // broadcast message to close screen.
      this.sendMessageToExtension(
        {
          action: 'ledger-bridge-close',
          success: true,
        },
        this.source,
      );
      await this.close();
    });

    window.addEventListener(
      'message',
      async (e) => {
        if (e?.data && e.data.target === 'LEDGER-IFRAME') {
          const { action, params, messageId } = e.data;
          const replyAction = `${action}-reply`;
          this.source = e.source;

          console.log('Message received:', e.data);

          switch (action) {
            case 'ledger-unlock':
              this.unlock(replyAction, params.hdPath, messageId, e.source);
              break;
            case 'ledger-sign-transaction':
              this.signTransaction(
                replyAction,
                params.hdPath,
                params.tx,
                messageId,
                e.source,
              );
              break;
            case 'ledger-sign-personal-message':
              this.signPersonalMessage(
                replyAction,
                params.hdPath,
                params.message,
                messageId,
                e.source,
              );
              break;
            case 'ledger-bridge-close':
              this.cleanUp(replyAction, messageId);
              break;
            case 'ledger-update-transport':
              if (params.transportType === 'webhid') {
                this.updateTransportTypePreference(
                  replyAction,
                  WEBHID,
                  messageId,
                  e.source,
                );
              } else {
                this.updateTransportTypePreference(
                  replyAction,
                  BLE,
                  messageId,
                  e.source,
                );
              }
              break;
            case 'ledger-make-app':
              this.attemptMakeApp(replyAction, messageId, e.source);
              break;
            case 'ledger-sign-typed-data':
              this.signTypedData(
                replyAction,
                params.hdPath,
                params.message,
                messageId,
                e.source,
              );
              break;
          }
        }
      },
      false,
    );
  }

  sendMessageToExtension(msg, source) {
    if (!source) return;
    this.subscribe = undefined;
    source.postMessage(msg, '*');
  }

  async attemptMakeApp(replyAction, messageId, source) {
    console.log('attemptMakeApp');
    try {
      await this.makeApp();
      this.sendMessageToExtension(
        {
          action: replyAction,
          success: true,
          messageId,
        },
        source,
      );
    } catch (error) {
      this.sendMessageToExtension(
        {
          action: replyAction,
          success: false,
          messageId,
          error,
        },
        source,
      );
    }
  }

  makeApp(callback) {
    console.log('makeApp');
    if (!this.transportType) {
      this.transportType = WEBHID;
    }

    if (!this.sessionId) {
      try {
        this.actionState = 'Wait for connection';
        // this.createConnection();
        this.#setupInterval(callback);
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      callback();
    }
  }

  createConnection() {
    console.log('createConnection');

    const calConfig = {
      url: 'https://crypto-assets-service.api.ledger.com/v1',
      mode: 'prod',
      branch: 'main',
    };

    const web3ChecksConfig = {
      url: 'https://web3checks-backend.api.ledger.com/v3',
    };

    const contextModule = new ContextModuleBuilder({
      originToken: 'origin-token', // TODO: replace with your origin token
    })
      .addCalConfig(calConfig)
      .addWeb3ChecksConfig(web3ChecksConfig)
      .build();

    this.dmk.startDiscovering({ transport: this.transportType }).subscribe({
      next: (device) => {
        this.dmk.connect({ device }).then((sessionId) => {
          const connectedDevice = this.dmk.getConnectedDevice({
            sessionId,
          });
          this.connectedDevice = connectedDevice;

          this.sessionId = sessionId;
          this.ethSigner = new SignerEthBuilder({
            dmk: this.dmk,
            sessionId,
          })
            .withContextModule(contextModule)
            .build();

          // // setup subscription for device status
          this.#setupDeviceStatusSubscription();
        });
      },
      error: (error) => {
        console.error('Error:', error);
        throw error;
      },
      complete: () => {
        console.log('Discovery complete');
      },
    });
  }

  #setupInterval(callback) {
    this.interval = setInterval(() => {
      if (this.deviceStatus === DeviceStatus.LOCKED) {
        this.actionState = 'Wait for Unlock';
      }
      if (this.deviceStatus === DeviceStatus.CONNECTED) {
        callback();
        this.#clearInterval();
      }
    }, 500);
  }

  #clearInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  #setupDeviceStatusSubscription() {
    this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state) => {
        this.deviceStatus = state.deviceStatus;
      },
      error: (error) => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('Device session state subscription completed');
      },
    });
  }

  updateTransportTypePreference(replyAction, transportType, messageId, source) {
    if (transportType !== this.transportType) {
      console.log('updateTransportTypePreference', transportType);
      // this.transportType = transportType;
      this.cleanUp(replyAction, messageId, source);
      this.transportType = transportType;
    }

    this.sendMessageToExtension(
      {
        action: replyAction,
        success: true,
        messageId,
      },
      source,
    );
  }

  async cleanUp(replyAction, messageId, source) {
    console.log('cleanUp');
    await this.disconnect();

    if (replyAction) {
      this.sendMessageToExtension(
        {
          action: replyAction,
          success: true,
          messageId,
        },
        source,
      );
    }
  }

  unlock(replyAction, hdPath, messageId, source) {
    console.log('unlock', hdPath);
    this.makeApp(() => {
      this.actionState = 'Unlock';
      const { observable, cancel } = this.ethSigner.getAddress(
        hdPath.replace('m/', ''),
        {
          checkOnDevice: false,
          returnChainCode: false,
        },
      );

      observable.subscribe({
        next: (deviceActionState) => {
          this.handleResponse(
            deviceActionState,
            replyAction,
            messageId,
            'unlock',
            source,
          );
        },
        error: (error) => {
          console.error(error);
          this.sendMessageToExtension(
            {
              action: replyAction,
              success: false,
              payload: { error: error },
              messageId,
            },
            source,
          );
        },
        complete: () => {
          console.log('unlock completed');
        },
      });
    });
  }

  signTransaction(replyAction, hdPath, tx, messageId, source) {
    console.log('signTransaction', hdPath, tx);
    this.makeApp(() => {
      this.actionState = 'sign Transaction';
      console.log('signTransaction', hdPath, tx);

      const transaction = hexaStringToBuffer(tx);

      const { observable, cancel } = this.ethSigner.signTransaction(
        hdPath.replace('m/', ''),
        transaction,
        {
          domain: 'localhost',
        },
      );

      observable.subscribe({
        next: (deviceActionState) => {
          this.handleResponse(
            deviceActionState,
            replyAction,
            messageId,
            'signTransaction',
            source,
          );
        },
        error: (error) => {
          this.error(error);
          this.sendMessageToExtension(
            {
              action: replyAction,
              success: false,
              payload: { error: error },
              messageId,
            },
            source,
          );
        },
        complete: () => {
          console.log('signTransaction completed');
        },
      });
    });
  }

  signPersonalMessage(replyAction, hdPath, message, messageId, source) {
    console.log('signPersonalMessage', hdPath, message);
    this.makeApp(() => {
      this.actionState = 'sign Personal Message';

      // check the message is hex string or not
      // if (isHexaString(message)) {
      // hexadecimal text to decode
      const clearText = hexToAscii(message);
      // } else {
      //   clearText = message;
      // }

      console.log(`clear text is ${clearText}`);
      const { observable, cancel } = this.ethSigner.signMessage(
        hdPath.replace('m/', ''),
        clearText,
      );

      observable.subscribe({
        next: (deviceActionState) => {
          this.handleResponse(
            deviceActionState,
            replyAction,
            messageId,
            'signPersonalMessage',
            source,
          );
        },
        error: (error) => {
          console.error(error);
          this.sendMessageToExtension(
            {
              action: replyAction,
              success: false,
              payload: { error: error },
              messageId,
            },
            source,
          );
        },
        complete: () => {
          console.log('signPersonalMessage completed');
        },
      });
    });
  }

  async signTypedData(replyAction, hdPath, message, messageId, source) {
    console.log('signTypedData', hdPath, message);
    this.makeApp(() => {
      this.actionState = 'sign Typed Data';

      const { observable, cancel } = this.ethSigner.signTypedData(
        hdPath.replace('m/', ''),
        message,
      );

      observable.subscribe({
        next: (deviceActionState) => {
          this.handleResponse(
            deviceActionState,
            replyAction,
            messageId,
            'signTypedData',
            source,
          );
        },
        error: (error) => {
          console.error(error);
          this.sendMessageToExtension(
            {
              action: replyAction,
              success: false,
              payload: { error: error },
              messageId,
            },
            source,
          );
        },
        complete: () => {
          console.log('signTypedData completed');
        },
      });
    });
  }

  async disconnect() {
    if (this.dmk && this.sessionId) {
      await this.dmk.disconnect({ sessionId: this.sessionId });
    }
    this.sessionId = undefined;
    this.connectedDevice = undefined;
    this.ethSigner = undefined;
    this.actionState = 'None';
    this.source = undefined;
    this.deviceStatus = undefined;
  }

  async close() {
    await this.disconnect();
    if (this.dmk) {
      this.dmk.close();
    }
  }

  handleResponse(deviceActionState, replyAction, messageId, action, source) {
    console.warn(deviceActionState);

    if (deviceActionState.status === DeviceActionStatus.Completed) {
      this.actionState = 'none';
      const output = deviceActionState.output;
      console.log('output is', output);
      const result = output;
      if (
        action === 'signTypedData' ||
        action === 'signPersonalMessage' ||
        action === 'signTransaction'
      ) {
        result.r = result.r.replace('0x', '');
        result.s = result.s.replace('0x', '');
        result.v = result.v.toString();
      }
      this.sendMessageToExtension(
        {
          action: replyAction,
          success: true,
          payload: result,
          messageId,
        },
        source,
      );
    } else if (deviceActionState.status === DeviceActionStatus.Error) {
      this.actionState = 'none';
      this.sendMessageToExtension(
        {
          action: replyAction,
          success: false,
          payload: { error: deviceActionState.error },
          messageId,
        },
        source,
      );
    }
  }

  ledgerErrToMessage(err) {
    const isU2FError = (err) => !!err && !!err.metaData;
    const isStringError = (err) => typeof err === 'string';
    const isErrorWithId = (err) =>
      Object.prototype.hasOwnProperty.call(err, 'id') &&
      Object.prototype.hasOwnProperty.call(err, 'message');
    const isWrongAppError = (err) =>
      String(err.message || err).includes('6804');
    const isLedgerLockedError = (err) => err.message?.includes('OpenFailed');

    // https://developers.yubico.com/U2F/Libraries/Client_error_codes.html
    if (isWrongAppError(err)) {
      return new Error('LEDGER_WRONG_APP');
    }

    if (
      isLedgerLockedError(err) ||
      (isStringError(err) && err.includes('6801'))
    ) {
      return new Error('LEDGER_LOCKED');
    }

    if (isErrorWithId(err)) {
      // Browser doesn't support U2F
      if (err.message.includes('U2F not supported')) {
        return new Error('U2F_NOT_SUPPORTED');
      }
    }

    // Other
    return err;
  }
}
