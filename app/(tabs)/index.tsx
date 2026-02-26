import React, { useState } from "react";
import { useRouter } from "expo-router";
import api from "../../services/api";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      console.log("Sending login request...");

      const response = await api.post("/api/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });

      console.log("LOGIN RESPONSE:", response.data);

      // ✅ If backend returns plain text message
      const message =
        typeof response.data === "string"
          ? response.data
          : response.data?.message;

      if (message === "Login successful!") {
        Alert.alert("Success", "Login Successful ✅");

        // Navigate after success
        // router.replace("/home");

      } else if (message === "Invalid password!") {
        Alert.alert("Login Failed", "Invalid password ❌");

      } else if (message === "Seller not found!") {
        Alert.alert("Login Failed", "Seller not found ❌");

      } else {
        Alert.alert("Login Failed", message || "Something went wrong");
      }

    } catch (error: any) {
      console.log("LOGIN ERROR:", error?.response || error);

      if (error.response) {
        Alert.alert(
          "Login Failed",
          error.response?.data?.message ||
            error.response?.data ||
            "Invalid credentials ❌"
        );
      } else if (error.request) {
        Alert.alert(
          "Server Error",
          "Backend not reachable. Check server & port."
        );
      } else {
        Alert.alert("Error", "Something went wrong");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seller Login</Text>
      <View style={styles.underline} />

      <Text style={styles.subtitle}>
        Welcome back! Please sign in to your account.
      </Text>

      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password *</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter your password"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>LOGIN</Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Don’t have an account?{" "}
        <Text
          style={{ color: "#d88c28", fontWeight: "bold" }}
          onPress={() => router.push("/register")}
        >
          Sign Up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2c3e50",
  },
  underline: {
    height: 4,
    width: 60,
    backgroundColor: "#d88c28",
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 5,
  },
  subtitle: {
    textAlign: "center",
    color: "#777",
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
  },
  loginButton: {
    backgroundColor: "#2c3e50",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  signupText: {
    textAlign: "center",
    marginTop: 20,
    color: "#444",
  },
});