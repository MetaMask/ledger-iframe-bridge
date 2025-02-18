// src/bridge.js
import LedgerBridge from './ledger-bridge.js';

let bridgeInstance = null;

export function initializeLedgerBridge() {
  if (!bridgeInstance) {
    bridgeInstance = new LedgerBridge();
    console.log('Initialized LedgerBridge singleton instance');
  }
  return bridgeInstance;
}

export function getLedgerBridge() {
  if (!bridgeInstance) {
    throw new Error('LedgerBridge not initialized');
  }

  // console.log(`Returning bridgeInstance: ${bridgeInstance}`);

  return bridgeInstance;
}

export default bridgeInstance;
