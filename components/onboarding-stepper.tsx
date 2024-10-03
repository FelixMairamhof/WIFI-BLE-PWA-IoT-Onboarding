"use client";

import { useEffect, useState } from "react";
import { Bluetooth, Wifi, Moon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
// Corrected hardcoded UUIDs for the service and characteristic (lowercase hex characters)
const SERVICE_UUID = "b2bbc642-ad5a-12ed-b878-0242ac120000";
const CHARACTERISTIC_UUID = "c9af9c76-ad5a-11ed-b879-0242ac120000";

export function OnboardingStepperComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedWifi, setSelectedWifi] = useState<string>("");
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [wifiPassword, setWifiPassword] = useState<string>("");
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [wifiNetworks, setWifiNetworks] = useState<{ ssid: string; rssi: number }[]>([]);
  
  const handleCharacteristicChanged = (event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value; // DataView containing the value

    if (value) {
        try {
            const decoder = new TextDecoder("utf-8");
            let decodedValue = decoder.decode(value.buffer); // Decode the DataView as UTF-8

            // Check if the value is Wi-Fi scan results or a status message
            if (decodedValue.startsWith("ALLWIFIS:")) {
                // Handle Wi-Fi scan results
                let jsonString = decodedValue.substring(9); // Remove the "ALLWIFIS:" prefix

                // Remove any extra data after "]}":
                const removeAfterEnd = (jsonString: string) => {
                    const endIndex = jsonString.indexOf(']}');
                    return endIndex !== -1 ? jsonString.slice(0, endIndex + 2) : jsonString;
                };

                jsonString = removeAfterEnd(jsonString);  // Apply the cleanup function
                console.log("Received Wi-Fi scan results:", jsonString);

                // Attempt to parse the JSON
                const parsedData = JSON.parse(jsonString);
                console.log("Parsed networks:", parsedData.wifiNetworks);
                setWifiNetworks(parsedData.wifiNetworks);  // Update the state with Wi-Fi networks
            } else if (decodedValue.startsWith("STATUS:")) {
                // Handle status messages
                let statusMessage = decodedValue.substring(7);
                if(statusMessage.includes("Failed")){
                  console.log(`Received status message: FAILED to connect to  ${selectedWifi}`);
                  toast({
                    title: "Connection Failed",
                    description: `Failed to connect to ${selectedWifi}`,
                    variant: "destructive", // Custom variant for error messages
                  });
                  
                }else{
                  console.log(`Received status message: CONNECTED to ${selectedWifi}`);
                  router.push("/app");
                }
              
            } else {
                console.log("Unknown message format:", decodedValue);
            }
        } catch (error) {
            console.error("Error decoding or parsing data:", error);
        }
    } else {
        console.log("No value received or characteristic is not set properly.");
    }
};



const writeToBluetoothDevice = async (gattServer: BluetoothRemoteGATTServer) => {
  try {
    const service = await gattServer.getPrimaryService(SERVICE_UUID);
    const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    // Step 1: Start notifications
    await characteristic.startNotifications();
    console.log("Notifications started");

    // Step 2: Set the event listener
    characteristic.oncharacteristicvaluechanged = handleCharacteristicChanged;
    console.log("Event listener added");

    // Step 3: Write the "scan" command to the characteristic
    const data = new TextEncoder().encode("SCAN");
    await characteristic.writeValue(data);
    console.log("Data written to Bluetooth device: SCAN");
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

  const sendWifiCredentials = async (gattServer: BluetoothRemoteGATTServer, ssid: string, password: string) => {
    try {
      const service = await gattServer.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
  
      // Prepare the connection string in the format: CONNECT:<SSID>:<PASSWORD>
      const connectionString = `CONNECT:${ssid}:${password}`;
  
      // Encode the connection string into a Uint8Array
      const data = new TextEncoder().encode(connectionString);
  
      // Write the Wi-Fi credentials to the characteristic
      await characteristic.writeValue(data);
      console.log("Wi-Fi connection string sent to Bluetooth device");
    } catch (error) {
      console.error("Error sending Wi-Fi credentials to Bluetooth device:", error);
    }
  };
  
  // Call this function when connecting to Wi-Fi
  const handleWifiConnect = async () => {
    if (bluetoothDevice && bluetoothDevice.gatt) {
      const gattServer = await bluetoothDevice.gatt.connect();
      setIsWifiModalOpen(false);
      await sendWifiCredentials(gattServer, selectedWifi, wifiPassword);
      setWifiPassword("");
    } else {
      alert("Bluetooth device is not connected.");
    }
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
                  {wifiNetworks.map((network, index) => (
                    <SelectItem
                      key={`${network.ssid}-${network.rssi}-${index}`} // Generate a unique key using ssid, rssi, and index
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
        <DialogContent className="bg-indigo-800 text-white scale-90 rounded-xl">
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
              Connect <ChevronRight className="ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}