import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import { getImageUrl } from "../services/api";
import { getMyProposals } from "../services/proposalService";
import { IProposal, ProposalStatus } from "../types";

export function MyProposalsScreen() {
  const [proposals, setProposals] = useState<IProposal[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProposals = useCallback(async () => {
    try {
      const data = await getMyProposals();

      setProposals(data);
    } catch (error) {
      console.log("Erro ao carregar minhas propostas:", error);

      Alert.alert("Erro", "Não foi possível carregar suas propostas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProposals();
    }, [loadProposals]),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadProposals();
  }

  function getStatusText(status: ProposalStatus) {
    switch (status) {
      case "PENDING":
        return "AGUARDANDO RESPOSTA";

      case "IN_NEGOTIATION":
        return "EM NEGOCIAÇÃO";

      case "ACCEPTED":
        return "NEGOCIAÇÃO FINALIZADA";

      case "REJECTED":
        return "RECUSADA";

      default:
        return status;
    }
  }

  function getStatusStyle(status: ProposalStatus) {
    switch (status) {
      case "IN_NEGOTIATION":
        return {
          badge: styles.negotiationBadge,
          text: styles.negotiationText,
        };

      case "ACCEPTED":
        return {
          badge: styles.acceptedBadge,
          text: styles.acceptedText,
        };

      case "REJECTED":
        return {
          badge: styles.rejectedBadge,
          text: styles.rejectedText,
        };

      default:
        return {
          badge: styles.pendingBadge,
          text: styles.pendingText,
        };
    }
  }

  async function openWhatsApp(proposal: IProposal) {
    const seller = proposal.targetVehicle?.user;

    if (!seller?.phone) {
      Alert.alert(
        "Contato indisponível",
        "O telefone do vendedor ainda não está disponível.",
      );

      return;
    }

    const cleanPhone = seller.phone.replace(/\D/g, "");

    const number = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const vehicle = proposal.targetVehicle;

    const vehicleName = vehicle
      ? `${vehicle.brand} ${vehicle.model}`
      : "veículo";

    const sellerName = seller.name || "vendedor";

    const message =
      `Olá, ${sellerName}! ` +
      `Sou o comprador interessado no ${vehicleName} pelo AutoCatira. ` +
      `Vi que minha proposta entrou em negociação e gostaria de conversar.`;

    const encodedMessage = encodeURIComponent(message);

    const appUrl =
      `whatsapp://send?phone=${number}` + `&text=${encodedMessage}`;

    const webUrl = `https://wa.me/${number}` + `?text=${encodedMessage}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);

      if (supported) {
        await Linking.openURL(appUrl);
        return;
      }

      await Linking.openURL(webUrl);
    } catch {
      Alert.alert("WhatsApp", "Não foi possível abrir o WhatsApp.");
    }
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
          <Text style={styles.title}>Minhas propostas</Text>

          <Text style={styles.subtitle}>
            Acompanhe as propostas que você enviou aos vendedores.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhuma proposta enviada</Text>

          <Text style={styles.emptyText}>
            Quando você fizer uma proposta em um veículo, ela aparecerá aqui.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const vehicle = item.targetVehicle;

        const offered = item.offeredVehicle;

        const seller = vehicle?.user;

        const imageUrl = getImageUrl(vehicle?.images?.[0]?.url);

        const cash = Number(item.cashOffer).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        const statusStyle = getStatusStyle(item.status);

        const contactAvailable =
          !!seller?.phone &&
          (item.status === "IN_NEGOTIATION" || item.status === "ACCEPTED");

        return (
          <View style={styles.card}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.cardContent}>
              <View style={[styles.statusBadge, statusStyle.badge]}>
                <Text style={[styles.statusText, statusStyle.text]}>
                  {getStatusText(item.status)}
                </Text>
              </View>

              <Text style={styles.vehicleTitle}>
                {vehicle
                  ? `${vehicle.brand} ${vehicle.model} ${vehicle.modelYear}`
                  : "Veículo"}
              </Text>

              <Text style={styles.label}>Sua oferta</Text>

              <Text style={styles.offer}>
                {cash}
                {offered ? ` + ${offered.brand} ${offered.model}` : ""}
              </Text>

              {seller?.name ? (
                <>
                  <Text style={styles.label}>Vendedor</Text>

                  <Text style={styles.seller}>{seller.name}</Text>
                </>
              ) : null}

              {contactAvailable ? (
                <>
                  <Text style={styles.contactLabel}>Contato liberado</Text>

                  <Text style={styles.phone}>{seller?.phone}</Text>

                  <Pressable
                    style={styles.whatsappButton}
                    onPress={() => openWhatsApp(item)}
                  >
                    <Text style={styles.whatsappButtonText}>
                      Conversar pelo WhatsApp
                    </Text>
                  </Pressable>
                </>
              ) : item.status === "PENDING" ? (
                <Text style={styles.waiting}>
                  O contato será liberado se o vendedor aceitar sua proposta.
                </Text>
              ) : null}
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

  image: {
    width: "100%",
    height: 160,
  },

  cardContent: {
    padding: 17,
  },

  vehicleTitle: {
    fontSize: 21,
    fontWeight: "800",
  },

  label: {
    marginTop: 14,
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  offer: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
  },

  seller: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
  },

  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  pendingBadge: {
    backgroundColor: "#fff4d6",
  },

  pendingText: {
    color: "#8a6500",
  },

  negotiationBadge: {
    backgroundColor: "#e7f0ff",
  },

  negotiationText: {
    color: "#1677ff",
  },

  acceptedBadge: {
    backgroundColor: "#e7f6ea",
  },

  acceptedText: {
    color: "#218838",
  },

  rejectedBadge: {
    backgroundColor: "#fdeaea",
  },

  rejectedText: {
    color: "#c62828",
  },

  contactLabel: {
    marginTop: 18,
    fontWeight: "700",
    color: "#218838",
  },

  phone: {
    marginTop: 5,
    fontSize: 17,
    fontWeight: "600",
  },

  waiting: {
    marginTop: 18,
    color: "#777",
    lineHeight: 20,
  },

  whatsappButton: {
    height: 50,
    backgroundColor: "#25D366",
    borderRadius: 10,
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  whatsappButtonText: {
    color: "#fff",
    fontWeight: "800",
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
    color: "#666",
    textAlign: "center",
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
