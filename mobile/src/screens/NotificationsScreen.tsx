import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";

import {
  getMyNotifications,
  INotification,
  markNotificationAsRead,
} from "../services/notificationService";

const ICONS: Record<string, string> = {
  NOVA_PROPOSTA: "📩",
  PROPOSTA_EM_NEGOCIACAO: "🤝",
  PROPOSTA_RECUSADA: "✖️",
  VENDA_CONCLUIDA: "🚗",
  NOVA_AVALIACAO: "⭐",
};

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [notifications, setNotifications] = useState<INotification[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [unavailable, setUnavailable] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getMyNotifications();

      setNotifications(data);
      setUnavailable(false);
    } catch (error) {
      console.log("Erro ao carregar notificações:", error);
      setUnavailable(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  function openRelatedScreen(item: INotification) {
    switch (item.type) {
      case "NOVA_PROPOSTA":
        if (item.vehicleId) {
          navigation.navigate("VehicleProposals", {
            vehicleId: item.vehicleId,
            vehicleTitle: item.vehicleTitle ?? "Propostas do veículo",
          });
        } else {
          navigation.navigate("ReceivedProposals");
        }
        break;

      case "PROPOSTA_EM_NEGOCIACAO":
      case "PROPOSTA_RECUSADA":
        navigation.navigate("MyProposals");
        break;

      case "VENDA_CONCLUIDA":
      case "NOVA_AVALIACAO":
        navigation.navigate("Reviews");
        break;
    }
  }

  function handlePress(item: INotification) {
    if (!item.readAt) {
      setNotifications((current) =>
        current.map((n) =>
          n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );

      markNotificationAsRead(item.id).catch((error) =>
        console.log("Erro ao marcar notificação como lida:", error),
      );
    }

    openRelatedScreen(item);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={notifications}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadNotifications();
          }}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Notificações</Text>

          <Text style={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
              : "Tudo em dia"}
          </Text>

          {unavailable && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                O serviço de notificações está indisponível no momento. Puxe a
                tela para baixo para tentar de novo.
              </Text>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        !unavailable ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>

            <Text style={styles.emptyText}>
              Você ainda não tem notificações. Elas aparecem aqui quando você
              recebe propostas, quando suas propostas são respondidas e quando
              uma venda é concluída.
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const unread = !item.readAt;

        return (
          <Pressable
            onPress={() => handlePress(item)}
            style={({ pressed }) => [
              styles.card,
              unread && styles.cardUnread,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.icon}>{ICONS[item.type] ?? "🔔"}</Text>

            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text
                  style={[styles.cardTitle, unread && styles.cardTitleUnread]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                {unread && <View style={styles.dot} />}
              </View>

              <Text style={styles.cardMessage}>{item.message}</Text>

              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  list: {
    flex: 1,
    backgroundColor: "#f5f6f8",
  },

  content: {
    padding: 16,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },

  header: {
    marginBottom: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
  },

  warning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff4e5",
    borderWidth: 1,
    borderColor: "#ffd59e",
  },

  warningText: {
    fontSize: 14,
    color: "#8a5300",
  },

  empty: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ececec",
  },

  cardUnread: {
    backgroundColor: "#eef5ff",
    borderColor: "#cfe2ff",
  },

  cardPressed: {
    opacity: 0.85,
  },

  icon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },

  cardBody: {
    flex: 1,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  cardTitleUnread: {
    fontWeight: "800",
    color: "#111",
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1677ff",
    marginLeft: 8,
  },

  cardMessage: {
    marginTop: 4,
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },

  cardDate: {
    marginTop: 6,
    fontSize: 12,
    color: "#888",
  },
});
