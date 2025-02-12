import {
  ConsoleLogger,
  DeviceManagementKitBuilder,
} from '@ledgerhq/device-management-kit';
import { SignerEthBuilder } from '@ledgerhq/device-signer-kit-ethereum';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import { Observable } from 'rxjs';

const WEBHID = 'WEB-HID';
const BLE = 'WEB-BLE';

export default class LedgerBridge {
  sessionId;
  transportType;

  constructor() {
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
              this.unlock(replyAction, params.hdPath, messageId);
              break;
            case 'ledger-sign-transaction':
              console.log('ledger-sign-transaction', params);
              this.signTransaction(
                replyAction,
                params.hdPath,
                params.tx,
                messageId,
              );
              break;
            case 'ledger-sign-personal-message':
              this.signPersonalMessage(
                replyAction,
                params.hdPath,
                params.message,
                messageId,
              );
              break;
            case 'ledger-close-bridge':
              this.cleanUp(replyAction, messageId);
              break;
            case 'ledger-update-transport':
              // if (params.transportType === WEBHID) {
              this.updateTransportTypePreference(
                replyAction,
                WEBHID,
                messageId,
              );
              // } else {
              // this.updateTransportTypePreference(
              //   replyAction,
              //   WEBHID,
              //   messageId,
              // );
              // }
              break;
            case 'ledger-make-app':
              this.attemptMakeApp(replyAction, messageId);
              break;
            case 'ledger-sign-typed-data':
              this.signTypedData(
                replyAction,
                params.hdPath,
                params.message,
                messageId,
              );
              break;
          }
        }
      },
      false,
    );
  }

  sendMessageToExtension(msg) {
    window.parent.postMessage(msg, '*');
  }

  async attemptMakeApp(replyAction, messageId) {
    try {
      // await this.makeApp({ openOnly: true });
      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        messageId,
      });
    } catch (error) {
      await this.cleanUp(replyAction, messageId);
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        messageId,
        error,
      });
    }
  }

  makeApp(config = {}) {
    const self = this;

    return new Observable((subscriber) => {
      if (self.transportType === WEBHID) {
        if (!self.sessionId) {
          console.log('Attempting to make app');
          const dmk = new DeviceManagementKitBuilder()
            .addLogger(new ConsoleLogger())
            .addTransport(webHidTransportFactory)
            .addTransport(webBleTransportFactory)
            .addLogger(new ConsoleLogger())
            // .addLogger(new FlipperDmkLogger())
            .build();

          dmk.startDiscovering({ transport: WEBHID }).subscribe({
            next: (device) => {
              console.log('Device found:', device);
              self.dmk.connect({ device }).then((sessionId) => {
                const connectedDevice = self.dmk.getConnectedDevice({
                  sessionId,
                });
                console.log('Connected device:', connectedDevice);

                self.sessionId = sessionId;
                subscriber.next(
                  new SignerEthBuilder({
                    dmk: self.dmk,
                    sessionId,
                  }).build(),
                );
              });
            },
            error: (error) => {
              console.error('Error:', error);
              subscriber.reject(error);
            },
            complete: () => {
              console.log('Discovery complete');
              subscriber.complete();
            },
          });
        } else {
          subscriber.next(
            new SignerEthBuilder({
              dmk: this.dmk,
              sessionId: this.sessionId,
            }).build(),
          );
        }
      }
    });
  }

  updateTransportTypePreference(replyAction, transportType, messageId) {
    // this.transportType = transportType;
    this.cleanUp(replyAction, messageId);
    this.transportType = transportType;
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      messageId,
    });
  }

  cleanUp(replyAction, messageId) {
    this.sessionId = undefined;
    // this.connectedDevice = undefined;

    if (replyAction) {
      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        messageId,
      });
    }
  }

  unlock(replyAction, hdPath, messageId) {
    const self = this;
    this.makeApp().subscribe({
      next: (app) => {
        app
          .getAddress(hdPath, {
            checkOnDevice: false,
            returnChainCode: false,
          })
          .subscribe({
            next: (response) => {
              console.warn(response);
              self.sendMessageToExtension({
                action: replyAction,
                success: true,
                payload: response.address,
                messageId,
              });
            },
            error: (error) => {
              console.error(error);
              self.sendMessageToExtension({
                action: replyAction,
                success: false,
                payload: { error: error },
                messageId,
              });
            },
            complete: () => {
              console.log('unlock completed');
            },
          });
      },
    });
  }

  signTransaction(replyAction, hdPath, tx, messageId) {
    const self = this;
    this.makeApp().subscribe({
      next: (app) => {
        app.signTransaction(hdPath, tx).subscribe({
          next: (response) => {
            console.log(response);
            self.sendMessageToExtension({
              action: replyAction,
              success: true,
              payload: {
                r: response.r,
                s: response.s,
                v: response.v,
              },
              messageId,
            });
          },
          error: (error) => {
            self.error(error);
          },
          complete: () => {
            console.log('signTransaction completed');
          },
        });
      },
    });
  }

  signPersonalMessage(replyAction, hdPath, message, messageId) {
    const self = this;
    self.makeApp().subscribe({
      next: (app) => {
        app.signPersonalMessage(hdPath, message).subscribe({
          next: (response) => {
            console.log(response);
            self.sendMessageToExtension({
              action: replyAction,
              success: true,
              payload: response,
              messageId,
            });
          },
          error: (error) => {
            console.error(error);
            self.sendMessageToExtension({
              action: replyAction,
              success: false,
              payload: { error: error },
              messageId,
            });
          },
          complete: () => {
            console.log('signPersonalMessage completed');
          },
        });
      },
    });
  }

  async signTypedData(replyAction, hdPath, message, messageId) {
    const self = this;
    self.makeApp().subscribe({
      next: (app) => {
        app.signEIP712Message(hdPath, message).subscribe({
          next: (response) => {
            console.log(response);
            self.sendMessageToExtension({
              action: replyAction,
              success: true,
              payload: response,
              messageId,
            });
          },
          error: (error) => {
            console.error(error);
            self.sendMessageToExtension({
              action: replyAction,
              success: false,
              payload: { error: error },
              messageId,
            });
          },
          complete: () => {
            console.log('signPersonalMessage completed');
          },
        });
      },
    });
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
