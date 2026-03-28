import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [agree, setAgree] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [agreeError, setAgreeError] = useState("");

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

  const validatePassword = (value) => {
    if (value.trim() === "") {
      setPasswordError("Password is required");
      return false;
    }

    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleLogin = () => {
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);


    if (emailValid && passwordValid && agree) {
      router.push("/sellerdashboard");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftBg} />
      <View style={styles.rightBg} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          
          <Image
            source={require("../assets/images/f&tlogoFull.png")}
            style={styles.logo}
          />

          <Text style={styles.title}>Seller Login</Text>
          <View style={styles.underline} />

          <Text style={styles.subtitle}>
            Enter your email address and password to access your seller dashboard.
          </Text>

          <Text style={styles.label}>EMAIL *</Text>
          <TextInput
            placeholder="Enter your email"
            style={[styles.input, emailError ? styles.errorInput : null]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              validateEmail(text);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <Text style={styles.label}>PASSWORD *</Text>
          <View style={[styles.passwordBox, passwordError ? styles.errorInput : null]}>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry={!passwordVisible}
              style={{ flex: 1 }}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                validatePassword(text);
              }}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Ionicons
                name={passwordVisible ? "eye-off" : "eye"}
                size={22}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.rememberWrap}
              onPress={() => setRemember(!remember)}
            >
              <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                {remember && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.remember}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/forgotpassword")}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

       
           

         
<TouchableOpacity
  style={styles.loginBtn}
  onPress={() => router.push("/sellerdashboard")}
>
  <Text style={styles.loginText}>LOGIN</Text>
</TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text>Don't have a seller account? </Text>
            <TouchableOpacity onPress={() => router.push("/seller_register")}>
              <Text style={styles.register}>Register Now</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
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
    backgroundColor: "#b86113",
  },

  rightBg: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "0%",
    backgroundColor: "#d8b48a",
  },

  scroll: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 0,
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },

  logo: {
    width: 160,
    height: 60,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  underline: {
    width: 50,
    height: 3,
    backgroundColor: "#ff7a00",
    alignSelf: "center",
    marginVertical: 6,
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
  },

  label: {
    fontWeight: "600",
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },

  passwordBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },

  errorInput: {
    borderColor: "red",
  },

  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  rememberWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#999",
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxActive: {
    backgroundColor: "#ff7a00",
    borderColor: "#ff7a00",
  },

  remember: {
    color: "#555",
  },

  forgot: {
    color: "#ff7a00",
  },

  

  policyText: {
    flex: 1,
    color: "#666",
  },

  loginBtn: {
    backgroundColor: "#ff7a00",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },

  loginText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },

  register: {
    color: "#ff7a00",
    fontWeight: "600",
  },

  link: {
    color: "#ff7a00",
    fontWeight: "600",
  },
});