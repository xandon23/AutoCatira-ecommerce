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
import { getSoldVehicles } from "../services/vehicleService";
import { IVehicle } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "SoldVehicles">;

export function SoldVehiclesScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await getSoldVehicles();

      setVehicles(data);
    } catch (error) {
      console.log("Erro ao carregar veículos vendidos:", error);

      Alert.alert("Erro", "Não foi possível carregar os veículos vendidos.");
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

        <Text style={styles.loadingText}>Carregando histórico...</Text>
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
          <Text style={styles.title}>Veículos vendidos</Text>

          <Text style={styles.subtitle}>
            Histórico dos seus veículos que já foram negociados.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhum veículo vendido</Text>

          <Text style={styles.emptyText}>
            As vendas concluídas aparecerão aqui.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const imageUrl = getImageUrl(item.images?.[0]?.url);

        return (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("SoldVehicleDetail", {
                vehicleId: item.id,
              })
            }
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.cardContent}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>VENDIDO</Text>
              </View>

              <Text style={styles.vehicleTitle}>
                {item.brand} {item.model}
              </Text>

              <Text style={styles.year}>
                {item.manufactureYear}/{item.modelYear}
              </Text>

              {item.Buyer?.name ? (
                <>
                  <Text style={styles.label}>Comprador / recebedor</Text>

                  <Text style={styles.buyer}>{item.Buyer.name}</Text>
                </>
              ) : null}

              <View style={styles.detailsRow}>
                <Text style={styles.detailsText}>Ver detalhes da venda</Text>

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
    height: 160,
  },

  cardContent: {
    padding: 17,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e7f6ea",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },

  badgeText: {
    color: "#218838",
    fontSize: 11,
    fontWeight: "800",
  },

  vehicleTitle: {
    fontSize: 21,
    fontWeight: "800",
  },

  year: {
    marginTop: 3,
    color: "#666",
  },

  label: {
    marginTop: 14,
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  buyer: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
  },

  detailsRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  detailsText: {
    color: "#1677ff",
    fontWeight: "700",
  },

  arrow: {
    color: "#1677ff",
    fontSize: 26,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 8,
    color: "#666",
  },
});
