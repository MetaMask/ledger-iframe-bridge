import { ContextModuleBuilder } from '@ledgerhq/context-module';
import {
  DeviceManagementKitBuilder,
  DeviceActionStatus,
  hexaStringToBuffer,
} from '@ledgerhq/device-management-kit';
import { SignerEthBuilder } from '@ledgerhq/device-signer-kit-ethereum';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import { hexToAscii } from './utils/HexUtils';
import { DeviceStatus } from '@ledgerhq/device-management-kit';

// Redux imports
import { store } from './store';
import {
  setBridge,
  setDmk,
  setConnectionStatus,
  setConnectedDevice,
  setSessionId,
  setActionState,
  setDeviceStatus,
  setTransportType,
  setError,
  setTimeLeft,
} from './store/ledgerSlice';

export const WEBHID = 'WEB-HID';
export const BLE = 'WEB-BLE';

export const LEDGER_LIVE_PATH = `m/44'/60'/0'/0/0`;
export const LEDGER_BIP44_PATH = `m/44'/60'/0'/0`;
export const LEDGER_LEGACY_PATH = `m/44'/60'/0'`;

const timeoutDuration = 60000;
export default class LedgerBridge {
  sessionId;
  transportType = WEBHID;
  dmk;
  connectedDevice;
  ethSigner;
  deviceStatus;
  actionState = 'none';
  interval;
  closeTimeout;
  timeoutInterval;

  source;

  constructor() {
    this.dmk = new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .addTransport(webBleTransportFactory)
      // .addLogger(new ConsoleLogger())
      // .addLogger(new FlipperDmkLogger())
      .build();

    // Initialize Redux state with bridge and dmk instances
    store.dispatch(setBridge(this));
    store.dispatch(setDmk(this.dmk));
    store.dispatch(setTransportType(this.transportType));

    // Start timeout for initial NOT_CONNECTED state
    store.dispatch(setDeviceStatus(DeviceStatus.NOT_CONNECTED));
    this.#handleAutoCloseTimeout(DeviceStatus.NOT_CONNECTED);

    this.addEventListeners();
  }

  addEventListeners() {
    // Listen for window close events
    window.addEventListener('beforeunload', async () => {
      console.log('Window is closing, cleaning up Ledger Bridge');
      // Clear any auto-close timeout
      this.#clearAutoCloseTimeout();
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
          const { action, params, messageId, payload } = e.data;
          const replyAction = `${action}-reply`;
          this.source = e.source;

          console.log('Message received:', e.data);

          // Adding this to preserve original code structure

          switch (action) {
            case 'heartbeat-check':
              console.log('heartbeat-check');
              this.sendMessageToExtension(
                {
                  action: replyAction,
                  success: true,
                  payload: { online: true },
                  messageId,
                },
                e.source,
              );
              break;
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
            case 'heartbeat':
              this.sendMessageToExtension(
                {
                  action: replyAction,
                  success: true,
                  payload: { online: true },
                  messageId,
                },
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
      store.dispatch(setTransportType(this.transportType));
    }

    if (!this.sessionId) {
      try {
        this.#setupInterval(callback);
      } catch (error) {
        console.error('Error:', error);
        store.dispatch(setError(error.message));
      }
    } else {
      callback();
    }
  }

  createConnection() {
    console.log('createConnection');

    // Update Redux state to show connecting
    store.dispatch(
      setConnectionStatus({
        isConnected: false,
        status: 'Connecting',
      }),
    );
    store.dispatch(setActionState('Connecting'));

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
        console.log('Connecting to device:', device);
        this.dmk
          .connect({ device })
          .then((sessionId) => {
            const connectedDevice = this.dmk.getConnectedDevice({
              sessionId,
            });

            // Update local properties
            this.connectedDevice = connectedDevice;
            this.sessionId = sessionId;

            // Update Redux state
            store.dispatch(setConnectedDevice(connectedDevice));
            store.dispatch(setSessionId(sessionId));
            store.dispatch(
              setConnectionStatus({
                isConnected: true,
                status: 'Connected',
              }),
            );
            store.dispatch(setActionState('None'));

            // Clear any existing timeout since we're now connected
            this.#clearAutoCloseTimeout();

            this.ethSigner = new SignerEthBuilder({
              dmk: this.dmk,
              sessionId,
            })
              .withContextModule(contextModule)
              .build();

            // // setup subscription for device status
            this.#setupDeviceStatusSubscription();
          })
          .catch((error) => {
            console.error('Connection error:', error);
            store.dispatch(setError(error.message));
            store.dispatch(
              setConnectionStatus({
                isConnected: false,
                status: 'Error',
              }),
            );
            // Set device status to NOT_CONNECTED and trigger timeout
            store.dispatch(setDeviceStatus(DeviceStatus.NOT_CONNECTED));
            this.#handleAutoCloseTimeout(DeviceStatus.NOT_CONNECTED);
          });
      },
      error: (error) => {
        console.error('Discovery error:', error);
        store.dispatch(setError(error.message));
        store.dispatch(
          setConnectionStatus({
            isConnected: false,
            status: 'Error',
          }),
        );
        // Set device status to NOT_CONNECTED and trigger timeout
        store.dispatch(setDeviceStatus(DeviceStatus.NOT_CONNECTED));
        this.#handleAutoCloseTimeout(DeviceStatus.NOT_CONNECTED);
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
        store.dispatch(setActionState(this.actionState));
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
        // Update Redux state with device status
        store.dispatch(setDeviceStatus(state.deviceStatus));

        // Handle auto-close timeout for specific device states
        this.#handleAutoCloseTimeout(state.deviceStatus);
      },
      error: (error) => {
        console.error('Device status error:', error);
        store.dispatch(setError(error.message));
      },
      complete: () => {
        console.log('Device session state subscription completed');
      },
    });
  }

