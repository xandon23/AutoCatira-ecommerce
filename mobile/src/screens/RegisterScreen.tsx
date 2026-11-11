import { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { registerUser } from "../services/userService";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function formatBirthDate(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    return digits
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2");
  }

  function convertBirthDateToApi(value: string) {
    const parts = value.split("/");

    if (parts.length !== 3) {
      return null;
    }

    const [day, month, year] = parts;

    if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
      return null;
    }

    const parsedDay = Number(day);
    const parsedMonth = Number(month);
    const parsedYear = Number(year);

    const date = new Date(parsedYear, parsedMonth - 1, parsedDay);

    if (
      date.getFullYear() !== parsedYear ||
      date.getMonth() !== parsedMonth - 1 ||
      date.getDate() !== parsedDay
    ) {
      return null;
    }

    return `${year}-${month}-${day}`;
  }

  async function handleRegister() {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !birthDate.trim() ||
      !cpf.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Atenção", "Preencha todos os campos.");

      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanCpf = cpf.replace(/\D/g, "");
    const apiBirthDate = convertBirthDateToApi(birthDate);

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      Alert.alert("Atenção", "Informe um telefone válido.");

      return;
    }

    if (cleanCpf.length !== 11) {
      Alert.alert("Atenção", "Informe um CPF válido.");

      return;
    }

    if (!apiBirthDate) {
      Alert.alert("Atenção", "Informe uma data de nascimento válida.");

      return;
    }

    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      Alert.alert(
        "Senha inválida",
        "A senha deve ter pelo menos 8 caracteres, contendo letras e números.",
      );

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Atenção", "As senhas não coincidem.");

      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      setLoading(true);

      await registerUser({
        name: name.trim(),
        email: normalizedEmail,
        phone: cleanPhone,
        birthDate: apiBirthDate,
        cpf: cleanCpf,
        password,
      });

      await signIn(normalizedEmail, password);

      Alert.alert("Conta criada!", "Seu cadastro foi realizado com sucesso.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(
          "Erro no cadastro:",
          error.response?.status,
          error.response?.data,
        );

        Alert.alert(
          "Não foi possível criar a conta",
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Verifique os dados informados.",
        );
      } else {
        console.log("Erro inesperado no cadastro:", error);

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
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../../assets/autocatira-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Text style={styles.title}>Crie sua conta</Text>

          <Text style={styles.subtitle}>
            Cadastre-se para anunciar veículos e realizar propostas.
          </Text>

          <AppInput
            placeholder="Nome completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <AppInput
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <AppInput
            placeholder="Telefone"
            value={phone}
            onChangeText={(value) => setPhone(formatPhone(value))}
            keyboardType="phone-pad"
            maxLength={15}
          />

          <AppInput
            placeholder="Data de nascimento (DD/MM/AAAA)"
            value={birthDate}
            onChangeText={(value) => setBirthDate(formatBirthDate(value))}
            keyboardType="numeric"
            maxLength={10}
          />

          <AppInput
            placeholder="CPF"
            value={cpf}
            onChangeText={(value) => setCpf(formatCpf(value))}
            keyboardType="numeric"
            maxLength={14}
          />

          <AppInput
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            showPasswordToggle
          />

          <Text style={styles.passwordHint}>
            Mínimo de 8 caracteres, contendo letras e números.
          </Text>

          <AppInput
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            showPasswordToggle
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <Pressable
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            disabled={loading}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Text>
          </Pressable>

          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            Já possui uma conta? Entrar
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 12,
  },

  logoImage: {
    width: 330,
    height: 105,
    alignSelf: "center",
    marginBottom: -16,
    marginHorizontal: -12,
  },

  title: {
    fontSize: 23,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
  },

  passwordHint: {
    fontSize: 12,
    color: "#777",
    marginTop: -5,
    marginBottom: 1,
  },

  registerButton: {
    height: 52,
    backgroundColor: "#1677ff",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loginLink: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1677ff",
    textAlign: "center",
    paddingVertical: 14,
  },
});
