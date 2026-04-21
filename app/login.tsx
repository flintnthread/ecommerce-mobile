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
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Checkbox } from "expo-checkbox";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../lib/language";

export default function Login() {

  const router = useRouter();
  const { tr } = useLanguage();

  const [isChecked, setChecked] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/;

  const handleSignIn = async () => {

    if (loading) return;

    const value = inputValue.trim();

    if (!value) {
      Alert.alert(tr("Error"), tr("Please enter Email or Mobile Number"));
      return;
    }

    if (!emailRegex.test(value) && !mobileRegex.test(value)) {
      Alert.alert(tr("Invalid Input"), tr("Enter valid Email or 10-digit Mobile Number"));
      return;
    }

    if (!isChecked) {
      Alert.alert(tr("Error"), tr("Please accept terms & conditions"));
      return;
    }

    try {

      setLoading(true);

      const payload = emailRegex.test(value)
        ? { email: value }
        : { mobile: value };

      const response = await api.post("/auth/send-otp", payload);

      const data = response.data;

      if (data) {

        Alert.alert(
          tr("OTP Sent"),
          emailRegex.test(value)
            ? tr("OTP sent to your email")
            : tr("OTP sent to your mobile")
        );

        router.push({
          pathname: "/otpsection",
          params: {
            input: value
          }
        });

      } else {
        Alert.alert(tr("Error"), tr("Failed to send OTP"));
      }

    } catch (error) {

      console.log("API Error:", error?.response || error);

      if (error?.response?.data?.message) {
        Alert.alert(tr("Error"), tr(error.response.data.message));
      } else {
        Alert.alert(tr("Error"), tr("Server not reachable"));
      }

    } finally {
      setLoading(false);
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

      <Text style={styles.welcome}>{tr("welcome back 👋")}</Text>
      <Text style={styles.signIn}>{tr("Sign In or create account")}</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#888" />

        <TextInput
          placeholder={tr("Email or Mobile Number")}
          value={inputValue}
          onChangeText={(text) => setInputValue(text.replace(/\s/g, ""))}
          style={styles.input}
          keyboardType={mobileRegex.test(inputValue) ? "number-pad" : "email-address"}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.checkboxContainer}>

        <Checkbox
          value={isChecked}
          onValueChange={setChecked}
          color={isChecked ? "#E97A1F" : undefined}
        />

        <Text style={styles.checkboxText}>
          {tr("By continue you agree to flint & thread terms & conditions")}
          {" "}
          {tr("and along with privacy policy")}
        </Text>

      </View>

      <TouchableOpacity
        style={[styles.signButton, loading && { opacity: 0.6 }]}
        onPress={handleSignIn}
        disabled={loading}
      >

        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.signButtonText}>{tr("Sign in to continue")}</Text>
        }

      </TouchableOpacity>

      <View style={styles.createAccountRow}>
        <Text style={styles.newText}>{tr("New to FlintThread?")}</Text>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.createText}> {tr("Create an account")}</Text>
        </TouchableOpacity>

      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleLogin}
      >

        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/281/281764.png"
          }}
          style={styles.googleIcon}
        />

        <Text style={styles.googleText}>{tr("Continue with Google")}</Text>

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
});