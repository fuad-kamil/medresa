import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, RefreshCw, Check, Crop, Zap, ZapOff } from "lucide-react";
import Cropper from "react-easy-crop";

export default function WebcamCapture({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // Usually back camera has flash

  // Cropper states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  // Flash states
  const [flashSupported, setFlashSupported] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);

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
    setFlashSupported(false);
    setIsFlashOn(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: facing }, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check if torch is supported
      const track = stream.getVideoTracks()[0];
      // wait a moment before checking capabilities, some browsers need it
      setTimeout(() => {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          setFlashSupported(true);
        }
      }, 500);

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

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const enable = !isFlashOn;
    try {
      // Standard way to enable torch
      await track.applyConstraints({
        advanced: [{ torch: enable }]
      });
      setIsFlashOn(enable);
    } catch (err) {
      try {
        // Fallback for some older Android browsers
        await track.applyConstraints({
          torch: enable
        });
        setIsFlashOn(enable);
      } catch (err2) {
        console.error("Failed to toggle flash:", err2);
        alert(`Flash Error: ${err.message || err.name || 'Not supported'}.\n\nBrowsers do not ask for separate flash permission. If it fails, your browser restricts hardware flash control for web apps.`);
      }
    }
  };

  const takeSnapshot = async () => {
    // If flash is enabled, maybe ensure it's on just before snapshot if we want
    // But we let the user control the torch state manually

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

    // Stop video and turn off flash
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (isFlashOn && track.getCapabilities()?.torch) {
        await track.applyConstraints({ advanced: [{ torch: false }] }).catch(console.error);
        setIsFlashOn(false);
      }
      streamRef.current.getTracks().forEach(t => t.stop());
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
      const track = streamRef.current.getVideoTracks()[0];
      if (isFlashOn && track?.getCapabilities()?.torch) {
        track.applyConstraints({ advanced: [{ torch: false }] }).catch(console.error);
      }
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCaptured(null);
    setIsCropping(false);
    setError(null);
    setFlashSupported(false);
    setIsFlashOn(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-black/90 backdrop-blur-md">
      <div className="bg-[#1c1c1e] rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-800 overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
              {isCropping ? <Crop size={20} className="text-yellow-500" /> : <Camera size={20} className="text-yellow-500" />}
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {isCropping ? "Crop Photo" : "Capture Photo"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-black flex-1 min-h-[55vh] flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-center p-8">
              <p className="text-red-400 font-medium text-lg mb-4">{error}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-6 py-3 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700 transition"
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
                showGrid={true}
                cropShape="rect"
                classes={{ 
                  containerClassName: "w-full h-full",
                  cropAreaClassName: "border-2 border-yellow-500 rounded-lg shadow-[0_0_0_9999em_rgba(0,0,0,0.85)]",
                }}
              />
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Optional: Add a subtle overlay grid for the camera view */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-white"></div>
                <div className="border-r border-white"></div>
                <div></div>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-6 bg-[#1c1c1e] flex flex-col gap-5">
          {isCropping && captured ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 px-6">
                <span className="text-sm font-semibold text-gray-400">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="flex-1 accent-yellow-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={retake}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-700 transition"
                >
                  <RefreshCw size={20} />
                  Retake
                </button>
                <button
                  onClick={confirmCapture}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-yellow-500 text-black font-bold rounded-2xl hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 transition"
                >
                  <Check size={20} />
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-8 relative">
              <button
                onClick={toggleFlash}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition absolute left-0 ${
                  isFlashOn 
                    ? "bg-yellow-500 text-black" 
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
                title={isFlashOn ? "Turn Flash Off" : "Turn Flash On"}
              >
                {isFlashOn ? <Zap size={22} className="fill-current" /> : <ZapOff size={22} />}
              </button>
              
              <button
                onClick={takeSnapshot}
                disabled={!!error}
                className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 shadow-[0_0_0_6px_rgba(255,255,255,0.3)] transition disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
              >
                <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center bg-white" />
              </button>

              <button
                onClick={toggleCamera}
                className="w-14 h-14 bg-gray-800 text-gray-300 rounded-full flex items-center justify-center hover:bg-gray-700 hover:text-white transition absolute right-0"
                title="Switch Camera"
              >
                <RefreshCw size={22} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
