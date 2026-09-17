import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
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
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {user ? (
              <View style={styles.topBar}>
                <View>
                  <Image
                    source={require("../../assets/autocatira-logo.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />

                  <Text style={styles.welcome}>Olá, {firstName}!</Text>
                </View>

                <Pressable
                  style={styles.profileButton}
                  onPress={() => setMenuVisible(true)}
                >
                  <Text style={styles.profileInitial}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.guestHeader}>
                <Image
                  source={require("../../assets/autocatira-logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />

                <Text style={styles.subtitle}>
                  Encontre seu próximo veículo
                </Text>

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
              </View>
            )}

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
          onSoldVehicles={() => {
            setMenuVisible(false);

            navigation.navigate("SoldVehicles");
          }}
          onProposals={() => {
            setMenuVisible(false);

            navigation.navigate("ReceivedProposals");
          }}
          onMyProposals={() => {
            setMenuVisible(false);

            navigation.navigate("MyProposals");
          }}
          onNegotiations={() => {
            setMenuVisible(false);

            navigation.navigate("Negotiations");
          }}
          onReviews={() => {
            setMenuVisible(false);

            navigation.navigate("Reviews");
          }}
          isAdmin={user?.role === "ADMIN"}
          onAdmin={() => {
            setMenuVisible(false);

            navigation.navigate("Admin");
          }}
          onSignOut={handleSignOut}
        />
      )}
    </SafeAreaView>
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

  logoImage: {
    width: 220,
    height: 70,
    alignSelf: "flex-start",
    marginHorizontal: -12,
    marginBottom: -16,
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
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#1677ff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  loginButtonText: {
    color: "#1677ff",
    fontWeight: "700",
    fontSize: 15,
  },

  authActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  registerButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1677ff",
  },

  registerButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: "#666",
  },

  guestHeader: {
    width: "100%",
  },
});
