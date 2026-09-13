import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import { getImageUrl } from "../services/api";
import { getReceivedProposalVehicles } from "../services/proposalService";
import { IReceivedProposalVehicle } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ReceivedProposals">;

export function ReceivedProposalsScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = useState<IReceivedProposalVehicle[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await getReceivedProposalVehicles();

      setVehicles(data);
    } catch (error) {
      console.log("Erro ao carregar propostas recebidas:", error);

      Alert.alert("Erro", "Não foi possível carregar as propostas recebidas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [loadVehicles]),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadVehicles();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Carregando propostas...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={vehicles}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Propostas recebidas</Text>

          <Text style={styles.subtitle}>
            Anúncios que possuem propostas aguardando sua análise.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhuma proposta pendente</Text>

          <Text style={styles.emptyText}>
            Quando alguém fizer uma proposta em um dos seus anúncios, ela
            aparecerá aqui.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const imageUrl = getImageUrl(item.images?.[0]?.url);

        const proposalText =
          item.pendingProposalCount === 1
            ? "1 proposta pendente"
            : `${item.pendingProposalCount} propostas pendentes`;

        return (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => {
              Alert.alert(
                `${item.brand} ${item.model}`,
                "No próximo passo vamos abrir as propostas deste veículo.",
              );
            }}
          >
            {imageUrl ? (
              <Image
                source={{
                  uri: imageUrl,
                }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.image, styles.noImage]}>
                <Text style={styles.noImageText}>Sem foto</Text>
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={styles.titleRow}>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleTitle} numberOfLines={1}>
                    {item.brand} {item.model}
                  </Text>

                  <Text style={styles.year}>
                    {item.manufactureYear}/{item.modelYear}
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </View>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>{proposalText}</Text>
              </View>
            </View>
          </Pressable>
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
    marginBottom: 22,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
  },

  subtitle: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 21,
    color: "#666",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  cardPressed: {
    opacity: 0.7,
  },

  image: {
    width: "100%",
    height: 180,
  },

  noImage: {
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
  },

  noImageText: {
    color: "#777",
  },

  cardContent: {
    padding: 16,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  vehicleInfo: {
    flex: 1,
  },

  vehicleTitle: {
    fontSize: 19,
    fontWeight: "700",
  },

  year: {
    marginTop: 4,
    color: "#666",
  },

  arrow: {
    marginLeft: 10,
    fontSize: 30,
    color: "#777",
  },

  badge: {
    alignSelf: "flex-start",
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#e7f0ff",
  },

  badgeText: {
    fontWeight: "700",
    color: "#1677ff",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 80,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 21,
    color: "#666",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
  },
});
