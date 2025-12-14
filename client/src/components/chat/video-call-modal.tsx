import { useEffect, useRef } from "react";
import { useVideoCall } from "@/hooks/use-video-call";
import { Button } from "@/components/ui/button";
import {
    PhoneOff,
    Mic,
    MicOff,
    Video,
    VideoOff,
    User,
    Maximize2,
    Minimize2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";

const VideoCallModal = () => {
    const {
        isCallActive,
        localStream,
        remoteStream,
        endCall,
        toggleMic,
        toggleCamera,
        isMicOn,
        isCamOn
    } = useVideoCall();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isCamOn]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (!isCallActive) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-[9999] w-64 bg-background border rounded-lg shadow-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-5">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="font-semibold text-sm">Call in progress</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMinimized(false)}>
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-full h-full">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                        <Avatar className="h-32 w-32 border-4 border-zinc-800 animate-pulse">
                            <AvatarFallback className="text-4xl">?</AvatarFallback>
                        </Avatar>
                        <p className="mt-4 text-zinc-400 animate-pulse">Connecting...</p>
                    </div>
                )}
            </div>

            <div className="absolute top-4 right-4 w-32 sm:w-48 aspect-video bg-zinc-800 rounded-xl overflow-hidden border border-white/20 shadow-2xl transition-all hover:scale-105 z-10 group">
                {isCamOn ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover mirror-mode"
                        style={{ transform: "scaleX(-1)" }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <User className="h-8 w-8 text-zinc-500" />
                    </div>
                )}

                {!isMicOn && (
                    <div className="absolute bottom-2 right-2 bg-red-500/80 p-1 rounded-full">
                        <MicOff className="w-3 h-3 text-white" />
                    </div>
                )}
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 text-white hover:bg-white/20 rounded-full z-10"
                onClick={() => setIsMinimized(true)}
            >
                <Minimize2 className="h-6 w-6" />
            </Button>

            <div className="absolute bottom-8 z-20 flex items-center gap-4 px-6 py-3 bg-zinc-900/60 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
                <Button
                    variant={isMicOn ? "secondary" : "destructive"}
                    size="icon"
                    className={cn(
                        "w-12 h-12 rounded-full transition-all duration-300",
                        isMicOn ? "bg-white/10 hover:bg-white/20 text-white" : ""
                    )}
                    onClick={toggleMic}
                >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                    variant="destructive"
                    size="icon"
                    className="w-16 h-16 rounded-full shadow-lg hover:scale-110 transition-transform"
                    onClick={endCall}
                >
                    <PhoneOff className="h-8 w-8" />
                </Button>

                <Button
                    variant={isCamOn ? "secondary" : "destructive"}
                    size="icon"
                    className={cn(
                        "w-12 h-12 rounded-full transition-all duration-300",
                        isCamOn ? "bg-white/10 hover:bg-white/20 text-white" : ""
                    )}
                    onClick={toggleCamera}
                >
                    {isCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
};

export default VideoCallModal;