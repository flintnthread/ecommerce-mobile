import React, { useRef, useState } from "react";
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
  const { phone } = useLocalSearchParams();
  const router = useRouter();

  const [otp, setOtp] = useState(["", "", "", ""]);

  const inputs = useRef<Array<TextInput | null>>([]);

  const maskValue = (value: string | string[] | undefined) => {
    if (!value || typeof value !== "string") return "";

    if (value.includes("@")) {
      const [name, domain] = value.split("@");
      const visible = name.slice(0, 3);
      return `${visible}***@${domain}`;
    }

    return `******${value.slice(-3)}`;
  };

  const handleChange = (text: string, index: number) => {
    if (!/^[0-9]?$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length < 4) {
      Alert.alert("Error", "Please enter complete OTP");
      return;
    }

    // ✅ Since backend not ready, accept any 4-digit OTP
    Alert.alert("Success", "Login Successful");

    // ✅ Correct navigation path
    router.replace("/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>

      <Text style={styles.subtitle}>
        For your security, we have sent the code to{"\n"}
        <Text style={styles.boldText}>{maskValue(phone)}</Text>
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={styles.otpBox}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
        <Text style={styles.verifyText}>Verify</Text>
      </TouchableOpacity>

      <Text style={styles.resendText}>Didn’t receive code?</Text>
      <TouchableOpacity>
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginVertical: 20,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "600",
    color: "#000",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 30,
  },
  otpBox: {
    width: 55,
    height: 55,
    backgroundColor: "#ddd",
    textAlign: "center",
    fontSize: 20,
    borderRadius: 8,
    marginHorizontal: 8,
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
    color: "#ff6b6b",
    fontSize: 13,
  },
  resendLink: {
    color: "#4b2be3",
    marginTop: 8,
    fontWeight: "600",
  },
});