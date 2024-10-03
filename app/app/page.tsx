"use client";

import { useEffect, useState } from "react";
import { Moon, BarChart2 } from "lucide-react";

export default function SleepDataApp() {
  // Fake sleep data
  const [sleepData, setSleepData] = useState({
    totalSleep: "7h 45m",
    deepSleep: "2h 15m",
    lightSleep: "3h 30m",
    remSleep: "2h",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b p-2 from-gray-800 to-gray-900 text-white flex flex-col items-center justify-center">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Sleep Data</h1>
        <p className="text-lg text-gray-300">Your recent sleep metrics</p>
      </header>

      <main className="w-full max-w-md px-4 space-y-8">
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <Moon className="mx-auto h-16 w-16 text-indigo-400" />
          <h2 className="text-2xl font-semibold mt-4">Total Sleep</h2>
          <p className="text-3xl font-bold">{sleepData.totalSleep}</p>
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg p-6">
          <BarChart2 className="mx-auto h-12 w-12 text-purple-400" />
          <h2 className="text-xl font-semibold mt-4">Deep Sleep</h2>
          <p className="text-2xl font-bold">{sleepData.deepSleep}</p>
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg p-6">
          <BarChart2 className="mx-auto h-12 w-12 text-blue-400" />
          <h2 className="text-xl font-semibold mt-4">Light Sleep</h2>
          <p className="text-2xl font-bold">{sleepData.lightSleep}</p>
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg p-6">
          <BarChart2 className="mx-auto h-12 w-12 text-pink-400" />
          <h2 className="text-xl font-semibold mt-4">REM Sleep</h2>
          <p className="text-2xl font-bold">{sleepData.remSleep}</p>
        </div>
      </main>

      <footer className="mt-12 text-gray-400">
        <p>Data from your connected device.</p>
      </footer>
    </div>
  );
}
