import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import LedgerEth from '@ledgerhq/hw-app-eth';
import WebSocketTransport from '@ledgerhq/hw-transport-http/lib/WebSocketTransport';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';
import { TransportStatusError } from '@ledgerhq/errors';

// URL which triggers Ledger Live app to open and handle communication
const BRIDGE_URL = 'ws://localhost:8435';

// Number of seconds to poll for Ledger Live and Ethereum app opening
const TRANSPORT_CHECK_DELAY = 1000;
const TRANSPORT_CHECK_LIMIT = 120;

const serializeError = (error) => {
  if (error instanceof TransportStatusError) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      statusCode: error.statusCode,
      statusText: error.statusText,
    };
  }

  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
  };
};

export default class LedgerBridge {
  constructor() {
    this.addEventListeners();
    this.transportType = 'u2f';
  }

  addEventListeners() {
    window.addEventListener(
      'message',
      async (e) => {
        if (e && e.data && e.data.target === 'LEDGER-IFRAME') {
          const { action, params, messageId } = e.data;
          const replyAction = `${action}-reply`;

          switch (action) {
            case 'ledger-is-iframe-ready':
              this.sendMessageToExtension({
                action: replyAction,
                success: true,
                messageId,
              });
              break;
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
              if (
                params.transportType === 'ledgerLive' ||
                params.useLedgerLive
              ) {
                this.updateTransportTypePreference(
                  replyAction,
                  'ledgerLive',
                  messageId,
                );
              } else if (params.transportType === 'webhid') {
                this.updateTransportTypePreference(
                  replyAction,
                  'webhid',
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

  delay(ms) {
    return new Promise((success) => setTimeout(success, ms));
  }

  checkTransportLoop(i) {
    const iterator = i || 0;
    return WebSocketTransport.check(BRIDGE_URL).catch(async () => {
      await this.delay(TRANSPORT_CHECK_DELAY);
      if (iterator < TRANSPORT_CHECK_LIMIT) {
        return this.checkTransportLoop(iterator + 1);
      } else {
        throw new Error('Ledger transport check timeout');
      }
    });
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
        payload: { error: serializeError(error) },
      });
    }
  }

  async makeApp(config = {}) {
    try {
      if (this.transportType === 'ledgerLive') {
        let reestablish = false;
        try {
          await WebSocketTransport.check(BRIDGE_URL);
        } catch (_err) {
          window.open('ledgerlive://bridge?appName=Ethereum');
          await this.checkTransportLoop();
          reestablish = true;
        }
        if (!this.app || reestablish) {
          this.transport = await WebSocketTransport.open(BRIDGE_URL);
          this.app = new LedgerEth(this.transport);
        }
      } else if (this.transportType === 'webhid') {
        const device = this.transport && this.transport.device;
        const nameOfDeviceType = device && device.constructor.name;
        const deviceIsOpen = device && device.opened;
        if (this.app && nameOfDeviceType === 'HIDDevice' && deviceIsOpen) {
          return;
        }
        this.transport = config.openOnly
          ? await TransportWebHID.openConnected()
          : await TransportWebHID.create();
        this.app = new LedgerEth(this.transport);
      } else {
        this.transport = await TransportWebUSB.create();
        this.app = new LedgerEth(this.transport);
      }
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
    } catch (error) {
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: serializeError(error) },
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
    } catch (error) {
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: serializeError(error) },
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
    } catch (error) {
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: serializeError(error) },
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

      // Try the primary method first
      let res = await this.attemptSignEIP712Message(hdPath, message);

      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        payload: res,
        messageId,
      });
    } catch (error) {
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: serializeError(error) },
        messageId,
      });
    } finally {
      this.cleanUp();
    }
  }

  async attemptSignEIP712Message(hdPath, message) {
    try {
      // Try the primary signing method
      return await this.app.signEIP712Message(hdPath, message);
    } catch (signError) {
      // Fallback to signEIP712HashedMessage if signEIP712Message fails (e.g., for Nano S)
      // Extract hashStructMessageHex and domainSeparatorHex from the message object
      const domainSeparatorHex = TypedDataUtils.hashStruct(
        'EIP712Domain',
        message.domain,
        message.types,
        SignTypedDataVersion.V4,
      ).toString('hex');

      const hashStructMessageHex = TypedDataUtils.hashStruct(
        message.primaryType,
        message.message,
        message.types,
        SignTypedDataVersion.V4,
      ).toString('hex');

      // Try the fallback signing method
      return await this.app.signEIP712HashedMessage(
        hdPath,
        domainSeparatorHex,
        hashStructMessageHex,
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
