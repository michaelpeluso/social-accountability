import { View, Text, StyleSheet } from "react-native";

export default function SignIn() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text>Auth stub - implementation pending</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
