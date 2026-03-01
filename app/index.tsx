import { useEffect } from "react";
import { useRouter } from "expo-router";
import SplashScreen from "../components/SplashScreen";
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/language");
    }, 1000); 

    return () => clearTimeout(timer);
  }, []);

  return <SplashScreen />;
}