import { useState } from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface AppInputProps extends TextInputProps {
  showPasswordToggle?: boolean;
}

export function AppInput({
  showPasswordToggle = false,
  secureTextEntry,
  style,
  ...props
}: AppInputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isSecure = showPasswordToggle ? !passwordVisible : secureTextEntry;

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        secureTextEntry={isSecure}
        placeholderTextColor="#777"
        selectionColor="#1677ff"
        cursorColor="#1677ff"
        caretHidden={false}
        style={[
          styles.input,
          showPasswordToggle && styles.inputWithPasswordButton,
          style,
        ]}
      />

      {showPasswordToggle && (
        <Pressable
          style={styles.passwordButton}
          onPress={() => setPasswordVisible((current) => !current)}
          hitSlop={8}
        >
          <Text style={styles.passwordButtonText}>
            {passwordVisible ? "Ocultar" : "Ver"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
  },

  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#111",
  },

  inputWithPasswordButton: {
    paddingRight: 78,
  },

  passwordButton: {
    position: "absolute",
    right: 4,
    top: 4,
    bottom: 4,
    minWidth: 66,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordButtonText: {
    color: "#1677ff",
    fontWeight: "700",
    fontSize: 14,
  },
});
