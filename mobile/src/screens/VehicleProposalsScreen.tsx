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
import {
  getProposalsByVehicle,
  updateProposalStatus,
} from "../services/proposalService";
import { IProposal, ProposalStatus } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleProposals">;

export function VehicleProposalsScreen({ route, navigation }: Props) {
  const { vehicleId, vehicleTitle } = route.params;

  const [proposals, setProposals] = useState<IProposal[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [proposalActionId, setProposalActionId] = useState<string | null>(null);

  const loadProposals = useCallback(async () => {
    try {
      const data = await getProposalsByVehicle(vehicleId);

      setProposals(data.filter((proposal) => proposal.status === "PENDING"));
    } catch (error) {
      console.log("Erro ao carregar propostas:", error);

      Alert.alert("Erro", "Não foi possível carregar as propostas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      loadProposals();
    }, [loadProposals]),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadProposals();
  }

  async function changeProposalStatus(
    proposalId: string,
    status: ProposalStatus,
  ) {
    try {
      setProposalActionId(proposalId);

      await updateProposalStatus(proposalId, status);

      setProposals((current) =>
        current.filter((proposal) => proposal.id !== proposalId),
      );

      if (status === "IN_NEGOTIATION") {
        Alert.alert(
          "Proposta aceita",
          "A proposta foi movida para negociação.",
        );
      } else {
        Alert.alert("Proposta recusada", "A proposta foi recusada.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          "Erro",
          error.response?.data?.error ||
            "Não foi possível atualizar a proposta.",
        );

        return;
      }

      Alert.alert("Erro", "Ocorreu um erro inesperado.");
    } finally {
      setProposalActionId(null);
    }
  }

  function handleAccept(proposal: IProposal) {
    Alert.alert(
      "Aceitar proposta",
      "Deseja aceitar esta proposta e iniciar a negociação?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Aceitar",
          onPress: () => changeProposalStatus(proposal.id, "IN_NEGOTIATION"),
        },
      ],
    );
  }

  function handleReject(proposal: IProposal) {
    Alert.alert(
      "Recusar proposta",
      "Tem certeza que deseja recusar esta proposta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Recusar",
          style: "destructive",
          onPress: () => changeProposalStatus(proposal.id, "REJECTED"),
        },
      ],
    );
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
      data={proposals}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{vehicleTitle}</Text>

          <Text style={styles.subtitle}>Propostas aguardando sua análise</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhuma proposta pendente</Text>

          <Text style={styles.emptyText}>
            Não existem mais propostas aguardando análise para este veículo.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const cashOffer = Number(item.cashOffer).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        const offeredVehicle = item.offeredVehicle;

        const offeredImage = getImageUrl(offeredVehicle?.images?.[0]?.url);

        const isProcessing = proposalActionId === item.id;

        return (
          <View style={styles.proposalCard}>
            <View style={styles.proposalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.buyerName}>
                  {item.buyer?.name || "Usuário"}
                </Text>

                <Text style={styles.cashOffer}>{cashOffer}</Text>
              </View>

              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Pendente</Text>
              </View>
            </View>

            {item.message ? (
              <View style={styles.messageBox}>
                <Text style={styles.label}>Mensagem</Text>

                <Text style={styles.message}>{item.message}</Text>
              </View>
            ) : null}

            {offeredVehicle ? (
              <View style={styles.tradeSection}>
                <Text style={styles.label}>Veículo oferecido na troca</Text>

                <View style={styles.tradeCard}>
                  {offeredImage ? (
                    <Image
                      source={{
                        uri: offeredImage,
                      }}
                      style={styles.tradeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.tradeImage, styles.noImage]}>
                      <Text style={styles.noImageText}>Sem foto</Text>
                    </View>
                  )}

                  <View style={styles.tradeInfo}>
                    <Text style={styles.tradeTitle}>
                      {offeredVehicle.brand} {offeredVehicle.model}
                    </Text>

                    <Text style={styles.tradeYear}>
                      {offeredVehicle.manufactureYear}/
                      {offeredVehicle.modelYear}
                    </Text>

                    <Pressable
                      style={styles.viewVehicleButton}
                      onPress={() =>
                        navigation.navigate("VehicleDetail", {
                          vehicleId: offeredVehicle.id,
                        })
                      }
                    >
                      <Text style={styles.viewVehicleText}>
                        Ver veículo oferecido
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.cashOnlyBox}>
                <Text style={styles.cashOnlyText}>
                  Proposta somente em dinheiro
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <Pressable
                disabled={isProcessing}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.acceptButton,
                  pressed && styles.pressed,
                  isProcessing && styles.disabled,
                ]}
                onPress={() => handleAccept(item)}
              >
                <Text style={styles.acceptText}>
                  {isProcessing ? "Aguarde..." : "Aceitar"}
                </Text>
              </Pressable>

              <Pressable
                disabled={isProcessing}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.rejectButton,
                  pressed && styles.pressed,
                  isProcessing && styles.disabled,
                ]}
                onPress={() => handleReject(item)}
              >
                <Text style={styles.rejectText}>Recusar</Text>
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
    color: "#111",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#666",
  },

  proposalCard: {
    padding: 17,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  proposalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  buyerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },

  cashOffer: {
    marginTop: 5,
    fontSize: 23,
    fontWeight: "800",
    color: "#111",
  },

  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff3cd",
  },

  pendingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#856404",
  },

  messageBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f7f7f7",
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    marginBottom: 6,
  },

  message: {
    fontSize: 15,
    lineHeight: 21,
    color: "#333",
  },

  tradeSection: {
    marginTop: 18,
  },

  tradeCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },

  tradeImage: {
    width: 110,
    height: 110,
  },

  noImage: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddd",
  },

  noImageText: {
    fontSize: 12,
    color: "#777",
  },

  tradeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },

  tradeTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  tradeYear: {
    marginTop: 4,
    color: "#666",
  },

  viewVehicleButton: {
    marginTop: 10,
    alignSelf: "flex-start",
  },

  viewVehicleText: {
    fontWeight: "700",
    color: "#1677ff",
  },

  cashOnlyBox: {
    marginTop: 18,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f7f9fc",
  },

  cashOnlyText: {
    color: "#666",
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  acceptButton: {
    backgroundColor: "#1677ff",
  },

  rejectButton: {
    borderWidth: 1,
    borderColor: "#d32f2f",
    backgroundColor: "#fff",
  },

  acceptText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  rejectText: {
    color: "#d32f2f",
    fontSize: 15,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.65,
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
