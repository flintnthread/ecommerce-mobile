import React, { useEffect, useRef, useState } from "react";
import { sendOtp, verifyOtp } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useLanguage } from "../lib/language";

export const SHOW_POST_LOGIN_PROMO_KEY = "app:showPostLoginPromo";

export default function OTP() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { tr } = useLanguage();

  const userInput =
    typeof params.input === "string"
      ? params.input
      : Array.isArray(params.input)
      ? params.input[0]
      : "";
  const showSentToastParam =
    typeof params.showSentToast === "string"
      ? params.showSentToast
      : Array.isArray(params.showSentToast)
      ? params.showSentToast[0]
      : "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({
    visible: false,
    type: "success",
    message: "",
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resendSecondsParam =
    typeof params.resendSeconds === "string"
      ? Number(params.resendSeconds)
      : Array.isArray(params.resendSeconds)
      ? Number(params.resendSeconds[0])
      : NaN;
  const RESEND_COOLDOWN_SECONDS =
    Number.isFinite(resendSecondsParam) && resendSecondsParam > 0
      ? Math.floor(resendSecondsParam)
      : 60;
  const [resendCountdown, setResendCountdown] = useState(
    RESEND_COOLDOWN_SECONDS
  );

const inputs = useRef<(TextInput | null)[]>([]);
  const hiddenInput = useRef<any>(null);

  const showToast = (type: "success" | "error", message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ visible: true, type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2200);
  };

  useEffect(() => {
    setTimeout(() => {
      inputs.current[0]?.focus();
      hiddenInput.current?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showSentToastParam === "1") {
      showToast("success", "OTP sent successfully");
    }
  }, [showSentToastParam]);

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const maskValue = (value: string) => {
    if (!value) return "";

    if (value.includes("@")) {
      const [name, domain] = value.split("@");
      return `${name.slice(0, 3)}***@${domain}`;
    }

    return `******${value.slice(-3)}`;
  };

  const handleChange = (text: string, index: number) => {
    if (text.length === 6) {
      const otpArray = text.split("");
      setOtp(otpArray);

      otpArray.forEach((digit, i) => {
        inputs.current[i]?.setNativeProps({ text: digit });
      });

      return;
    }

    if (!/^[0-9]?$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleAutoFill = (text: string) => {
    if (text.length === 6) {
      const otpArray = text.split("");
      setOtp(otpArray);

      otpArray.forEach((digit, i) => {
        inputs.current[i]?.setNativeProps({ text: digit });
      });
    }
  };

  // VERIFY OTP
  const handleVerify = async () => {
    if (isVerifying) return;

    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      showToast("error", "Please enter complete OTP");
      return;
    }

    try {
      setIsVerifying(true);

      const payload = userInput.includes("@")
        ? { email: userInput, otp: enteredOtp }
        : { mobile: userInput, otp: enteredOtp };

      const data = await verifyOtp(payload);

      if (data?.success) {
        await AsyncStorage.setItem("token", data.token || "");
        await AsyncStorage.setItem(SHOW_POST_LOGIN_PROMO_KEY, "1");
        showToast("success", "OTP verified successfully");
        setTimeout(() => {
          router.replace("/home");
        }, 300);
        return;
      } else {
        showToast("error", data?.message || "Invalid OTP");
      }
    } catch (error: any) {
      console.log("Verify OTP Error:", error);
      showToast("error", "OTP verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // RESEND OTP
  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;

    try {
      setIsResending(true);
      const payload = userInput.includes("@")
        ? { email: userInput }
        : { mobile: userInput };

      await sendOtp(payload);

      showToast("success", "OTP resent successfully");

      setOtp(["", "", "", "", "", ""]);

      inputs.current.forEach((input) => input?.clear());
      inputs.current[0]?.focus();
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      showToast("error", "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      {toast.visible ? (
        <View
          style={[
            styles.toastContainer,
            toast.type === "success" ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}

      <Text style={styles.title}>Enter Verification Code</Text>

      <Text style={styles.subtitle}>
        We sent a code to{"\n"}
        <Text style={styles.boldText}>{maskValue(userInput)}</Text>
      </Text>

      <TextInput
        ref={hiddenInput}
        style={{ position: "absolute", opacity: 0 }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        onChangeText={handleAutoFill}
      />

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
ref={(ref: TextInput | null) => {
  inputs.current[index] = ref;
}}            style={styles.otpBox}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, isVerifying && { opacity: 0.6 }]}
        onPress={handleVerify}
        disabled={isVerifying}
      >
        <Text style={styles.verifyText}>
          {isVerifying ? "Verifying..." : "Verify"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.resendText}>Didn’t receive code?</Text>

      <TouchableOpacity
        onPress={handleResend}
        disabled={resendCountdown > 0 || isResending}
      >
        <Text
          style={[
            styles.resendLink,
            (resendCountdown > 0 || isResending) && styles.resendLinkDisabled,
          ]}
        >
          {isResending
            ? "Resending..."
            : resendCountdown > 0
            ? `Resend in ${formatCountdown(resendCountdown)}`
            : "Resend OTP"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingTop: 150,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 14,
    marginVertical: 20,
    color: "#666",
    textAlign: "center",
  },

  boldText: {
    fontWeight: "700",
    color: "#000",
  },

  otpContainer: {
    flexDirection: "row",
    marginVertical: 30,
  },

  otpBox: {
    width: 45,
    height: 45,
    backgroundColor: "#ddd",
    textAlign: "center",
    fontSize: 18,
    borderRadius: 8,
    marginHorizontal: 6,
  },

  verifyButton: {
    backgroundColor: "#4b2be3",
    paddingVertical: 14,
    paddingHorizontal: 80,
    borderRadius: 10,
    marginBottom: 20,
  },

  verifyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  resendText: {
    color: "#999",
    fontSize: 13,
  },

  resendLink: {
    color: "#4b2be3",
    marginTop: 8,
    fontWeight: "700",
  },
  resendLinkDisabled: {
    color: "#9d8ef2",
  },
  toastContainer: {
    position: "absolute",
    top: 70,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    zIndex: 50,
  },
  toastSuccess: {
    backgroundColor: "#16a34a",
  },
  toastError: {
    backgroundColor: "#dc2626",
  },
  toastText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
});