import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";

import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "../navigation/types";
import { getImageUrl } from "../services/api";
import { createProposal } from "../services/proposalService";
import { getMyVehicles, getVehicleById } from "../services/vehicleService";
import { IVehicle } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleDetail">;

export function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;

  const { user } = useAuth();

  const [vehicle, setVehicle] = useState<IVehicle | null>(null);

  const [loading, setLoading] = useState(true);

  const [showProposalForm, setShowProposalForm] = useState(false);

  const [cashOffer, setCashOffer] = useState("");

  const [message, setMessage] = useState("");

  const [offeredVehicleId, setOfferedVehicleId] = useState("");

  const [myVehicles, setMyVehicles] = useState<IVehicle[]>([]);

  const [proposalLoading, setProposalLoading] = useState(false);

  const isOwner =
    !!user && !!vehicle && String(user.id) === String(vehicle.userId);

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

  useEffect(() => {
    async function loadMyVehicles() {
      if (!user || !vehicle || isOwner) {
        return;
      }

      try {
        const vehicles = await getMyVehicles();

        setMyVehicles(
          vehicles.filter(
            (item) =>
              item.status === "available" &&
              String(item.id) !== String(vehicle.id),
          ),
        );
      } catch (error) {
        console.log("Erro ao carregar veículos do usuário:", error);
      }
    }

    loadMyVehicles();
  }, [vehicle, isOwner]);

  async function handleSendProposal() {
    const value = Number(cashOffer.replace(",", "."));

    if (!cashOffer.trim() || Number.isNaN(value)) {
      Alert.alert("Atenção", "Informe um valor válido para a proposta.");

      return;
    }

    if (!offeredVehicleId && value <= 0) {
      Alert.alert("Atenção", "O valor da proposta deve ser maior que zero.");

      return;
    }

    if (offeredVehicleId && value < 0) {
      Alert.alert("Atenção", "O valor em dinheiro não pode ser negativo.");

      return;
    }

    try {
      setProposalLoading(true);

      const response = await createProposal({
        targetVehicleId: vehicleId,
        cashOffer: value,

        message: message.trim() || undefined,

        offeredVehicleId: offeredVehicleId || undefined,
      });

      Alert.alert("Sucesso", response.message);

      setCashOffer("");
      setMessage("");
      setOfferedVehicleId("");
      setShowProposalForm(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          "Erro",
          error.response?.data?.error || "Não foi possível enviar a proposta.",
        );

        return;
      }

      Alert.alert("Erro", "Ocorreu um erro inesperado.");
    } finally {
      setProposalLoading(false);
    }
  }

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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

              <Text style={styles.description}>
                {vehicle.features.join(" • ")}
              </Text>
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

          {!isOwner && !showProposalForm && (
            <View style={styles.proposalSection}>
              <AppButton
                title={
                  user ? "Fazer proposta" : "Entre para fazer uma proposta"
                }
                onPress={() => {
                  if (!user) {
                    navigation.navigate("Login");
                    return;
                  }

                  setShowProposalForm(true);
                }}
              />
            </View>
          )}

          {!isOwner && showProposalForm && (
            <View style={styles.proposalBox}>
              <Text style={styles.proposalTitle}>Fazer proposta</Text>

              <Text style={styles.proposalLabel}>Valor em dinheiro (R$)</Text>

              <AppInput
                placeholder="Ex: 15000"
                value={cashOffer}
                onChangeText={setCashOffer}
                keyboardType="decimal-pad"
              />

              <Text style={styles.proposalLabel}>Veículo na troca</Text>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={offeredVehicleId}
                  onValueChange={(value) => setOfferedVehicleId(value)}
                >
                  <Picker.Item label="Somente dinheiro" value="" />

                  {myVehicles.map((item) => (
                    <Picker.Item
                      key={item.id}
                      label={`${item.brand} ${item.model} - ${item.manufactureYear}`}
                      value={item.id}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.proposalLabel}>Mensagem</Text>

              <AppInput
                placeholder="Mensagem para o vendedor"
                value={message}
                onChangeText={setMessage}
                multiline
              />

              <AppButton
                title="Enviar proposta"
                onPress={handleSendProposal}
                loading={proposalLoading}
              />

              <Pressable
                style={styles.cancelProposal}
                onPress={() => setShowProposalForm(false)}
              >
                <Text style={styles.cancelProposalText}>Cancelar</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
    padding: 16,
    paddingBottom: 120,
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

  proposalSection: {
    marginHorizontal: 20,
    marginTop: 10,
  },

  proposalBox: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    gap: 12,
  },

  proposalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  proposalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },

  cancelProposal: {
    paddingVertical: 12,
    alignItems: "center",
  },

  cancelProposalText: {
    fontWeight: "600",
  },
});
