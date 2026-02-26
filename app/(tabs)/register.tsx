import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "../../services/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!fullName || !email || !contact || !password || !confirmPassword) {
      Alert.alert("Error", "All required fields must be filled");
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Enter valid email address");
      return;
    }

    if (!phoneRegex.test(contact)) {
      Alert.alert("Error", "Enter valid 10-digit contact number");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      // Split full name into first and last name
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "";

      const response = await api.post("/api/auth/register", {
        firstName: firstName,
        lastName: lastName,
        mobile: contact,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      });

      Alert.alert("Success", response.data);
      router.push("/"); // go to login

    } catch (error: any) {
      if (error.response) {
        Alert.alert("Error", error.response.data);
      } else {
        Alert.alert("Error", "Network Error. Check backend connection.");
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create an account</Text>
      <View style={styles.underline} />

      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Contact Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your contact number"
        value={contact}
        onChangeText={setContact}
        keyboardType="numeric"
        maxLength={10}
      />

      <Text style={styles.label}>Password *</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter your password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Re-Password *</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm your password"
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Ionicons name={showConfirm ? "eye-off" : "eye"} size={22} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signupButton} onPress={handleRegister}>
        <Text style={styles.signupText}>SIGN UP</Text>
      </TouchableOpacity>

      <Text style={styles.loginText}>
        Already have an account?{" "}
        <Text
          style={{ color: "#d88c28", fontWeight: "bold" }}
          onPress={() => router.push("/")}
        >
          Sign In
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 30,
  },
  underline: {
    height: 4,
    width: 60,
    backgroundColor: "#d88c28",
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 15,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
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
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
  },
  signupButton: {
    backgroundColor: "#2c3e50",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
  },
  signupText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginText: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 40,
  },
});