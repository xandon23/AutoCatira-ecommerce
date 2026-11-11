import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
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

type Props = NativeStackScreenProps<RootStackParamList, "NegotiationDetail">;

export function NegotiationDetailScreen({ route, navigation }: Props) {
  const { proposalId } = route.params;

  const [proposal, setProposal] = useState<IProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  const loadNegotiation = useCallback(async () => {
    try {
      setLoading(true);

      const negotiations = await getNegotiations();

      const negotiation =
        negotiations.find((item) => item.id === proposalId) || null;

      setProposal(negotiation);
    } catch (error) {
      console.log("Erro ao carregar negociação:", error);

      Alert.alert(
        "Erro",
        "Não foi possível carregar os detalhes da negociação.",
      );
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useFocusEffect(
    useCallback(() => {
      loadNegotiation();
    }, [loadNegotiation]),
  );

  function formatPhone(phone: string) {
    const digits = phone.replace(/\D/g, "");

    if (digits.length === 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }

    if (digits.length === 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    return phone;
  }

  async function openWhatsApp() {
    if (!proposal?.buyer?.phone) {
      Alert.alert(
        "Contato indisponível",
        "O telefone do comprador não está disponível.",
      );

      return;
    }

    const phone = proposal.buyer.phone.replace(/\D/g, "");

    const number = phone.startsWith("55") ? phone : `55${phone}`;

    const buyerName = proposal.buyer.name || "comprador";

    const vehicleName = proposal.targetVehicle
      ? `${proposal.targetVehicle.brand} ${proposal.targetVehicle.model}`
      : "veículo";

    const message =
      `Olá, ${buyerName}! ` +
      `Sou o proprietário do ${vehicleName} anunciado no AutoCatira. ` +
      `Aceitei sua proposta e gostaria de conversar sobre a negociação.`;

    const encodedMessage = encodeURIComponent(message);

    const appUrl = `whatsapp://send?phone=${number}&text=${encodedMessage}`;

    const webUrl = `https://wa.me/${number}?text=${encodedMessage}`;

    try {
      const canOpenWhatsApp = await Linking.canOpenURL(appUrl);

      if (canOpenWhatsApp) {
        await Linking.openURL(appUrl);

        return;
      }

      await Linking.openURL(webUrl);
    } catch {
      Alert.alert("WhatsApp", "Não foi possível abrir o WhatsApp.");
    }
  }

  async function finalizeSale() {
    if (!proposal) {
      return;
    }

    try {
      setFinalizing(true);

      const response = await finalizeVehicleSale(
        proposal.targetVehicleId,
        proposal.buyerId,
      );

      Alert.alert("Venda concluída", response.message, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
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
      setFinalizing(false);
    }
  }

  function confirmSale() {
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
          onPress: finalizeSale,
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Carregando negociação...</Text>
      </View>
    );
  }

  if (!proposal) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundTitle}>Negociação não encontrada</Text>

        <Text style={styles.notFoundText}>
          Essa negociação pode já ter sido finalizada.
        </Text>
      </View>
    );
  }

  const target = proposal.targetVehicle;
  const offered = proposal.offeredVehicle;

  const imageUrl = getImageUrl(target?.images?.[0]?.url);

  const cash = Number(proposal.cashOffer).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.vehicleImage}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.card}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>EM NEGOCIAÇÃO</Text>
        </View>

        <Text style={styles.vehicleTitle}>
          {target ? `${target.brand} ${target.model}` : "Veículo"}
        </Text>

        {target ? (
          <Text style={styles.vehicleYear}>
            {target.manufactureYear}/{target.modelYear}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Negociação com</Text>

        <Text style={styles.personName}>
          {proposal.buyer?.name || "Comprador"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Oferta</Text>

        <Text style={styles.offerValue}>{cash}</Text>

        {offered ? (
          <>
            <Text style={styles.tradeText}>
              + {offered.brand} {offered.model} {offered.modelYear}
            </Text>

            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                navigation.navigate("VehicleDetail", {
                  vehicleId: offered.id,
                })
              }
            >
              <Text style={styles.secondaryButtonText}>
                Ver veículo oferecido
              </Text>
            </Pressable>
          </>
        ) : null}

        {proposal.message ? (
          <>
            <Text style={styles.messageLabel}>Mensagem</Text>

            <Text style={styles.message}>“{proposal.message}”</Text>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contato</Text>

        <Text style={styles.personName}>
          {proposal.buyer?.name || "Comprador"}
        </Text>

        {proposal.buyer?.phone ? (
          <Text style={styles.phone}>{formatPhone(proposal.buyer.phone)}</Text>
        ) : (
          <Text style={styles.noContact}>Telefone indisponível</Text>
        )}

        <Pressable
          disabled={!proposal.buyer?.phone}
          style={[
            styles.whatsappButton,
            !proposal.buyer?.phone && styles.disabled,
          ]}
          onPress={openWhatsApp}
        >
          <Text style={styles.whatsappButtonText}>Conversar pelo WhatsApp</Text>
        </Pressable>
      </View>

      <View style={styles.warning}>
        <Text style={styles.warningTitle}>Conclusão da venda</Text>

        <Text style={styles.warningText}>
          Finalize somente depois que comprador e vendedor concluírem a
          negociação.
        </Text>
      </View>

      <Pressable
        disabled={finalizing}
        style={[styles.finalizeButton, finalizing && styles.disabled]}
        onPress={confirmSale}
      >
        <Text style={styles.finalizeButtonText}>
          {finalizing ? "Finalizando..." : "Finalizar venda"}
        </Text>
      </Pressable>
    </ScrollView>
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
    gap: 14,
  },

  vehicleImage: {
    width: "100%",
    height: 210,
    borderRadius: 14,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e7f0ff",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginBottom: 12,
  },

  statusText: {
    color: "#1677ff",
    fontSize: 12,
    fontWeight: "800",
  },

  vehicleTitle: {
    fontSize: 24,
    fontWeight: "800",
  },

  vehicleYear: {
    marginTop: 5,
    color: "#666",
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
  },

  personName: {
    marginTop: 6,
    fontSize: 19,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 18,
  },

  offerValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "800",
  },

  tradeText: {
    marginTop: 5,
    fontSize: 17,
    fontWeight: "600",
  },

  secondaryButton: {
    height: 46,
    borderWidth: 1,
    borderColor: "#1677ff",
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: "#1677ff",
    fontWeight: "700",
  },

  messageLabel: {
    marginTop: 20,
    fontSize: 13,
    color: "#777",
    fontWeight: "700",
  },

  message: {
    marginTop: 6,
    color: "#555",
    lineHeight: 21,
    fontStyle: "italic",
  },

  phone: {
    marginTop: 5,
    fontSize: 17,
    color: "#444",
  },

  noContact: {
    marginTop: 6,
    color: "#888",
  },

  whatsappButton: {
    height: 50,
    backgroundColor: "#25D366",
    borderRadius: 10,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  whatsappButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  warning: {
    backgroundColor: "#fff8e6",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1d58a",
  },

  warningTitle: {
    fontWeight: "800",
    fontSize: 15,
  },

  warningText: {
    color: "#666",
    marginTop: 5,
    lineHeight: 20,
  },

  finalizeButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#1677ff",
    alignItems: "center",
    justifyContent: "center",
  },

  finalizeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
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

  notFoundTitle: {
    fontSize: 20,
    fontWeight: "800",
  },

  notFoundText: {
    marginTop: 8,
    color: "#666",
    textAlign: "center",
  },
});
