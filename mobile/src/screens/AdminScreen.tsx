import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../contexts/AuthContext";
import { getAdminUsers, updateUserRole } from "../services/adminService";
import { IUser, UserRole } from "../types";

export function AdminScreen() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<IUser[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getAdminUsers();

      setUsers(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          "Erro",
          error.response?.data?.error ||
            "Não foi possível carregar os usuários.",
        );
      } else {
        Alert.alert("Erro", "Ocorreu um erro inesperado.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadUsers();
  }

  async function changeRole(selectedUser: IUser, newRole: UserRole) {
    try {
      setUpdatingUserId(selectedUser.id);

      const updatedUser = await updateUserRole(selectedUser.id, newRole);

      setUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id
            ? {
                ...item,
                role: updatedUser.role,
              }
            : item,
        ),
      );

      Alert.alert(
        "Sucesso",
        `O perfil de ${selectedUser.name} foi alterado para ${newRole}.`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          "Erro",
          error.response?.data?.error || "Não foi possível alterar o perfil.",
        );

        return;
      }

      Alert.alert("Erro", "Ocorreu um erro inesperado.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  function confirmRoleChange(selectedUser: IUser) {
    const newRole: UserRole = selectedUser.role === "ADMIN" ? "USER" : "ADMIN";

    Alert.alert(
      "Alterar perfil",
      `Deseja alterar ${selectedUser.name} de ${selectedUser.role} para ${newRole}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: () => changeRole(selectedUser, newRole),
        },
      ],
    );
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>Acesso negado</Text>

        <Text style={styles.deniedText}>
          Esta área é exclusiva para administradores.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Carregando usuários...</Text>
      </View>
    );
  }

  const orderedUsers = [...users].sort((a, b) => {
    if (a.id === currentUser.id) return -1;
    if (b.id === currentUser.id) return 1;
    return 0;
  });

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={orderedUsers}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Administração</Text>

          <Text style={styles.subtitle}>
            Gerencie os perfis de acesso dos usuários cadastrados.
          </Text>

          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{users.length}</Text>

              <Text style={styles.summaryLabel}>Usuários</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {users.filter((item) => item.role === "ADMIN").length}
              </Text>

              <Text style={styles.summaryLabel}>Admins</Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const isCurrentUser = item.id === currentUser.id;

        const isUpdating = updatingUserId === item.id;

        return (
          <View style={styles.card}>
            <View style={styles.userHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.name}>
                  {item.name}
                  {isCurrentUser ? " (Você)" : ""}
                </Text>

                <Text style={styles.email}>{item.email}</Text>
              </View>

              <View
                style={[
                  styles.roleBadge,
                  item.role === "ADMIN" ? styles.adminBadge : styles.userBadge,
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    item.role === "ADMIN" ? styles.adminText : styles.userText,
                  ]}
                >
                  {item.role}
                </Text>
              </View>
            </View>

            {!isCurrentUser && (
              <Pressable
                disabled={isUpdating}
                style={[styles.roleButton, isUpdating && styles.disabled]}
                onPress={() => confirmRoleChange(item)}
              >
                <Text style={styles.roleButtonText}>
                  {isUpdating
                    ? "Atualizando..."
                    : item.role === "ADMIN"
                      ? "Alterar para USER"
                      : "Tornar ADMIN"}
                </Text>
              </Pressable>
            )}

            {isCurrentUser && (
              <Text style={styles.currentUserText}>
                Seu próprio perfil não pode ser alterado.
              </Text>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#666",
    lineHeight: 21,
  },

  summary: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  summaryItem: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  summaryNumber: {
    fontSize: 24,
    fontWeight: "800",
  },

  summaryLabel: {
    marginTop: 3,
    color: "#666",
  },

  card: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  userHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
  },

  userInfo: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  email: {
    marginTop: 3,
    fontSize: 13,
    color: "#666",
  },

  roleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  adminBadge: {
    backgroundColor: "#e7f0ff",
  },

  userBadge: {
    backgroundColor: "#eeeeee",
  },

  roleText: {
    fontSize: 11,
    fontWeight: "800",
  },

  adminText: {
    color: "#1677ff",
  },

  userText: {
    color: "#555",
  },

  roleButton: {
    marginTop: 15,
    height: 44,
    borderRadius: 9,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  roleButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  currentUserText: {
    marginTop: 13,
    fontSize: 13,
    color: "#777",
    fontStyle: "italic",
  },

  disabled: {
    opacity: 0.5,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
  },

  deniedTitle: {
    fontSize: 22,
    fontWeight: "800",
  },

  deniedText: {
    marginTop: 8,
    textAlign: "center",
    color: "#666",
  },

  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },

  emptyText: {
    color: "#666",
  },
});
