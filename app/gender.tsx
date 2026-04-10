import React, { useEffect } from "react";
import { useRouter } from "expo-router";

/**
 * Kept for backward compatibility.
 * This project now uses the combined `genderage` screen.
 */
export default function GenderScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/genderage");
  }, [router]);

  return null;
}