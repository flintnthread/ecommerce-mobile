import React, { useState } from "react";
import api from "../services/api";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Checkbox } from "expo-checkbox";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Login() {
  const router = useRouter();
  const [isChecked, setChecked] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const navigation = useNavigation();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/;

  const handleSignIn = async () => {
  if (!inputValue) {
    Alert.alert("Error", "Please enter Email or Mobile Number");
    return;
  }

  if (!emailRegex.test(inputValue) && !mobileRegex.test(inputValue)) {
    Alert.alert(
      "Invalid Input",
      "Enter valid Email or 10-digit Mobile Number"
    );
    return;
  }

  if (!isChecked) {
    Alert.alert("Error", "Please accept terms & conditions");
    return;
  }

  try {
    const payload = emailRegex.test(inputValue)
      ? { email: inputValue }
      : { mobile: inputValue };

    const response = await api.post("/auth/send-otp", payload);
    const data = response.data;

    if (data.success) {
      Alert.alert("Success", "OTP sent successfully");

      // ✅ PASS OTP via query (NO pathname error)
router.push({
  pathname: "/otpsection",
  params: {
    input: inputValue,
    otp: data.otp?.toString(), // 👈 ensure string
  },
} as any);
    } else {
      Alert.alert("Error", data.message || "Something went wrong");
    }
  } catch (error) {
    console.log("API Error:", error?.response || error);
    Alert.alert("Error", "Server not reachable");
  }
};

  const handleGoogleLogin = async () => {
    await WebBrowser.openBrowserAsync("https://accounts.google.com");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/fntfav.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.welcome}>welcome back 👋</Text>
      <Text style={styles.signIn}>Sign In or create account </Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#888" />
        <TextInput
          placeholder="Email or Mobile Number"
          value={inputValue}
          onChangeText={setInputValue}
          style={styles.input}
          keyboardType="default"
        />
      </View>

      <View style={styles.checkboxContainer}>
        <Checkbox
          value={isChecked}
          onValueChange={setChecked}
          color={isChecked ? "#E97A1F" : undefined}
        />
        <Text style={styles.checkboxText}>
          By continue you agree to flint & thread terms & conditions
          and along with privacy policy
        </Text>
      </View>

      <TouchableOpacity style={styles.signButton} onPress={handleSignIn}>
        <Text style={styles.signButtonText}>Sign in to continue</Text>
      </TouchableOpacity>

      <View style={styles.createAccountRow}>
        <Text style={styles.newText}>New to FlintThread?</Text>
        <TouchableOpacity
  style={styles.createBtn}
   onPress={() => router.push("/login")}
>
  <Text style={styles.createText}>Create an account</Text>
</TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleLogin}
      >
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/281/281764.png",
          }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 25,
    paddingTop: 60,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
  },
  welcome: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  signIn: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginLeft: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    color: "#555",
  },
  signButton: {
    backgroundColor: "#E97A1F",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 25,
  },
  signButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  createAccountRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25,
  },
  newText: {
    color: "#777",
  },
  createText: {
    color: "#000",
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: "#fff",
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleText: {
    fontWeight: "500",
  },

  createBtn: {
  marginTop: -10,
  
  paddingVertical: 12,
  paddingHorizontal: 15,
  borderRadius: 8,
  alignItems: "center",
},
});