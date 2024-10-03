import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900 px-4 text-white">
      <h1 className="text-4xl font-bold mb-8">Welcome to the Sensor App</h1>
      <p className="text-lg mb-12">Easily onboard your sensor and get started!</p>
      <Link href="/onboarding">
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-full shadow-lg transition duration-300 ease-in-out">
          Onboard Sensor
        </button>
      </Link>
    </div>
  );
}
