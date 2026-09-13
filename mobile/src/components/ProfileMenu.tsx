import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

interface ProfileMenuProps {
  visible: boolean;
  userName?: string;
  onClose: () => void;
  onMyVehicles: () => void;
  onProposals: () => void;
  onReviews: () => void;
  onSignOut: () => void;
}

export function ProfileMenu({
  visible,
  userName,
  onClose,
  onMyVehicles,
  onProposals,
  onReviews,
  onSignOut,
}: ProfileMenuProps) {
  const firstName = userName?.trim().split(" ")[0] || "Usuário";

  const initial = firstName.charAt(0).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.overlay} onPress={onClose} />

        <SafeAreaView style={styles.menu}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{firstName}</Text>

              <Text style={styles.userSubtitle}>Minha conta</Text>
            </View>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <MenuItem title="Meus anúncios" onPress={onMyVehicles} />

          <MenuItem title="Propostas recebidas" onPress={onProposals} />

          <MenuItem title="Avaliações" onPress={onReviews} />

          <View style={styles.divider} />

          <MenuItem title="Sair" onPress={onSignOut} danger />

          <View style={styles.brand}>
            <Text style={styles.brandName}>AutoCatira</Text>

            <Text style={styles.brandSubtitle}>
              Troque seu carro. Vá mais longe.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

interface MenuItemProps {
  title: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ title, onPress, danger = false }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.menuItemText, danger && styles.dangerText]}>
        {title}
      </Text>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },

  menu: {
    width: "82%",
    maxWidth: 360,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 22,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#e7f0ff",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 23,
    fontWeight: "800",
    color: "#1677ff",
  },

  userInfo: {
    flex: 1,
    marginLeft: 14,
  },

  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  userSubtitle: {
    marginTop: 3,
    fontSize: 14,
    color: "#777",
  },

  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    fontSize: 30,
    fontWeight: "300",
    color: "#222",
  },

  divider: {
    height: 1,
    backgroundColor: "#e6e6e6",
    marginVertical: 10,
  },

  menuItem: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  menuItemPressed: {
    opacity: 0.55,
  },

  menuItemText: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
  },

  arrow: {
    fontSize: 28,
    color: "#888",
  },

  dangerText: {
    color: "#c62828",
  },

  brand: {
    marginTop: "auto",
    marginBottom: 28,
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#f7f9fc",
    alignItems: "center",
  },

  brandName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1677ff",
  },

  brandSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
});