  #handleAutoCloseTimeout(deviceStatus) {
    // Clear any existing timeout
    if (deviceStatus === DeviceStatus.CONNECTED) {
      this.#clearAutoCloseTimeout();
    }

    // Set timeout for NOT_CONNECTED or LOCKED states
    if (
      deviceStatus === DeviceStatus.NOT_CONNECTED ||
      deviceStatus === DeviceStatus.LOCKED
    ) {
      console.log(
        `Device status is ${deviceStatus}, starting 1-minute auto-close timeout`,
      );
      if (this.closeTimeout) {
        console.log('Auto-close timeout already set');
        return;
      }

      // Set initial time left in seconds
      const timeLeftSeconds = timeoutDuration / 1000;
      store.dispatch(setTimeLeft(timeLeftSeconds));

      // Create interval to update countdown every second
      this.timeoutInterval = setInterval(() => {
        const currentTimeLeft = store.getState().ledger.timeLeft;
        const newTimeLeft = currentTimeLeft - 1;

        if (newTimeLeft <= 0) {
          // Time's up - clear interval and close
          clearInterval(this.timeoutInterval);
          store.dispatch(setTimeLeft(0));
          console.log('Auto-closing page due to device timeout');

          // Send message to extension before closing
          this.sendMessageToExtension(
            {
              action: 'ledger-bridge-auto-close',
              success: true,
              reason: `Device ${deviceStatus} timeout`,
            },
            this.source,
          );

          // Close the window/page
          window.close();
        } else {
          // Update time left
          store.dispatch(setTimeLeft(newTimeLeft));
        }
      }, 1000);

      // Keep the original timeout as backup
      this.closeTimeout = setTimeout(() => {
        console.log('Auto-closing page due to device timeout (backup)');
        this.#clearAutoCloseTimeout();

        // Send message to extension before closing
        this.sendMessageToExtension(
          {
            action: 'ledger-bridge-auto-close',
            success: true,
            reason: `Device ${deviceStatus} timeout`,
          },
          this.source,
        );

        // Close the window/page
        window.close();
      }, timeoutDuration);
    }
  }

  #clearAutoCloseTimeout() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    if (this.timeoutInterval) {
      clearInterval(this.timeoutInterval);
      this.timeoutInterval = null;
    }

    // Reset time left in Redux
    store.dispatch(setTimeLeft(-1));
  }

  updateTransportTypePreference(replyAction, transportType, messageId, source) {
    if (transportType !== this.transportType) {
      console.log('updateTransportTypePreference', transportType);
      // this.transportType = transportType;
      this.cleanUp(replyAction, messageId, source);
      this.transportType = transportType;
      // Update Redux state with new transport type
      store.dispatch(setTransportType(transportType));
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
      this.actionState = 'getAccount';
      store.dispatch(setActionState(this.actionState));
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
      store.dispatch(setActionState(this.actionState));
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
      store.dispatch(setActionState(this.actionState));

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
      store.dispatch(setActionState(this.actionState));

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
    // Clear any auto-close timeout
    this.#clearAutoCloseTimeout();

    if (this.dmk && this.sessionId) {
      await this.dmk.disconnect({ sessionId: this.sessionId });
    }

    // Clear local properties
    this.sessionId = undefined;
    this.connectedDevice = undefined;
    this.ethSigner = undefined;
    this.actionState = 'none';
    this.source = undefined;
    this.deviceStatus = undefined;

    // Update Redux state
    store.dispatch(
      setConnectionStatus({
        isConnected: false,
        status: 'Disconnected',
      }),
    );
    store.dispatch(setConnectedDevice(null));
    store.dispatch(setSessionId(null));
    store.dispatch(setActionState('none'));
    store.dispatch(setDeviceStatus(null));
    store.dispatch(setError(null));
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
      store.dispatch(setActionState(this.actionState));
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
      store.dispatch(setActionState(this.actionState));
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
