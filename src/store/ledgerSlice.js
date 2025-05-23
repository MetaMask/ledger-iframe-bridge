import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bridge: null,
  dmk: null,
  isConnected: false,
  connectedDevice: null,
  sessionId: null,
  status: 'disconnected',
  actionState: null,
  deviceStatus: null,
  transportType: null,
  error: null,
  discoveredDevices: [],
  timeLeft: -1,
};

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    setBridge: (state, action) => {
      state.bridge = action.payload;
    },
    setDmk: (state, action) => {
      state.dmk = action.payload;
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload.isConnected;
      state.status = action.payload.status;
    },
    setConnectedDevice: (state, action) => {
      state.connectedDevice = action.payload;
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    setActionState: (state, action) => {
      state.actionState = action.payload;
    },
    setDeviceStatus: (state, action) => {
      state.deviceStatus = action.payload;
    },
    setTransportType: (state, action) => {
      state.transportType = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setDiscoveredDevices: (state, action) => {
      state.discoveredDevices = action.payload;
    },
    setTimeLeft: (state, action) => {
      state.timeLeft = action.payload;
    },
    resetLedgerState: (state) => {
      return {
        ...initialState,
        bridge: state.bridge, // Keep the bridge instance
        dmk: state.dmk, // Keep the dmk instance
      };
    },
  },
});

export const {
  setBridge,
  setDmk,
  setConnectionStatus,
  setConnectedDevice,
  setSessionId,
  setActionState,
  setDeviceStatus,
  setTransportType,
  setError,
  setDiscoveredDevices,
  setTimeLeft,
  resetLedgerState,
} = ledgerSlice.actions;

export default ledgerSlice.reducer;
