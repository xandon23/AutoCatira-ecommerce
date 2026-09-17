import { useCallback, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppButton } from "../components/AppButton";
import { RootStackParamList } from "../navigation/types";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Pressable,
  Text,
  View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import { VehicleCard } from "../components/VehicleCard";
import { getMyVehicles } from "../services/vehicleService";
import { IVehicle } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "MyVehicles">;

export function MyVehiclesScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await getMyVehicles();

      setVehicles(data);
    } catch (error) {
      console.log("Erro ao carregar meus anúncios:", error);

      Alert.alert("Erro", "Não foi possível carregar seus anúncios.");
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

        <Text style={styles.loadingText}>Carregando seus anúncios...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={vehicles}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Meus anúncios</Text>

          <Text style={styles.subtitle}>
            {vehicles.length} veículo(s) anunciado(s).
          </Text>
          <View style={styles.newVehicle}>
            <AppButton
              title="+ Novo anúncio"
              onPress={() => navigation.navigate("CreateVehicle")}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Você não possui anúncios ativos.
          </Text>

          <Text style={styles.emptyText}>Cadastre agora mesmo.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.vehicleItem}>
          <VehicleCard
            vehicle={item}
            onPress={() =>
              navigation.navigate("EditVehicle", {
                vehicleId: item.id,
              })
            }
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  list: {
    padding: 16,
    flexGrow: 1,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 8,
    color: "#666",
    textAlign: "center",
  },

  newVehicle: {
    marginTop: 18,
  },

  vehicleItem: {
    marginBottom: 18,
  },
});
