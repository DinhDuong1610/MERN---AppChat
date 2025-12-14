import { create } from "zustand";
import Peer, { type MediaConnection } from "peerjs";
import { useSocket } from "./use-socket";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

interface VideoCallState {
    peer: Peer | null;
    myPeerId: string | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;

    isCallIncoming: boolean;
    isCallActive: boolean;
    incomingCallData: {
        senderId: string;
        senderName: string;
        peerId: string;
    } | null;

    isMicOn: boolean;
    isCamOn: boolean;

    initializePeer: () => void;
    startCall: (recipientId: string, recipientName: string) => void;
    acceptCall: () => void;
    rejectCall: () => void;
    endCall: () => void;

    toggleMic: () => void;
    toggleCamera: () => void;
}

export const useVideoCall = create<VideoCallState>((set, get) => ({
    peer: null,
    myPeerId: null,
    localStream: null,
    remoteStream: null,
    isCallIncoming: false,
    isCallActive: false,
    incomingCallData: null,

    isMicOn: true,
    isCamOn: true,

    initializePeer: () => {
        const { socket } = useSocket.getState();
        if (get().peer) return;

        const peer = new Peer();

        peer.on("open", (id) => {
            console.log("✅ My Peer ID:", id);
            set({ peer, myPeerId: id });
        });

        peer.on("call", (call: MediaConnection) => {
        });

        if (socket) {
            socket.on("call:incoming", (data) => {
                set({ isCallIncoming: true, incomingCallData: data });
            });

            socket.on("call:accepted", (data) => {
            });

            socket.on("call:ended", () => {
                toast.info("Call ended");
                get().endCall();
            });
        }
    },

    startCall: async (recipientId: string, recipientName: string) => {
        const { peer, myPeerId } = get();
        const { socket } = useSocket.getState();
        const { user } = useAuth.getState();

        if (!peer || !socket || !myPeerId) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            set({ localStream: stream, isCallActive: true, isMicOn: true, isCamOn: true });

            socket.emit("call:start", {
                recipientId,
                senderName: user?.name,
                peerId: myPeerId,
            });

            socket.once("call:accepted", (data) => {
                const call = peer.call(data.peerId, stream);
                call.on("stream", (remoteStream) => {
                    set({ remoteStream });
                });
            });

        } catch (error) {
            console.error("Failed to get local stream", error);
            toast.error("Could not access camera/microphone");
        }
    },

    acceptCall: async () => {
        const { peer, incomingCallData } = get();
        const { socket } = useSocket.getState();

        if (!peer || !incomingCallData || !socket) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            set({
                localStream: stream,
                isCallActive: true,
                isCallIncoming: false,
                isMicOn: true,
                isCamOn: true
            });

            socket.emit("call:accept", {
                callerId: incomingCallData.senderId,
                peerId: peer.id,
            });

            peer.on("call", (call) => {
                call.answer(stream);
                call.on("stream", (remoteStream) => {
                    set({ remoteStream });
                });
            });

        } catch (error) {
            console.error(error);
        }
    },

    endCall: () => {
        const { localStream, remoteStream, incomingCallData } = get();

        localStream?.getTracks().forEach((track) => track.stop());
        remoteStream?.getTracks().forEach((track) => track.stop());

        const socketInstance = useSocket.getState().socket;
        if (socketInstance && incomingCallData) {
            socketInstance.emit("call:end", { otherUserId: incomingCallData.senderId });
        }

        set({
            localStream: null,
            remoteStream: null,
            isCallActive: false,
            isCallIncoming: false,
            incomingCallData: null,
        });
    },

    rejectCall: () => {
        const { incomingCallData } = get();
        const socketInstance = useSocket.getState().socket;

        if (socketInstance && incomingCallData) {
            socketInstance.emit("call:end", { otherUserId: incomingCallData.senderId });
        }
        set({ isCallIncoming: false, incomingCallData: null });
    },

    toggleMic: () => {
        const { localStream, isMicOn } = get();
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = !isMicOn;
            });
            set({ isMicOn: !isMicOn });
        }
    },

    toggleCamera: () => {
        const { localStream, isCamOn } = get();
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => {
                track.enabled = !isCamOn;
            });
            set({ isCamOn: !isCamOn });
        }
    }
}));