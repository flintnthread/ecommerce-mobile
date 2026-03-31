import React, { useEffect, useRef, useState } from "react";
import api from "../services/api";
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

export default function OTP() {

  const params = useLocalSearchParams();
  const router = useRouter();

  const userInput =
    typeof params.input === "string"
      ? params.input
      : Array.isArray(params.input)
      ? params.input[0]
      : "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);

  const inputs = useRef([]);
  const hiddenInput = useRef(null);

  // focus first input + hidden autofill input
  useEffect(() => {

    setTimeout(() => {

      inputs.current[0]?.focus();

      hiddenInput.current?.focus();

    }, 300);

  }, []);

  // auto verify
  useEffect(() => {

    if (otp.every((d) => d !== "") && !isVerifying) {
      handleVerify();
    }

  }, [otp]);

  const maskValue = (value) => {

    if (!value) return "";

    if (value.includes("@")) {

      const [name, domain] = value.split("@");

      return `${name.slice(0, 3)}***@${domain}`;
    }

    return `******${value.slice(-3)}`;
  };

  const handleChange = (text, index) => {

    // paste full OTP
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

  const handleKeyPress = (key, index) => {

    if (key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }

  };

  // autofill handler
  const handleAutoFill = (text) => {

    if (text.length === 6) {

      const otpArray = text.split("");

      setOtp(otpArray);

      otpArray.forEach((digit, i) => {
        inputs.current[i]?.setNativeProps({ text: digit });
      });

    }

  };

  // verify OTP
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

      const response = await api.post("/auth/verify-otp", payload);

      const data = response.data;

      if (data && data.success) {

        await AsyncStorage.setItem("token", data.token);

        Alert.alert("Success", "Login Successful");

        router.replace("/home");

      } else {

        Alert.alert("Error", data.message || "Invalid OTP");
      }

    } catch (error) {

      console.log("Verify OTP Error:", error);

      if (error?.response?.data?.message) {

        Alert.alert("Error", error.response.data.message);

      } else {

        Alert.alert("Error", "OTP verification failed");
      }

    } finally {

      setIsVerifying(false);

    }

  };

  // resend OTP
  const handleResend = async () => {

    try {

      const payload = userInput.includes("@")
        ? { email: userInput }
        : { mobile: userInput };

      const response = await api.post("/auth/send-otp", payload);

      if (response.data) {

        Alert.alert("Success", "OTP resent successfully");

        setOtp(["", "", "", "", "", ""]);

        inputs.current.forEach((input) => input?.clear());

        inputs.current[0]?.focus();

      }

    } catch (error) {

      console.log("Resend Error:", error);

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

      {/* hidden autofill input */}
      <TextInput
        ref={hiddenInput}
        style={{ position: "absolute", opacity: 0 }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        onChangeText={handleAutoFill}
      />

      <View style={styles.otpContainer}>

        {otp.map((digit, index) => (

          <TextInput
            key={index}
            ref={(ref) => { inputs.current[index] = ref }}
            style={styles.otpBox}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            importantForAutofill="yes"
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
    fontSize: 20,
    fontWeight: "600",
  },

  subtitle: {
    fontSize: 14,
    marginVertical: 20,
    color: "#666",
    textAlign: "center",
  },

  boldText: {
    fontWeight: "600",
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
    fontWeight: "600",
  },

  resendText: {
    color: "#999",
    fontSize: 13,
  },

  resendLink: {
    color: "#4b2be3",
    marginTop: 8,
    fontWeight: "600",
  },

});