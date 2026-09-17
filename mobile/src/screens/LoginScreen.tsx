import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Image,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from "react-native";
import axios from "axios";

import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { useAuth } from "../contexts/AuthContext";

export function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Atenção", "Informe o e-mail e a senha.");

      return;
    }

    try {
      setLoading(true);

      await signIn(email.trim().toLowerCase(), password);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(
          "Falha no login:",
          error.response?.status,
          error.response?.data,
        );

        Alert.alert(
          "Erro no login",
          error.response?.data?.error ||
            error.response?.data?.message ||
            "E-mail ou senha inválidos.",
        );
      } else {
        console.log("Erro inesperado no login:", error);

        Alert.alert("Erro", "Ocorreu um erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../../assets/autocatira-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>Entre na sua conta</Text>

        <AppInput
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <AppInput
          placeholder="Senha"
          secureTextEntry
          showPasswordToggle
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <AppButton title="Entrar" onPress={handleLogin} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },

  logoImage: {
    width: 330,
    height: 105,
    alignSelf: "center",
    marginBottom: -16,
    marginHorizontal: -12,
  },

  subtitle: {
    fontSize: 17,
    textAlign: "center",
    marginBottom: 20,
  },
});
