import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, FaceDetector, DrawingUtils } from '@mediapipe/tasks-vision';

const CLAP_THRESHOLD = 0.15; // Normalized distance (0-1)
const OPEN_THRESHOLD = 0.3; // Distance to reset clap

export function useMediaPipe(videoElement, canvasElement, isActive = true) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [p1Score, setP1Score] = useState(0);
    const [p2Score, setP2Score] = useState(0);
    const [isSinglePlayer, setIsSinglePlayer] = useState(true);

    // Refs for mutable state
    const handLandmarkerRef = useRef(null);
    const faceDetectorRef = useRef(null);
    const requestRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);
    const lastClapState = useRef({ p1: 'OPEN', p2: 'OPEN' });

    const resetScores = useCallback(() => {
        setP1Score(0);
        setP2Score(0);
        lastClapState.current = { p1: 'OPEN', p2: 'OPEN' };
    }, []);

    useEffect(() => {
        const initMediaPipe = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "./wasm" // Relative path for GH Pages
                );

                handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "./models/hand_landmarker.task", // Relative path
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 4
                });

                // Make Face Detector Optional
                try {
                    faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: "./models/blaze_face_short_range.tflite",
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO"
                    });
                } catch (faceErr) {
                    console.warn("Face Detector failed to load (optional):", faceErr);
                }

                setIsLoaded(true);
            } catch (err) {
                console.error("Error initializing MediaPipe:", err);
                alert(`Failed to load AI models: ${err.message}`);
            }
        };

        initMediaPipe();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (handLandmarkerRef.current) handLandmarkerRef.current.close();
            if (faceDetectorRef.current) faceDetectorRef.current.close();
        };
    }, []);

    const detectClap = (handsData, playerSide) => {
        if (handsData.length < 2) return;

        const hand1 = handsData[0][0]; // Wrist
        const hand2 = handsData[1][0]; // Wrist

        const dist = Math.sqrt(
            Math.pow(hand1.x - hand2.x, 2) +
            Math.pow(hand1.y - hand2.y, 2)
        );

        const currentState = playerSide === 'p1' ? lastClapState.current.p1 : lastClapState.current.p2;

        if (currentState === 'OPEN' && dist < CLAP_THRESHOLD) {
            if (playerSide === 'p1') {
                setP1Score(s => s + 1);
                lastClapState.current.p1 = 'CLAPPED';
            } else {
                setP2Score(s => s + 1);
                lastClapState.current.p2 = 'CLAPPED';
            }
        } else if (currentState === 'CLAPPED' && dist > OPEN_THRESHOLD) {
            if (playerSide === 'p1') lastClapState.current.p1 = 'OPEN';
            else lastClapState.current.p2 = 'OPEN';
        }
    };

    const drawResults = (hands, faces, canvas) => {
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // MediaPipe DrawingUtils
        const drawingUtils = new DrawingUtils(ctx);

        // Draw Hands
        if (hands) {
            for (const landmarks of hands) {
                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
                drawingUtils.drawLandmarks(landmarks, { color: '#FF0000', lineWidth: 1, radius: 2 });
            }
        }

        // Draw Faces (Bounding Box)
        if (faces) {
            for (const detection of faces) {
                const { originX, originY, width, height } = detection.boundingBox;
                // Convert to pixel coordinates
                // FaceDetector returns normalized? No, it usually returns pixels if image is provided, 
                // but in VIDEO mode with detector it might be pixels relative to video frame.
                // We need to scale to canvas.
                // Actually FaceDetector detection.boundingBox is in pixel values if input is video element.

                // Wait, Canvas size might differ from Video internal size.
                // We should ensure coordinates match.
                // simple drawing:
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 3;
                // Note: boundingBox is typically un-mirrored?
                // Webcam is mirrored via CSS. Canvas is over it.
                // If we draw normally, it might align if canvas is also inverted or if we are careful.
                // MediaPipe results are usually normalized. HandLandmarker IS normalized.
                // FaceDetector... checking docs.
                // FaceDetector `boundingBox` is in pixels.

                // However, we are drawing on a canvas that overlays a mirrored video.
                // If the video is styled `transform: scaleX(-1)`, the visual video is flipped.
                // The coordinates we get from MediaPipe are based on the raw video stream (unflipped).
                // So if we draw on a canvas that is NOT flipped, we need to flip the X coordinates.

                // Simpler approach: Apply `transform: scaleX(-1)` to the canvas too!
                // In WebcamFeed.jsx, we have `mirrored={true}` on Webcam, which adds scaleX(-1).
                // We should add the same to the canvas.

                // For normalized landmarks (Hands), drawing utilities handle it if we passed a transform? 
                // No, standard drawing assumes 0,0 top left.
                // If we flip the canvas with CSS, then drawing "left" (from raw video) appears on "right", which matches the mirrored video "right".
                // That should work!

                ctx.strokeRect(originX, originY, width, height);

                // Draw label
                ctx.fillStyle = "#00FFFF";
                ctx.font = "16px Arial";
                ctx.fillText("Player Face", originX, originY - 10);
            }
        }

        ctx.restore();
    };

    const processVideo = useCallback(() => {
        if (!videoElement || !handLandmarkerRef.current || !isLoaded) return;

        if (videoElement.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = videoElement.currentTime;

            // Sync Canvas Size
            if (canvasElement) {
                if (canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;
                }
            }

            // Run detections
            const handResults = handLandmarkerRef.current.detectForVideo(videoElement, performance.now());
            let faceResults = [];
            if (faceDetectorRef.current) {
                const fr = faceDetectorRef.current.detectForVideo(videoElement, performance.now());
                if (fr.detections) faceResults = fr.detections;
            }

            // Visualization
            if (canvasElement) {
                drawResults(handResults.landmarks, faceResults, canvasElement);
            }

            if (isActive && handResults.landmarks) {
                // Game Logic...
                const p1Hands = [];
                const p2Hands = [];

                handResults.landmarks.forEach((landmarks) => {
                    const avgX = landmarks[0].x;
                    if (isSinglePlayer) {
                        p1Hands.push(landmarks);
                    } else {
                        if (avgX < 0.5) p1Hands.push(landmarks);
                        else p2Hands.push(landmarks);
                    }
                });

                detectClap(p1Hands, 'p1');
                if (!isSinglePlayer) detectClap(p2Hands, 'p2');
            }
        }

        requestRef.current = requestAnimationFrame(processVideo);
    }, [videoElement, canvasElement, isLoaded, isSinglePlayer, isActive]); // isSinglePlayer dep needed? Yes if we change visualization color maybe.

    useEffect(() => {
        if (videoElement && isLoaded) {
            requestRef.current = requestAnimationFrame(processVideo);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [processVideo, videoElement, isLoaded]);

    return { isLoaded, p1Score, p2Score, setP1Score, setP2Score, setIsSinglePlayer, resetScores };
}
