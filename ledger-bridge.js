import {
  ConnectedDevice,
  ConsoleLogger,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  TransportIdentifier,
} from '@ledgerhq/device-management-kit';

const WEBHID = 'WEB-HID';
export default class LedgerBridge {
  dmk;

  constructor() {
    this.dmk = new DeviceManagementKitBuilder()
      .addLogger(new ConsoleLogger())
      .build();
    this.addEventListeners();
    this.transportType = WEBHID;
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
              if (params.transportType === 'webhid') {
                this.updateTransportTypePreference(
                  replyAction,
                  'WEB-HID',
                  messageId,
                );
              } else {
                this.updateTransportTypePreference(
                  replyAction,
                  'u2f',
                  messageId,
                );
              }
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
      await this.makeApp({ openOnly: true });
      await this.cleanUp();
      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        messageId,
      });
    } catch (error) {
      await this.cleanUp();
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        messageId,
        error,
      });
    }
  }

  async makeApp(config = {}) {
    try {
      if (this.transportType === WEBHID) {
        if (!this.connectedDevice) {
          const dmkSdk = this.dmk;
          console.log('Attempting to make app');
          dmkSdk.startDiscovering({ transport: webHidIdentifier }).subscribe({
            next: (device) => {
              console.log('Device found:', device);
              dmkSdk.connect({ device }).then((sessionId) => {
                const connectedDevice = dmkSdk.getConnectedDevice({
                  sessionId,
                });
                console.log('Connected device:', connectedDevice);
                this.connectedDevice = connectedDevice;
                this.sessionId = sessionId;
              });
            },
            error: (error) => {
              console.error('Error:', error);
            },
            complete: () => {
              console.log('Discovery complete');
            },
          });
        }
      }
      //   const device = this.transport && this.transport.device;
      //   const nameOfDeviceType = device && device.constructor.name;
      //   const deviceIsOpen = device && device.opened;
      //   if (this.app && nameOfDeviceType === 'HIDDevice' && deviceIsOpen) {
      //     return;
      //   }
      //   this.transport = config.openOnly
      //     ? await TransportWebHID.openConnected()
      //     : await TransportWebHID.create();
      //   this.app = new LedgerEth(this.transport);
      // } else {
      //   this.transport = await TransportWebUSB.create();
      //   this.app = new LedgerEth(this.transport);
      // }
    } catch (e) {
      console.log('LEDGER:::CREATE APP ERROR', e);
      throw e;
    }
  }

  updateTransportTypePreference(replyAction, transportType, messageId) {
    this.transportType = transportType;
    this.cleanUp();
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      messageId,
    });
  }

  async cleanUp(replyAction, messageId) {
    this.app = null;
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    if (replyAction) {
      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        messageId,
      });
    }
  }

  async unlock(replyAction, hdPath, messageId) {
    try {
      await this.makeApp();
      const res = await this.app.getAddress(hdPath, false, true);
      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        payload: res,
        messageId,
      });
    } catch (err) {
      const e = this.ledgerErrToMessage(err);
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: e },
        messageId,
      });
    } finally {
      if (this.transportType !== 'ledgerLive') {
        this.cleanUp();
      }
    }
  }

  async signTransaction(replyAction, hdPath, tx, messageId) {
    try {
      await this.makeApp();
      const res = await this.app.clearSignTransaction(hdPath, tx, {
        nft: true,
        externalPlugins: true,
        erc20: true,
      });
      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        payload: res,
        messageId,
      });
    } catch (err) {
      const e = this.ledgerErrToMessage(err);
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: e },
        messageId,
      });
    } finally {
      if (this.transportType !== 'ledgerLive') {
        this.cleanUp();
      }
    }
  }

  async signPersonalMessage(replyAction, hdPath, message, messageId) {
    try {
      await this.makeApp();

      const res = await this.app.signPersonalMessage(hdPath, message);
      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        payload: res,
        messageId,
      });
    } catch (err) {
      const e = this.ledgerErrToMessage(err);
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: e },
        messageId,
      });
    } finally {
      if (this.transportType !== 'ledgerLive') {
        this.cleanUp();
      }
    }
  }

  async signTypedData(replyAction, hdPath, message, messageId) {
    try {
      await this.makeApp();
      const res = await this.app.signEIP712Message(hdPath, message);

      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        payload: res,
        messageId,
      });
    } catch (err) {
      const e = this.ledgerErrToMessage(err);
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: e },
        messageId,
      });
    } finally {
      this.cleanUp();
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
    if (isU2FError(err)) {
      if (err.metaData.code === 5) {
        return new Error('LEDGER_TIMEOUT');
      }
      return err.metaData.type;
    }

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
