import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ProfileMenu } from "../components/ProfileMenu";
import { VehicleCard } from "../components/VehicleCard";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { getVehicles } from "../services/vehicleService";
import { IVehicle } from "../types";
import { useFocusEffect } from "@react-navigation/native";

interface HomeScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, signOut } = useAuth();

  const [vehicles, setVehicles] = useState<IVehicle[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [loadVehicles]),
  );

  function handleRefresh() {
    setRefreshing(true);
    loadVehicles();
  }

  async function handleSignOut() {
    setMenuVisible(false);

    await signOut();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Carregando veículos...</Text>
      </View>
    );
  }

  const firstName = user?.name?.trim().split(" ")[0] || "Usuário";

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
            <View style={styles.topBar}>
              <View>
                <Text style={styles.logo}>AutoCatira</Text>

                {user ? (
                  <Text style={styles.welcome}>Olá, {firstName}!</Text>
                ) : (
                  <Text style={styles.welcome}>
                    Encontre seu próximo veículo
                  </Text>
                )}
              </View>

              {user ? (
                <Pressable
                  style={styles.profileButton}
                  onPress={() => setMenuVisible(true)}
                >
                  <Text style={styles.profileInitial}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.authActions}>
                  <Pressable
                    style={styles.loginButton}
                    onPress={() => navigation.navigate("Login")}
                  >
                    <Text style={styles.loginButtonText}>Entrar</Text>
                  </Pressable>

                  <Pressable
                    style={styles.registerButton}
                    onPress={() => navigation.navigate("Register")}
                  >
                    <Text style={styles.registerButtonText}>Criar conta</Text>
                  </Pressable>
                </View>
              )}
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
      />
      {user && (
        <ProfileMenu
          visible={menuVisible}
          userName={user?.name}
          onClose={() => setMenuVisible(false)}
          onMyVehicles={() => {
            setMenuVisible(false);

            navigation.navigate("MyVehicles");
          }}
          onProposals={() => {
            setMenuVisible(false);

            navigation.navigate("ReceivedProposals");
          }}
          onNegotiations={() => {
            setMenuVisible(false);

            navigation.navigate("Negotiations");
          }}
          onReviews={() => {
            setMenuVisible(false);

            Alert.alert(
              "Avaliações",
              "Essa funcionalidade será implementada posteriormente.",
            );
          }}
          isAdmin={user?.role === "ADMIN"}
          onAdmin={() => {
            setMenuVisible(false);

            navigation.navigate("Admin");
          }}
          onSignOut={handleSignOut}
        />
      )}
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

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e7f0ff",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1677ff",
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

  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#1677ff",
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  authActions: {
    flexDirection: "row",
    gap: 8,
  },

  registerButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1677ff",
  },

  registerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
