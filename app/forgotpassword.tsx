import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (value.trim() === "") {
      setEmailError("Email is required");
      return false;
    }

    if (!emailRegex.test(value)) {
      setEmailError("Enter a valid email address");
      return false;
    }

    setEmailError("");
    return true;
  };

  const handleSubmit = () => {
    if (validateEmail(email)) {
      alert("Reset instructions sent to your email");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.leftBg} />
      <View style={styles.rightBg} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Ionicons name="lock-closed-outline" size={50} color="#f07c16" />

          <Text style={styles.title}>Forgot Password?</Text>

          <Text style={styles.subtitle}>
            Enter your registered email address. We will send password reset instructions.
          </Text>

          <View style={styles.labelRow}>
            <MaterialIcons name="email" size={18} color="#6e7f99" />
            <Text style={styles.label}>Email Address *</Text>
          </View>

          <TextInput
            style={[styles.input, emailError ? styles.errorInput : null]}
            placeholder="Enter your registered email address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              validateEmail(text);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}

          <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
            <Text style={styles.btnText}>Send Reset Instructions</Text>
          </TouchableOpacity>

          <Text style={styles.remember}>Remember your password?</Text>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push("/sellerlogin")}
          >
            <Ionicons name="arrow-back" size={18} color="#f07c16" />
            <Text style={styles.backText}> Back to Login</Text>
          </TouchableOpacity>

          <Text style={styles.help}>Need Help?</Text>
          <Text style={styles.helpText}>Email: support@flintnthread.in</Text>
          <Text style={styles.helpText}>Phone: +91 9063499092</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  leftBg: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "0%",
    backgroundColor: "#b45b10",
  },

  rightBg: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "0%",
    backgroundColor: "#d2ae84",
  },

  scroll: {
    flexGrow: 1,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 0,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 10,
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginVertical: 12,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 10,
  },

  label: {
    marginLeft: 6,
    fontWeight: "600",
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },

  errorInput: {
    borderColor: "red",
  },

  errorText: {
    alignSelf: "flex-start",
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },

  btn: {
    width: "100%",
    backgroundColor: "#ff7a00",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  remember: {
    marginTop: 16,
    color: "#555",
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff7a00",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },

  backText: {
    color: "#ff7a00",
    fontWeight: "600",
  },

  help: {
    marginTop: 20,
    fontWeight: "700",
  },

  helpText: {
    color: "#666",
  },
});