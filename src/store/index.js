import { configureStore } from '@reduxjs/toolkit';
import ledgerReducer from './ledgerSlice';

export const store = configureStore({
  reducer: {
    ledger: ledgerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'ledger/setDeviceInfo',
          'ledger/setBridge',
          'ledger/setDmk',
          'ledger/setDeviceStatus',
          'ledger/setConnectedDevice',
          'ledger/setDiscoveredDevices',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: [
          'payload.bridge',
          'payload.device',
          'payload.dmk',
          'payload.connectedDevice',
          'payload.discoveredDevices',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'ledger.bridge',
          'ledger.connectedDevice',
          'ledger.dmk',
          'ledger.discoveredDevices',
        ],
      },
    }),
});

export default store;
