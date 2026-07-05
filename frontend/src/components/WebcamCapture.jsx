import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, RefreshCw, Check, Crop } from "lucide-react";
import Cropper from "react-easy-crop";

export default function WebcamCapture({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  // Cropper states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const startCamera = useCallback(async (facing) => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCaptured(null);
    setIsCropping(false);
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

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
      setError("Could not access camera. Make sure camera permissions are allowed.");
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

    const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
    setCaptured(dataUrl);
    setIsCropping(true);

    // Stop video while reviewing
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const canvas = document.createElement("canvas");
      const image = new Image();
      image.src = captured;
      
      await new Promise(resolve => { image.onload = resolve; });

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      return dataUrl;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const confirmCapture = async () => {
    if (!captured) return;
    
    let finalImage = captured;
    if (isCropping && croppedAreaPixels) {
      finalImage = await createCroppedImage();
    }

    if (!finalImage) return;

    // Convert dataURL to File
    const arr = finalImage.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const file = new File([u8arr], `student_photo_${Date.now()}.jpg`, { type: mime });
    onCapture(file, finalImage);
    handleClose();
  };

  const retake = () => {
    setCaptured(null);
    setIsCropping(false);
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
    setIsCropping(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
              {isCropping ? <Crop size={20} className="text-emerald-600 dark:text-emerald-400" /> : <Camera size={20} className="text-emerald-600 dark:text-emerald-400" />}
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {isCropping ? "Edit Photo" : "Take Photo"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-black flex-1 min-h-[50vh] flex items-center justify-center overflow-hidden">
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
          ) : isCropping && captured ? (
            <div className="absolute inset-0">
              <Cropper
                image={captured}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                classes={{ containerClassName: "w-full h-full" }}
              />
            </div>
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
        <div className="p-5 bg-white dark:bg-gray-900 flex flex-col gap-4">
          {isCropping && captured ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 px-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="flex-1 accent-emerald-600"
                />
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={retake}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <RefreshCw size={20} />
                  Retake Photo
                </button>
                <button
                  onClick={confirmCapture}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition"
                >
                  <Check size={20} />
                  Done Editing
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
