import React, { useEffect, useRef, useState } from "react";
import { sendOtp, verifyOtp } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
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

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);

const inputs = useRef<(TextInput | null)[]>([]);
  const hiddenInput = useRef<any>(null);

  useEffect(() => {
    setTimeout(() => {
      inputs.current[0]?.focus();
      hiddenInput.current?.focus();
    }, 300);
  }, []);

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
      Alert.alert("Error", "Please enter complete OTP");
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

        // DIRECT HOME PAGE
        router.replace("/home");
        return;
      } else {
        Alert.alert("Error", data?.message || "Invalid OTP");
      }
    } catch (error: any) {
      console.log("Verify OTP Error:", error);
      Alert.alert("Error", "OTP verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // RESEND OTP
  const handleResend = async () => {
    try {
      const payload = userInput.includes("@")
        ? { email: userInput }
        : { mobile: userInput };

      await sendOtp(payload);

      Alert.alert("Success", "OTP resent successfully");

      setOtp(["", "", "", "", "", ""]);

      inputs.current.forEach((input) => input?.clear());
      inputs.current[0]?.focus();
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP");
    }
  };

  return (
    <View style={styles.container}>
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

      <TouchableOpacity onPress={handleResend}>
        <Text style={styles.resendLink}>Resend</Text>
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
});