import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, RefreshCw, Check } from "lucide-react";

export default function WebcamCapture({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  const startCamera = useCallback(async (facing) => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCaptured(null);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Make sure DroidCam is running and camera permissions are allowed.");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode, startCamera]);

  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(dataUrl);

    // Stop video while reviewing
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const confirmCapture = () => {
    if (!captured) return;
    // Convert dataURL to File
    const arr = captured.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const file = new File([u8arr], `student_photo_${Date.now()}.jpg`, { type: mime });
    onCapture(file, captured);
    handleClose();
  };

  const retake = () => {
    setCaptured(null);
    startCamera(facingMode);
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCaptured(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
              <Camera size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Take Photo</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
          {error ? (
            <div className="text-center p-8">
              <p className="text-red-400 font-medium text-lg mb-4">{error}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : captured ? (
            <img src={captured} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-5 flex items-center justify-center gap-4">
          {captured ? (
            <>
              <button
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <RefreshCw size={20} />
                Retake
              </button>
              <button
                onClick={confirmCapture}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition"
              >
                <Check size={20} />
                Use This Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleCamera}
                className="w-14 h-14 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                title="Switch Camera"
              >
                <RefreshCw size={22} />
              </button>
              <button
                onClick={takeSnapshot}
                disabled={!!error}
                className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 shadow-xl shadow-emerald-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed ring-4 ring-emerald-200 dark:ring-emerald-900/50"
              >
                <Camera size={32} />
              </button>
              <div className="w-14 h-14" /> {/* Spacer for centering */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
