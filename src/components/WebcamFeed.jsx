import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw } from 'lucide-react';

const WebcamFeed = React.forwardRef(({ onVideoReady, onCanvasReady, showSkeleton = true }, ref) => {
    const webcamRef = useRef(null);
    const internalCanvasRef = useRef(null);
    const [cameraPermission, setCameraPermission] = useState(null);

    // Expose canvas ref to parent via ref
    React.useImperativeHandle(ref, () => ({
        canvas: internalCanvasRef.current
    }));

    // Notify parent when canvas is ready
    useEffect(() => {
        if (internalCanvasRef.current && onCanvasReady) {
            onCanvasReady(internalCanvasRef.current);
        }
    }, [onCanvasReady]);

    const videoConstraints = {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 }
    };

    const handleUserMedia = () => {
        setCameraPermission(true);
        if (webcamRef.current && webcamRef.current.video) {
            onVideoReady(webcamRef.current.video);
        }
    };

    const handleUserMediaError = (error) => {
        console.error("Webcam error:", error);
        setCameraPermission(false);
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
            {cameraPermission === false && (
                <div className="absolute z-50 text-center p-6 glass-panel">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-bold mb-2">Camera Access Denied</h3>
                    <p className="text-gray-400 mb-4">Please enable camera access to play.</p>
                </div>
            )}

            {cameraPermission === null && (
                <div className="absolute z-50 flex flex-col items-center animate-pulse text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                    <p>Initializing Camera...</p>
                </div>
            )}

            <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={true}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                className="w-full h-full object-cover"
                style={{ width: '100%', height: '100%' }}
            />

            {/* Canvas for Drawing Landmarks */}
            <canvas
                ref={internalCanvasRef}
                className={`absolute top-0 left-0 w-full h-full pointer-events-none scale-x-[-1] ${showSkeleton ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
});

export default WebcamFeed;
