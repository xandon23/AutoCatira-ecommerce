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

import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import { getImageUrl } from "../services/api";
import { getNegotiations } from "../services/proposalService";
import { finalizeVehicleSale } from "../services/vehicleService";
import { IProposal } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Negotiations">;

export function NegotiationsScreen({ navigation }: Props) {
  const [proposals, setProposals] = useState<IProposal[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [finalizingId, setFinalizingId] = useState<string | null>(null);

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

  async function finalizeSale(proposal: IProposal) {
    try {
      setFinalizingId(proposal.id);

      const response = await finalizeVehicleSale(
        proposal.targetVehicleId,
        proposal.buyerId,
      );

      setProposals((current) =>
        current.filter((item) => item.id !== proposal.id),
      );

      Alert.alert("Venda concluída", response.message);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          "Erro",
          error.response?.data?.error || "Não foi possível finalizar a venda.",
        );

        return;
      }

      Alert.alert("Erro", "Ocorreu um erro inesperado.");
    } finally {
      setFinalizingId(null);
    }
  }

  function confirmSale(proposal: IProposal) {
    Alert.alert(
      "Finalizar venda",
      "Confirme somente quando a negociação estiver concluída. O anúncio será marcado como vendido.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Finalizar venda",
          onPress: () => finalizeSale(proposal),
        },
      ],
    );
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
            Propostas que você aceitou e estão aguardando conclusão.
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

        const isFinalizing = finalizingId === item.id;

        return (
          <View style={styles.card}>
            {targetImage ? (
              <Image
                source={{
                  uri: targetImage,
                }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.cardContent}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Em negociação</Text>
              </View>

              <Text style={styles.vehicleTitle}>
                {target ? `${target.brand} ${target.model}` : "Veículo"}
              </Text>

              {target ? (
                <Text style={styles.year}>
                  {target.manufactureYear}/{target.modelYear}
                </Text>
              ) : null}

              <View style={styles.divider} />

              <Text style={styles.label}>Comprador</Text>

              <Text style={styles.value}>{item.buyer?.name || "Usuário"}</Text>

              {item.buyer?.phone ? (
                <Text style={styles.contact}>{item.buyer.phone}</Text>
              ) : null}

              <Text style={[styles.label, styles.offerLabel]}>Proposta</Text>

              <Text style={styles.offer}>
                {cash}
                {offered ? ` + ${offered.brand} ${offered.model}` : ""}
              </Text>

              {item.message ? (
                <Text style={styles.message}>“{item.message}”</Text>
              ) : null}

              {offered ? (
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() =>
                    navigation.navigate("VehicleDetail", {
                      vehicleId: offered.id,
                    })
                  }
                >
                  <Text style={styles.secondaryText}>
                    Ver veículo oferecido
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                disabled={isFinalizing}
                style={[styles.finalizeButton, isFinalizing && styles.disabled]}
                onPress={() => confirmSale(item)}
              >
                <Text style={styles.finalizeText}>
                  {isFinalizing ? "Finalizando..." : "Finalizar venda"}
                </Text>
              </Pressable>
            </View>
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

  mainImage: {
    width: "100%",
    height: 180,
  },

  cardContent: {
    padding: 17,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e7f0ff",
    marginBottom: 12,
  },

  statusText: {
    color: "#1677ff",
    fontWeight: "700",
    fontSize: 12,
  },

  vehicleTitle: {
    fontSize: 21,
    fontWeight: "800",
  },

  year: {
    marginTop: 4,
    color: "#666",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#777",
  },

  value: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "700",
  },

  contact: {
    marginTop: 3,
    color: "#555",
  },

  offerLabel: {
    marginTop: 18,
  },

  offer: {
    marginTop: 5,
    fontSize: 20,
    fontWeight: "800",
  },

  message: {
    marginTop: 12,
    color: "#555",
    fontStyle: "italic",
    lineHeight: 20,
  },

  secondaryButton: {
    height: 46,
    marginTop: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1677ff",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryText: {
    color: "#1677ff",
    fontWeight: "700",
  },

  finalizeButton: {
    height: 50,
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: "#1677ff",
    alignItems: "center",
    justifyContent: "center",
  },

  finalizeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  disabled: {
    opacity: 0.5,
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
