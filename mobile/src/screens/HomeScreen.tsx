import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { useAuth } from "../contexts/AuthContext";

export function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AutoCatira</Text>

      <Text style={styles.text}>Olá, {user?.name}!</Text>

      <Text style={styles.text}>Perfil: {user?.role}</Text>

      <AppButton title="Sair" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
  },

  text: {
    fontSize: 18,
  },
});
