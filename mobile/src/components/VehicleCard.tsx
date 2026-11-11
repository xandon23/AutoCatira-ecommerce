import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { IVehicle } from "../types";
import { getImageUrl } from "../services/api";

interface VehicleCardProps {
  vehicle: IVehicle;
  onPress: () => void;
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const imageUrl = getImageUrl(vehicle.images?.[0]?.url);

  const price = Number(vehicle.price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text style={styles.noImageText}>Sem foto</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {vehicle.brand} {vehicle.model}
          </Text>

          <Text style={styles.year}>
            {vehicle.manufactureYear}/{vehicle.modelYear}
          </Text>
        </View>

        <Text style={styles.details}>{vehicle.location}</Text>

        <Text style={styles.details}>
          {Number(vehicle.mileage).toLocaleString("pt-BR")} km •{" "}
          {vehicle.transmission}
        </Text>

        <Text style={styles.price}>{price}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  image: {
    width: "100%",
    height: 190,
  },

  noImage: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e5e5",
  },

  noImageText: {
    color: "#777",
  },

  content: {
    padding: 16,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
  },

  year: {
    fontSize: 14,
    color: "#666",
  },

  details: {
    color: "#666",
    marginTop: 6,
  },

  price: {
    fontSize: 21,
    fontWeight: "700",
    marginTop: 12,
  },
});
