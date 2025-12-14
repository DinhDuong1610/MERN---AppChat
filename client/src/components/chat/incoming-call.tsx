import { useVideoCall } from "@/hooks/use-video-call";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const IncomingCall = () => {
    const {
        isCallIncoming,
        incomingCallData,
        acceptCall,
        rejectCall
    } = useVideoCall();

    if (!isCallIncoming || !incomingCallData) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-80 shadow-2xl animate-in zoom-in-95 duration-200">
                <CardHeader className="items-center text-center pb-2">
                    <Avatar className="w-20 h-20 mb-4 animate-bounce">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                            {incomingCallData.senderName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl">{incomingCallData.senderName}</CardTitle>
                    <CardDescription className="text-green-600 font-medium animate-pulse">
                        Incoming Video Call...
                    </CardDescription>
                </CardHeader>

                <CardFooter className="flex justify-center gap-8 pt-4 pb-6">
                    <div className="flex flex-col items-center gap-1">
                        <Button
                            onClick={rejectCall}
                            variant="destructive"
                            size="icon"
                            className="w-14 h-14 rounded-full shadow-lg hover:scale-110 transition"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </Button>
                        <span className="text-xs text-muted-foreground">Decline</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <Button
                            onClick={acceptCall}
                            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:scale-110 transition"
                            size="icon"
                        >
                            <Phone className="w-6 h-6 animate-wiggle" />
                        </Button>
                        <span className="text-xs text-muted-foreground">Accept</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default IncomingCall;