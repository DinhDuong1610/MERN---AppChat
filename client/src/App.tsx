import { useEffect } from "react";
import { useAuth } from "./hooks/use-auth";
import AppRoutes from "./routes";
import { Spinner } from "./components/ui/spinner";
import Logo from "./components/logo";
import { useLocation } from "react-router-dom";
import { isAuthRoute } from "./routes/routes";
import { useVideoCall } from "@/hooks/use-video-call";

function App() {
  const { pathname } = useLocation();
  const { user, isAuthStatus, isAuthStatusLoading } = useAuth();
  const isAuth = isAuthRoute(pathname);
  const { initializePeer } = useVideoCall();

  useEffect(() => {
    if (isAuth) return;
    isAuthStatus();
  }, [isAuthStatus, isAuth]);

  useEffect(() => {
    if (user) {
      initializePeer();
    }
  }, [user, initializePeer]);

  if (isAuthStatusLoading && !user) {
    return (
      <div
        className="flex flex-col items-center
       justify-center h-screen
      "
      >
        <Logo imgClass="size-20" showText={false} />
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  return <AppRoutes />;
}

export default App;
