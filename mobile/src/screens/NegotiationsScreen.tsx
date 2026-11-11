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
import { getNegotiations } from "../services/proposalService";
import { IProposal } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Negotiations">;

export function NegotiationsScreen({ navigation }: Props) {
  const [proposals, setProposals] = useState<IProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNegotiations = useCallback(async () => {
    try {
      const data = await getNegotiations();

      setProposals(data);
    } catch (error) {
      console.log("Erro ao carregar negociações:", error);

      Alert.alert("Erro", "Não foi possível carregar as negociações.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNegotiations();
    }, [loadNegotiations]),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadNegotiations();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Carregando negociações...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={proposals}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Negociações</Text>

          <Text style={styles.subtitle}>
            Acompanhe as propostas aceitas e em andamento.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhuma negociação ativa</Text>

          <Text style={styles.emptyText}>
            Quando você aceitar uma proposta, ela aparecerá aqui.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const target = item.targetVehicle;
        const offered = item.offeredVehicle;

        const targetImage = getImageUrl(target?.images?.[0]?.url);

        const cash = Number(item.cashOffer).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        return (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("NegotiationDetail", {
                proposalId: item.id,
              })
            }
          >
            {targetImage ? (
              <Image
                source={{ uri: targetImage }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.cardContent}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>EM NEGOCIAÇÃO</Text>
              </View>

              <Text style={styles.vehicleTitle}>
                {target ? `${target.brand} ${target.model}` : "Veículo"}
              </Text>

              {target ? (
                <Text style={styles.year}>
                  {target.manufactureYear}/{target.modelYear}
                </Text>
              ) : null}

              <Text style={styles.label}>Negociação com</Text>

              <Text style={styles.value}>
                {item.buyer?.name || "Comprador"}
              </Text>

              <Text style={styles.label}>Oferta</Text>

              <Text style={styles.offer}>
                {cash}
                {offered ? ` + ${offered.brand} ${offered.model}` : ""}
              </Text>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsText}>Ver detalhes</Text>

                <Text style={styles.arrow}>›</Text>
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
  },

  subtitle: {
    marginTop: 7,
    color: "#666",
    lineHeight: 21,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  image: {
    width: "100%",
    height: 150,
  },

  cardContent: {
    padding: 17,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#e7f0ff",
    marginBottom: 10,
  },

  statusText: {
    color: "#1677ff",
    fontWeight: "800",
    fontSize: 11,
  },

  vehicleTitle: {
    fontSize: 21,
    fontWeight: "800",
  },

  year: {
    marginTop: 3,
    color: "#666",
    marginBottom: 16,
  },

  label: {
    marginTop: 10,
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
  },

  value: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "700",
  },

  offer: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "800",
  },

  detailsRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  detailsText: {
    color: "#1677ff",
    fontWeight: "700",
  },

  arrow: {
    color: "#1677ff",
    fontSize: 26,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: "#666",
    lineHeight: 21,
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
