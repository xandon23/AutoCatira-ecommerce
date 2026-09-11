import axios from "axios";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { RootStackParamList } from "../navigation/types";
import { getVehicleById, updateVehicle } from "../services/vehicleService";

type Props = NativeStackScreenProps<RootStackParamList, "EditVehicle">;

const FEATURES = [
  "Airbag",
  "ABS",
  "Ar Condicionado",
  "Direção Elétrica",
  "Vidro Elétrico",
  "Travas Elétricas",
  "Câmera de Ré",
  "Sensor de Estacionamento",
  "Bancos de Couro",
  "Central Multimídia",
  "Bluetooth",
  "Rodas de Liga Leve",
];

export function EditVehicleScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [engine, setEngine] = useState("");
  const [transmission, setTransmission] = useState("Manual");
  const [mileage, setMileage] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVehicle() {
      try {
        setLoading(true);

        const vehicle = await getVehicleById(vehicleId);

        setBrand(vehicle.brand);
        setModel(vehicle.model);
        setManufactureYear(String(vehicle.manufactureYear));
        setModelYear(String(vehicle.modelYear));
        setEngine(vehicle.engine);
        setTransmission(vehicle.transmission);
        setMileage(String(vehicle.mileage));
        setPrice(String(vehicle.price));
        setLocation(vehicle.location);
        setDescription(vehicle.description);
        setFeatures(vehicle.features || []);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar o veículo.", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadVehicle();
  }, [vehicleId, navigation]);

  function toggleFeature(feature: string) {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature],
    );
  }

  async function handleSubmit() {
    if (
      !brand.trim() ||
      !model.trim() ||
      !manufactureYear ||
      !modelYear ||
      !engine.trim() ||
      !mileage ||
      !price ||
      !location.trim() ||
      !description.trim()
    ) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    const manufactureYearNumber = Number(manufactureYear);
    const modelYearNumber = Number(modelYear);
    const mileageNumber = Number(mileage);
    const priceNumber = Number(price.replace(",", "."));

    if (
      Number.isNaN(manufactureYearNumber) ||
      Number.isNaN(modelYearNumber) ||
      Number.isNaN(mileageNumber) ||
      Number.isNaN(priceNumber)
    ) {
      Alert.alert("Atenção", "Verifique os campos numéricos.");
      return;
    }

    const currentYear = new Date().getFullYear();

    if (priceNumber <= 0) {
      Alert.alert("Atenção", "O preço deve ser maior que zero.");
      return;
    }

    if (modelYearNumber < manufactureYearNumber) {
      Alert.alert(
        "Atenção",
        "O ano do modelo não pode ser anterior ao ano de fabricação.",
      );
      return;
    }

    if (modelYearNumber > manufactureYearNumber + 1) {
      Alert.alert(
        "Atenção",
        "O ano do modelo não pode ser superior a 1 ano do ano de fabricação.",
      );
      return;
    }

    if (manufactureYearNumber > currentYear) {
      Alert.alert(
        "Atenção",
        `O ano de fabricação não pode ser maior que ${currentYear}.`,
      );
      return;
    }

    try {
      setLoading(true);

      const response = await updateVehicle(vehicleId, {
        brand: brand.trim(),
        model: model.trim(),
        manufactureYear: manufactureYearNumber,
        modelYear: modelYearNumber,
        engine: engine.trim(),
        transmission,
        mileage: mileageNumber,
        price: priceNumber,
        location: location.trim(),
        description: description.trim(),
        features,
      });

      Alert.alert("Sucesso", response.message, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(
          "Erro ao atualizar veículo:",
          error.response?.status,
          error.response?.data,
        );

        Alert.alert(
          "Erro",
          error.response?.data?.error ||
            "Não foi possível atualizar o veículo.",
        );
      } else {
        console.log("Erro inesperado:", error);

        Alert.alert("Erro", "Ocorreu um erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Identificação</Text>

        <AppInput placeholder="Marca" value={brand} onChangeText={setBrand} />

        <AppInput placeholder="Modelo" value={model} onChangeText={setModel} />

        <AppInput
          placeholder="Ano de fabricação"
          value={manufactureYear}
          onChangeText={setManufactureYear}
          keyboardType="numeric"
        />

        <AppInput
          placeholder="Ano do modelo"
          value={modelYear}
          onChangeText={setModelYear}
          keyboardType="numeric"
        />

        <Text style={styles.sectionTitle}>Mecânica</Text>

        <AppInput
          placeholder="Motor (ex: 1.0)"
          value={engine}
          onChangeText={setEngine}
        />

        <Text style={styles.label}>Câmbio</Text>

        <View style={styles.options}>
          {["Manual", "Automático", "CVT"].map((item) => (
            <Pressable
              key={item}
              style={[
                styles.option,
                transmission === item && styles.optionSelected,
              ]}
              onPress={() => setTransmission(item)}
            >
              <Text
                style={[
                  styles.optionText,
                  transmission === item && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <AppInput
          placeholder="Quilometragem"
          value={mileage}
          onChangeText={setMileage}
          keyboardType="numeric"
        />

        <AppInput
          placeholder="Preço (ex: 50000)"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        <Text style={styles.sectionTitle}>Informações do anúncio</Text>

        <AppInput
          placeholder="Cidade/Estado"
          value={location}
          onChangeText={setLocation}
        />

        <AppInput
          placeholder="Descrição do veículo"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.sectionTitle}>Opcionais</Text>

        <View style={styles.features}>
          {FEATURES.map((feature) => {
            const selected = features.includes(feature);

            return (
              <Pressable
                key={feature}
                style={[styles.feature, selected && styles.featureSelected]}
                onPress={() => toggleFeature(feature)}
              >
                <Text
                  style={[
                    styles.featureText,
                    selected && styles.featureTextSelected,
                  ]}
                >
                  {feature}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.submit}>
          <AppButton
            title="Salvar alterações"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  content: {
    padding: 18,
    paddingBottom: 50,
    gap: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },

  label: {
    fontWeight: "600",
  },

  options: {
    flexDirection: "row",
    gap: 8,
  },

  option: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  optionSelected: {
    backgroundColor: "#222",
    borderColor: "#222",
  },

  optionText: {
    fontSize: 13,
  },

  optionTextSelected: {
    color: "#fff",
  },

  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  feature: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },

  featureSelected: {
    backgroundColor: "#222",
    borderColor: "#222",
  },

  featureText: {
    fontSize: 13,
  },

  featureTextSelected: {
    color: "#fff",
  },

  submit: {
    marginTop: 24,
  },
});
