import Image from "next/image";

export default function Maintenance() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center p-12 bg-white shadow-lg rounded-xl max-w-md mx-4 border border-gray-200">
        <div className="mb-6 flex justify-center">
          <Image
            src="/cgm-logo.png"
            alt="Caragon General Merchandise Logo"
            width={100}
            height={100}
            className="rounded-md"
            priority
          />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Maintenance Mode
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Our system is currently under maintenance. We&apos;re working hard to
          improve your experience.
        </p>
        <p className="text-sm text-gray-500">
          Please check back later. Thank you for your patience.
        </p>
      </div>
    </div>
  );
}
