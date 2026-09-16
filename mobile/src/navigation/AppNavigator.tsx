import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { VehicleDetailScreen } from "../screens/VehicleDetailScreen";
import { MyVehiclesScreen } from "../screens/MyVehiclesScreen";
import { CreateVehicleScreen } from "../screens/CreateVehicleScreen";
import { EditVehicleScreen } from "../screens/EditVehicleScreen";
import { ReceivedProposalsScreen } from "../screens/ReceivedProposalsScreen";
import { VehicleProposalsScreen } from "../screens/VehicleProposalsScreen";
import { NegotiationsScreen } from "../screens/NegotiationsScreen";
import { AdminScreen } from "../screens/AdminScreen";
import { RootStackParamList } from "./types";
import { RegisterScreen } from "../screens/RegisterScreen";
import { NegotiationDetailScreen } from "../screens/NegotiationDetailScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        {/* Rotas públicas */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="VehicleDetail"
          component={VehicleDetailScreen}
          options={{
            headerShown: true,
            title: "Detalhes do veículo",
          }}
        />

        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: true,
                title: "Entrar",
              }}
            />

            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                headerShown: true,
                title: "Criar conta",
              }}
            />
          </>
        ) : (
          <>
            {/* Rotas privadas */}
            <Stack.Screen
              name="MyVehicles"
              component={MyVehiclesScreen}
              options={{
                headerShown: true,
                title: "Meus anúncios",
              }}
            />

            <Stack.Screen
              name="CreateVehicle"
              component={CreateVehicleScreen}
              options={{
                headerShown: true,
                title: "Novo anúncio",
              }}
            />

            <Stack.Screen
              name="EditVehicle"
              component={EditVehicleScreen}
              options={{
                headerShown: true,
                title: "Editar anúncio",
              }}
            />

            <Stack.Screen
              name="ReceivedProposals"
              component={ReceivedProposalsScreen}
              options={{
                headerShown: true,
                title: "Propostas recebidas",
              }}
            />

            <Stack.Screen
              name="VehicleProposals"
              component={VehicleProposalsScreen}
              options={{
                headerShown: true,
                title: "Propostas do veículo",
              }}
            />

            <Stack.Screen
              name="Negotiations"
              component={NegotiationsScreen}
              options={{
                headerShown: true,
                title: "Negociações",
              }}
            />

            <Stack.Screen
              name="NegotiationDetail"
              component={NegotiationDetailScreen}
              options={{
                headerShown: true,
                title: "Detalhes da negociação",
              }}
            />

            <Stack.Screen
              name="Admin"
              component={AdminScreen}
              options={{
                headerShown: true,
                title: "Administração",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
