import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/gender")}
      >
        <Text style={styles.buttonText}>next page </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
  },
  button: {
    padding: 15,
    backgroundColor: "#000",
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});