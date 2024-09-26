"use client";

import { useEffect, useState } from "react";
import { Bluetooth, Wifi, Moon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function OnboardingStepperComponent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedWifi, setSelectedWifi] = useState<string>("");
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [wifiPassword, setWifiPassword] = useState<string>("");
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [gattServer, setGattServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [wifiNetworks, setWifiNetworks] = useState<{ ssid: string }[]>([]);

  // Add state to hold discovered service and characteristic UUIDs
  const [discoveredServiceUuid, setDiscoveredServiceUuid] = useState<string | null>(null);
  const [discoveredCharacteristicUuid, setDiscoveredCharacteristicUuid] = useState<string | null>(null);

  // Function to discover and log services and characteristics dynamically
  const discoverServicesAndCharacteristics = async (gattServer: BluetoothRemoteGATTServer) => {
    try {
      let localServiceUuid: string | null = null;
      let localCharacteristicUuid: string | null = null;

      // Get all primary services available on the device
      const services = await gattServer.getPrimaryServices();

      for (const service of services) {
        console.log(`Service UUID: ${service.uuid}`);
        localServiceUuid = service.uuid; // Store the service UUID in a local variable

        // Get all characteristics for the current service
        const characteristics = await service.getCharacteristics();
        for (const characteristic of characteristics) {
          console.log(`Characteristic UUID: ${characteristic.uuid}`);
          localCharacteristicUuid = characteristic.uuid; // Store the characteristic UUID in a local variable
          break; // Assuming you only want the first service/characteristic pair
        }

        if (localServiceUuid && localCharacteristicUuid) {
          setDiscoveredServiceUuid(localCharacteristicUuid);
          setDiscoveredCharacteristicUuid(localCharacteristicUuid);
          // Return found UUIDs only when both are available
          return { localCharacteristicUuid, localServiceUuid };
        }
      }

      // If no services/characteristics found, return nulls
      return { localCharacteristicUuid: null, localServiceUuid: null };
    } catch (error) {
      console.error("Error discovering services and characteristics:", error);
      return { localCharacteristicUuid: null, localServiceUuid: null }; // Handle errors
    }
  };

  const writeToBluetoothDevice = async (
    dataToWrite: string,
    gattServer: BluetoothRemoteGATTServer,
    serviceUuid: string | null,
    characteristicUuid: string | null
  ) => {
    if (!gattServer) {
      console.error("No GATT server connected");
      return;
    }

    if (!serviceUuid || !characteristicUuid) {
      console.error("Service or Characteristic UUID is missing");
      return;
    }

    try {
      const service = await gattServer.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);

      const data = new TextEncoder().encode(dataToWrite); // Convert string to Uint8Array
      await characteristic.writeValue(data);

      console.log("Data written to Bluetooth device:", dataToWrite);
    } catch (error) {
      console.error("Error writing to Bluetooth device:", error);
    }
  };

  const handleBluetoothScan = async () => {
    // Start scanning state
    setIsScanning(true);
    // Check if Bluetooth API is available
    if (!navigator.bluetooth) {
      console.error("Bluetooth API not available");
      alert("Bluetooth API is not supported in your browser.");
      setIsScanning(false);
      return;
    }
  
    // Check if already connected to a device
    if (gattServer && bluetoothDevice) {
      alert(`Already connected to: ${bluetoothDevice.name}. Please disconnect before scanning for new devices.`);
      setIsScanning(false);
      return; // Exit the function if already connected
    }
  
    try {
      
      // Request a new Bluetooth device
      const device: BluetoothDevice = await navigator.bluetooth.requestDevice({
        // acceptAllDevices: true,
        filters: [
          {namePrefix: "MyESP"}
        ]
      });
  
      console.log("Device:", device);
      setBluetoothDevice(device); // Update Bluetooth device state
  
      if (device.gatt) {
        const server: BluetoothRemoteGATTServer = await device.gatt.connect();
        console.log("Connected to GATT Server:", server);
        setGattServer(server);
  
        // Discover services and characteristics
        const { localCharacteristicUuid, localServiceUuid } = await discoverServicesAndCharacteristics(server);
  
        // Proceed only if both UUIDs are found
        if (localServiceUuid && localCharacteristicUuid) {
          await writeToBluetoothDevice("scan", server, localServiceUuid, localCharacteristicUuid);
        } else {
          console.error("Could not find valid service or characteristic UUIDs.");
          alert("Could not find valid service or characteristic UUIDs.");
        }
        setCurrentStep(1); // Proceed to the next step
      } else {
        console.error("Device does not support GATT");
        alert("This device does not support GATT.");
      }
    } catch (error: any) {
      console.error("Bluetooth scan failed:", error);
      alert("Bluetooth scan failed: " + error.message);
    } finally {
      setIsScanning(false);
    }
  };
  

  // Handle Wi-Fi network selection
  const handleWifiSelect = (value: string) => {
    setSelectedWifi(value);
    setIsWifiModalOpen(true);
  };

  // Simulated Wi-Fi connection
  const handleWifiConnect = () => {
    setTimeout(() => {
      setIsWifiModalOpen(false);
      alert("Connected successfully! Redirecting to homepage...");
      // Redirect logic can be added here
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Moon className="mx-auto h-12 w-12 text-indigo-200" />
          <h2 className="mt-6 text-3xl font-extrabold text-white">Sleep App Setup</h2>
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className={`w-1/2 h-1 ${currentStep >= 0 ? "bg-indigo-500" : "bg-gray-300"}`} />
            <div className={`w-1/2 h-1 ${currentStep >= 1 ? "bg-indigo-500" : "bg-gray-300"}`} />
          </div>

          {currentStep === 0 && (
            <div className="text-center space-y-6">
              <Bluetooth className="mx-auto h-16 w-16 text-indigo-300" />
              <Button
                onClick={handleBluetoothScan}
                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isScanning}
              >
                {isScanning ? "Scanning..." : "Scan for Devices"}
              </Button>
              {bluetoothDevice && <p className="text-white">Connected to: {bluetoothDevice.name}</p>}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <Wifi className="mx-auto h-16 w-16 text-indigo-300" />
              <Select onValueChange={handleWifiSelect}>
                <SelectTrigger className="w-full bg-blue-600 text-white border-blue-500 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent">
                  <SelectValue placeholder="Select Wi-Fi Network" />
                </SelectTrigger>
                <SelectContent className="bg-blue-700 text-white border-blue-600 rounded-md shadow-lg">
                  {wifiNetworks.map((network) => (
                    <SelectItem
                      key={network.ssid} // Ensure ssid is used as a unique identifier
                      value={network.ssid}
                      className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer"
                    >
                      {network.ssid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isWifiModalOpen} onOpenChange={setIsWifiModalOpen}>
        <DialogContent className="bg-indigo-800 text-white">
          <DialogHeader>
            <DialogTitle>Connect to {selectedWifi}</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Enter Wi-Fi password"
            value={wifiPassword}
            onChange={(e) => setWifiPassword(e.target.value)}
            className="bg-indigo-700 text-white placeholder-indigo-300"
          />
          <DialogFooter>
            <Button onClick={handleWifiConnect} className="bg-indigo-600 hover:bg-indigo-700">
              Connect <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
