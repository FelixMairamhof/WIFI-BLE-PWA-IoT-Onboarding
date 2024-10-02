"use client";

import { useEffect, useState } from "react";
import { Bluetooth, Wifi, Moon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Corrected hardcoded UUIDs for the service and characteristic (lowercase hex characters)
const SERVICE_UUID = "b2bbc642-ad5a-12ed-b878-0242ac120000";
const CHARACTERISTIC_UUID = "c9af9c76-ad5a-11ed-b879-0242ac120000";

export function OnboardingStepperComponent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedWifi, setSelectedWifi] = useState<string>("");
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [wifiPassword, setWifiPassword] = useState<string>("");
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [wifiNetworks, setWifiNetworks] = useState<{ ssid: string }[]>([]);

  // Write the "scan" command to the connected Bluetooth device
  const writeToBluetoothDevice = async (gattServer: BluetoothRemoteGATTServer) => {
    try {
      const service = await gattServer.getPrimaryService(SERVICE_UUID); // Use hardcoded service UUID
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID); // Use hardcoded characteristic UUID

      const data = new TextEncoder().encode("scan"); // Convert "scan" string to Uint8Array
      await characteristic.writeValue(data); // Write the "scan" command to the Bluetooth device

      console.log("Data written to Bluetooth device: scan");
    } catch (error) {
      console.error("Error writing to Bluetooth device:", error);
    }
  };

  // Bluetooth scanning and connection
  const handleBluetoothScan = async () => {
    setIsScanning(true);

    // Check if Bluetooth API is available
    if (!navigator.bluetooth) {
      console.error("Bluetooth API not available");
      alert("Bluetooth API is not supported in your browser.");
      setIsScanning(false);
      return;
    }

    // Check if already connected to a device
    if (bluetoothDevice) {
      alert(`Already connected to: ${bluetoothDevice.name}. Please disconnect before scanning for new devices.`);
      setIsScanning(false);
      return; // Exit if already connected
    }

    try {
      // Request a Bluetooth device
      const device: BluetoothDevice = await navigator.bluetooth.requestDevice({
        optionalServices: [SERVICE_UUID],
        filters: [{ namePrefix: "MyESP" }] // Filter devices by name prefix "MyESP"
      });

      console.log("Device:", device);
      setBluetoothDevice(device); // Set Bluetooth device state

      if (device.gatt) {
        const server: BluetoothRemoteGATTServer = await device.gatt.connect();
        console.log("Connected to GATT Server:", server);

        // Write "scan" to the device immediately upon connection
        await writeToBluetoothDevice(server);

        // Move to the next step (Wi-Fi setup)
        setCurrentStep(1);
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
                      key={network.ssid} // Use SSID as a unique key
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
