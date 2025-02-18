import {
  DeviceManagementKitBuilder,
  DeviceActionStatus,
  hexaStringToBuffer,
  isHexaString,
} from '@ledgerhq/device-management-kit';
import { SignerEthBuilder } from '@ledgerhq/device-signer-kit-ethereum';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import { Observable } from 'rxjs';
import { hexToAscii } from './utils/HexUtils';

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
    window.addEventListener(
      'message',
      async (e) => {
        if (e && e.data && e.data.target === 'LEDGER-IFRAME') {
          const { action, params, messageId } = e.data;
          const replyAction = `${action}-reply`;

          switch (action) {
            case 'ledger-unlock':
              this.unlock(replyAction, params.hdPath, messageId, e.source);
              break;
            case 'ledger-sign-transaction':
              console.log('ledger-sign-transaction', params);
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
            case 'ledger-close-bridge':
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
    source.postMessage(msg, '*');
  }

  async attemptMakeApp(replyAction, messageId, source) {
    console.log('attemptMakeApp');
    try {
      await this.makeApp({ openOnly: true });
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

  makeApp(config = {}) {
    console.log('makeApp');
    const self = this;
    if (!self.transportType) {
      self.transportType = WEBHID;
    }
    return new Observable((subscriber) => {
      if (!self.sessionId) {
        self.dmk.startDiscovering({ transport: self.transportType }).subscribe({
          next: (device) => {
            console.log('Device found:', device);
            self.dmk.connect({ device }).then((sessionId) => {
              const connectedDevice = self.dmk.getConnectedDevice({
                sessionId,
              });
              console.log('Connected device:', connectedDevice);
              self.connectedDevice = connectedDevice;

              self.sessionId = sessionId;
              self.ethSigner = new SignerEthBuilder({
                dmk: self.dmk,
                sessionId,
              }).build();
              subscriber.next(self.ethSigner);
            });
          },
          error: (error) => {
            console.error('Error:', error);
            subscriber.error(error);
          },
          complete: () => {
            console.log('Discovery complete');
            subscriber.complete();
          },
        });
      } else {
        subscriber.next(self.ethSigner);
      }
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
    console.log('unlock');
    const self = this;
    this.makeApp().subscribe({
      next: (app) => {
        console.log('unlock', hdPath);
        const { observable, cancel } = app.getAddress(
          hdPath.replace('m/', ''),
          {
            checkOnDevice: false,
            returnChainCode: false,
          },
        );

        observable.subscribe({
          next: (deviceActionState) => {
            self.handleResponse(
              deviceActionState,
              replyAction,
              messageId,
              'unlock',
              source,
            );
          },
          error: (error) => {
            console.error(error);
            self.sendMessageToExtension(
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
      },
    });
  }

  signTransaction(replyAction, hdPath, tx, messageId, source) {
    const self = this;
    this.makeApp().subscribe({
      next: (app) => {
        console.log('signTransaction', hdPath, tx);

        const transaction = hexaStringToBuffer(tx);

        const { observable, cancel } = app.signTransaction(
          hdPath.replace('m/', ''),
          transaction,
          {
            domain: 'localhost',
          },
        );

        observable.subscribe({
          next: (deviceActionState) => {
            self.handleResponse(
              deviceActionState,
              replyAction,
              messageId,
              'signTransaction',
              source,
            );
          },
          error: (error) => {
            self.error(error);
            self.sendMessageToExtension(
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
      },
    });
  }

  signPersonalMessage(replyAction, hdPath, message, messageId, source) {
    const self = this;
    self.makeApp().subscribe({
      next: (app) => {
        console.log('signPersonalMessage', hdPath, message);
        let clearText;
        // check the message is hex string or not
        if (isHexaString(message)) {
          // hexadecimal text to decode
          clearText = hexToAscii(message.slice(2));
        } else {
          clearText = message;
        }

        console.log(`clear text is ${clearText}`);
        const { observable, cancel } = app.signMessage(
          hdPath.replace('m/', ''),
          clearText,
        );

        observable.subscribe({
          next: (deviceActionState) => {
            self.handleResponse(
              deviceActionState,
              replyAction,
              messageId,
              'signPersonalMessage',
              source,
            );
          },
          error: (error) => {
            console.error(error);
            self.sendMessageToExtension(
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
      },
    });
  }

  async signTypedData(replyAction, hdPath, message, messageId, source) {
    const self = this;
    self.makeApp().subscribe({
      next: (app) => {
        console.log('signTypedData', hdPath, message);

        const { observable, cancel } = app.signTypedData(
          hdPath.replace('m/', ''),
          message,
        );

        observable.subscribe({
          next: (deviceActionState) => {
            self.handleResponse(
              deviceActionState,
              replyAction,
              messageId,
              'signTypedData',
              source,
            );
          },
          error: (error) => {
            console.error(error);
            self.sendMessageToExtension(
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
      },
    });
  }

  async disconnect() {
    if (this.dmk && this.sessionId) {
      await this.dmk.disconnect({ sessionId: this.sessionId });
    }
    this.sessionId = undefined;
    this.connectedDevice = undefined;
    this.ethSigner = undefined;
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
      err.hasOwnProperty('id') && err.hasOwnProperty('message');
    const isWrongAppError = (err) =>
      String(err.message || err).includes('6804');
    const isLedgerLockedError = (err) =>
      err.message && err.message.includes('OpenFailed');

    // https://developers.yubico.com/U2F/Libraries/Client_error_codes.html
    // if (isU2FError(err)) {
    //   if (err.metaData.code ===  ) {
    //     return new Error('LEDGER_TIMEOUT');
    //   }
    //   return err.metaData.type;
    // }

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
