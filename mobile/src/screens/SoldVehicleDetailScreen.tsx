import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import { getImageUrl } from "../services/api";
import { getSoldVehicleById } from "../services/vehicleService";
import { ISoldVehicleDetails } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "SoldVehicleDetail">;

export function SoldVehicleDetailScreen({ route }: Props) {
  const { vehicleId } = route.params;

  const [data, setData] = useState<ISoldVehicleDetails | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await getSoldVehicleById(vehicleId);

        setData(response);
      } catch (error) {
        console.log("Erro ao carregar venda:", error);

        Alert.alert("Erro", "Não foi possível carregar os detalhes da venda.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [vehicleId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>Venda não encontrada.</Text>
      </View>
    );
  }

  const { vehicle, proposal, saleType } = data;

  const imageUrl = getImageUrl(vehicle.images?.[0]?.url);

  const cash = proposal
    ? Number(proposal.cashOffer).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : null}

      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>VENDIDO</Text>
        </View>

        <Text style={styles.title}>
          {vehicle.brand} {vehicle.model}
        </Text>

        <Text style={styles.year}>
          {vehicle.manufactureYear}/{vehicle.modelYear}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Negociação</Text>

        {vehicle.Buyer?.name ? (
          <>
            <Text style={styles.label}>Comprador / recebedor</Text>

            <Text style={styles.value}>{vehicle.Buyer.name}</Text>
          </>
        ) : null}

        {saleType === "SALE" && proposal ? (
          <>
            <Text style={styles.label}>Valor em dinheiro</Text>

            <Text style={styles.money}>{cash}</Text>

            {proposal.offeredVehicle ? (
              <>
                <Text style={styles.label}>Veículo recebido na troca</Text>

                <Text style={styles.value}>
                  {proposal.offeredVehicle.brand}{" "}
                  {proposal.offeredVehicle.model}{" "}
                  {proposal.offeredVehicle.modelYear}
                </Text>
              </>
            ) : null}
          </>
        ) : null}

        {saleType === "TRADE" && proposal?.targetVehicle ? (
          <>
            <Text style={styles.label}>Tipo da negociação</Text>

            <Text style={styles.value}>
              Veículo utilizado como parte de uma troca
            </Text>

            <Text style={styles.label}>Veículo negociado</Text>

            <Text style={styles.value}>
              {proposal.targetVehicle.brand} {proposal.targetVehicle.model}{" "}
              {proposal.targetVehicle.modelYear}
            </Text>

            <Text style={styles.label}>Valor adicional</Text>

            <Text style={styles.money}>{cash}</Text>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dados do veículo</Text>

        <Text style={styles.label}>Motor</Text>

        <Text style={styles.value}>{vehicle.engine}</Text>

        <Text style={styles.label}>Câmbio</Text>

        <Text style={styles.value}>{vehicle.transmission}</Text>

        <Text style={styles.label}>Quilometragem</Text>

        <Text style={styles.value}>
          {Number(vehicle.mileage).toLocaleString("pt-BR")} km
        </Text>

        <Text style={styles.label}>Localização</Text>

        <Text style={styles.value}>{vehicle.location}</Text>
      </View>

      <View style={styles.readOnly}>
        <Text style={styles.readOnlyText}>
          Este anúncio foi finalizado e está disponível somente para consulta.
        </Text>
      </View>
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

  image: {
    width: "100%",
    height: 220,
    borderRadius: 14,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 18,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e7f6ea",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },

  badgeText: {
    color: "#218838",
    fontSize: 11,
    fontWeight: "800",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
  },

  year: {
    marginTop: 4,
    color: "#666",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },

  label: {
    marginTop: 13,
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  value: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "600",
  },

  money: {
    marginTop: 4,
    fontSize: 21,
    fontWeight: "800",
  },

  readOnly: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff8e6",
    borderWidth: 1,
    borderColor: "#f1d58a",
  },

  readOnlyText: {
    color: "#666",
    lineHeight: 20,
    textAlign: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
