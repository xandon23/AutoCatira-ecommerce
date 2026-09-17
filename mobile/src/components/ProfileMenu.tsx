import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

interface ProfileMenuProps {
  visible: boolean;
  userName?: string;
  onClose: () => void;
  onMyVehicles: () => void;
  onProposals: () => void;
  onReviews: () => void;
  onSignOut: () => void;
  onNegotiations: () => void;
  onMyProposals: () => void;
  onSoldVehicles: () => void;
  isAdmin: boolean;
  onAdmin: () => void;
}

export function ProfileMenu({
  visible,
  userName,
  onClose,
  onMyVehicles,
  onProposals,
  onReviews,
  onSignOut,
  onNegotiations,
  onMyProposals,
  onSoldVehicles,
  isAdmin,
  onAdmin,
}: ProfileMenuProps) {
  const firstName = userName?.trim().split(" ")[0] || "Usuário";

  const initial = firstName.charAt(0).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.overlay} onPress={onClose} />

        <SafeAreaView style={styles.menu} edges={["top"]}>
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

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>VEÍCULOS</Text>

            <MenuItem title="Meus anúncios" onPress={onMyVehicles} />

            <MenuItem title="Veículos vendidos" onPress={onSoldVehicles} />

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionLabel}>NEGOCIAÇÕES</Text>

            <MenuItem title="Propostas recebidas" onPress={onProposals} />

            <MenuItem title="Minhas propostas" onPress={onMyProposals} />

            <MenuItem title="Negociações" onPress={onNegotiations} />

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionLabel}>CONTA</Text>

            <MenuItem title="Avaliações" onPress={onReviews} />

            {isAdmin && <MenuItem title="Administração" onPress={onAdmin} />}

            <View style={styles.sectionDivider} />

            <MenuItem title="Sair" onPress={onSignOut} danger />

            <View style={styles.brand}>
              <Image
                source={require("../../assets/autocatira-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />

              <Text style={styles.brandSubtitle}>
                Troque seu carro. Vá mais longe.
              </Text>
            </View>
          </ScrollView>
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
    paddingVertical: 18,
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
    marginBottom: 12,
  },

  menuItem: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    borderRadius: 10,
  },

  menuItemPressed: {
    backgroundColor: "#f2f4f7",
  },

  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  arrow: {
    fontSize: 24,
    color: "#aaa",
  },

  dangerText: {
    color: "#c62828",
  },

  brand: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
  },

  brandSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },

  logoImage: {
    width: 220,
    height: 70,
    marginBottom: -16,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 12,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 6,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginVertical: 8,
  },
});
