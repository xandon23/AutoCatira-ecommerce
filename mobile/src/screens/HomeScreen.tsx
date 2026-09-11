import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { VehicleCard } from "../components/VehicleCard";
import { AppButton } from "../components/AppButton";
import { useAuth } from "../contexts/AuthContext";
import { getVehicles } from "../services/vehicleService";
import { IVehicle } from "../types";
import { RootStackParamList } from "../navigation/types";

interface HomeScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, signOut } = useAuth();

  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const response = await getVehicles();

      setVehicles(response.vehicles);
    } catch (error) {
      console.log("Erro ao carregar veículos:", error);

      Alert.alert("Erro", "Não foi possível carregar os veículos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  function handleRefresh() {
    setRefreshing(true);
    loadVehicles();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Carregando veículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>AutoCatira</Text>

              <Text style={styles.welcome}>
                Olá, {user?.name.split(" ")[0]}!
              </Text>
              <View style={styles.actions}>
                <AppButton
                  title="Meus anúncios"
                  onPress={() => navigation.navigate("MyVehicles")}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Veículos disponíveis</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum veículo disponível.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onPress={() =>
              navigation.navigate("VehicleDetail", {
                vehicleId: item.id,
              })
            }
          />
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <AppButton title="Sair" onPress={signOut} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  list: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 20,
  },

  logo: {
    fontSize: 30,
    fontWeight: "800",
  },

  welcome: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    marginTop: 26,
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
    paddingVertical: 60,
    alignItems: "center",
  },

  emptyText: {
    color: "#666",
  },

  footer: {
    marginTop: 20,
  },
  actions: {
    marginTop: 18,
  },
});
