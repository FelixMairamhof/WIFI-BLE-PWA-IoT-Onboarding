// useStore.ts
import {create} from 'zustand';

interface State {
  currentStep: number;
  isScanning: boolean;
  selectedWifi: string;
  isWifiModalOpen: boolean;
  wifiPassword: string;
  bluetoothDevice: BluetoothDevice | null;
  gattServer: BluetoothRemoteGATTServer | null;
  wifiNetworks: { ssid: string }[];
  discoveredServiceUuid: string | null;
  discoveredCharacteristicUuid: string | null;
  setCurrentStep: (step: number) => void;
  setIsScanning: (isScanning: boolean) => void;
  setSelectedWifi: (wifi: string) => void;
  setIsWifiModalOpen: (isOpen: boolean) => void;
  setWifiPassword: (password: string) => void;
  setBluetoothDevice: (device: BluetoothDevice | null) => void;
  setGattServer: (server: BluetoothRemoteGATTServer | null) => void;
  setWifiNetworks: (networks: { ssid: string }[]) => void;
  setDiscoveredServiceUuid: (uuid: string | null) => void;
  setDiscoveredCharacteristicUuid: (uuid: string | null) => void;
}

export const useStore = create<State>((set) => ({
  currentStep: 0,
  isScanning: false,
  selectedWifi: "",
  isWifiModalOpen: false,
  wifiPassword: "",
  bluetoothDevice: null,
  gattServer: null,
  wifiNetworks: [],
  discoveredServiceUuid: null,
  discoveredCharacteristicUuid: null,
  setCurrentStep: (step) => set({ currentStep: step }),
  setIsScanning: (isScanning) => set({ isScanning }),
  setSelectedWifi: (wifi) => set({ selectedWifi: wifi }),
  setIsWifiModalOpen: (isOpen) => set({ isWifiModalOpen: isOpen }),
  setWifiPassword: (password) => set({ wifiPassword: password }),
  setBluetoothDevice: (device) => set({ bluetoothDevice: device }),
  setGattServer: (server) => set({ gattServer: server }),
  setWifiNetworks: (networks) => set({ wifiNetworks: networks }),
  setDiscoveredServiceUuid: (uuid) => set({ discoveredServiceUuid: uuid }),
  setDiscoveredCharacteristicUuid: (uuid) => set({ discoveredCharacteristicUuid: uuid }),
}));
