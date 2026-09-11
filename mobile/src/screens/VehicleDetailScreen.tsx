import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import { IVehicle } from "../types";
import { getVehicleById } from "../services/vehicleService";
import { getImageUrl } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleDetail">;

export function VehicleDetailScreen({ route }: Props) {
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState<IVehicle | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicle() {
      try {
        const data = await getVehicleById(vehicleId);

        setVehicle(data);
      } catch (error) {
        console.log("Erro ao carregar veículo:", error);
      } finally {
        setLoading(false);
      }
    }

    loadVehicle();
  }, [vehicleId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.center}>
        <Text>Veículo não encontrado.</Text>
      </View>
    );
  }

  const price = Number(vehicle.price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {vehicle.images?.length ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.images}
        >
          {vehicle.images.map((image) => (
            <Image
              key={image.id}
              source={{
                uri: getImageUrl(image.url),
              }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text>Sem fotos</Text>
        </View>
      )}

      <Text style={styles.title}>
        {vehicle.brand} {vehicle.model}
      </Text>

      <Text style={styles.price}>{price}</Text>

      <View style={styles.specs}>
        <Info
          label="Ano"
          value={`${vehicle.manufactureYear}/${vehicle.modelYear}`}
        />

        <Info
          label="Quilometragem"
          value={`${Number(vehicle.mileage).toLocaleString("pt-BR")} km`}
        />

        <Info label="Motor" value={vehicle.engine} />

        <Info label="Câmbio" value={vehicle.transmission} />

        <Info label="Localização" value={vehicle.location} />
      </View>

      {vehicle.features?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opcionais</Text>

          <Text style={styles.description}>{vehicle.features.join(" • ")}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descrição</Text>

        <Text style={styles.description}>{vehicle.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vendedor</Text>

        <Text style={styles.description}>
          {vehicle.user?.name || "Vendedor"}
        </Text>
      </View>
    </ScrollView>
  );
}

interface InfoProps {
  label: string;
  value: string;
}

function Info({ label, value }: InfoProps) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  content: {
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  images: {
    backgroundColor: "#ddd",
  },

  image: {
    width: 390,
    height: 260,
  },

  noImage: {
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    marginHorizontal: 20,
    marginTop: 20,
  },

  price: {
    fontSize: 25,
    fontWeight: "700",
    marginHorizontal: 20,
    marginTop: 8,
  },

  specs: {
    margin: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    gap: 14,
  },

  info: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },

  infoLabel: {
    color: "#666",
  },

  infoValue: {
    flex: 1,
    textAlign: "right",
    fontWeight: "600",
  },

  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 8,
  },

  description: {
    fontSize: 16,
    lineHeight: 23,
    color: "#444",
  },
});
