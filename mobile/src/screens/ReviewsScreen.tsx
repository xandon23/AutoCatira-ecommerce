import { useCallback, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

import { getImageUrl } from "../services/api";

import {
  createReview,
  getPendingReviews,
  getReceivedReviews,
  IPendingReview,
  IReceivedReview,
} from "../services/reviewService";

type Tab = "PENDING" | "RECEIVED";

export function ReviewsScreen() {
  const [tab, setTab] = useState<Tab>("PENDING");

  const [pending, setPending] = useState<IPendingReview[]>([]);

  const [received, setReceived] = useState<IReceivedReview[]>([]);

  const [ratings, setRatings] = useState<Record<string, number>>({});

  const [comments, setComments] = useState<Record<string, string>>({});

  const [sendingId, setSendingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const [pendingResponse, receivedResponse] = await Promise.all([
        getPendingReviews(),
        getReceivedReviews(),
      ]);

      setPending(pendingResponse);
      setReceived(receivedResponse);
    } catch (error) {
      console.log("Erro ao carregar avaliações:", error);

      Alert.alert("Erro", "Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews]),
  );

  const average = useMemo(() => {
    if (!received.length) {
      return 0;
    }

    const total = received.reduce(
      (sum, review) => sum + Number(review.rating),
      0,
    );

    return total / received.length;
  }, [received]);

  function renderStars(value: number, onPress?: (rating: number) => void) {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            disabled={!onPress}
            onPress={() => onPress?.(star)}
            hitSlop={6}
          >
            <Text style={styles.star}>{star <= value ? "★" : "☆"}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  async function handleSubmit(item: IPendingReview) {
    const rating = ratings[item.proposalId] || 0;

    const comment = comments[item.proposalId] || "";

    if (!rating) {
      Alert.alert("Avaliação", "Escolha uma nota de 1 a 5 estrelas.");

      return;
    }

    try {
      setSendingId(item.proposalId);

      const response = await createReview({
        proposalId: item.proposalId,

        rating,

        comment: comment.trim() || undefined,
      });

      Alert.alert("Avaliação enviada", response.message);

      setRatings((current) => {
        const updated = {
          ...current,
        };

        delete updated[item.proposalId];

        return updated;
      });

      setComments((current) => {
        const updated = {
          ...current,
        };

        delete updated[item.proposalId];

        return updated;
      });

      await loadReviews();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          "Erro",
          error.response?.data?.error || "Não foi possível enviar a avaliação.",
        );

        return;
      }

      Alert.alert("Erro", "Ocorreu um erro inesperado.");
    } finally {
      setSendingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Carregando avaliações...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Avaliações</Text>

            <Text style={styles.subtitle}>
              Avalie suas negociações e acompanhe sua reputação no AutoCatira.
            </Text>
          </View>

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, tab === "PENDING" && styles.tabSelected]}
              onPress={() => setTab("PENDING")}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "PENDING" && styles.tabTextSelected,
                ]}
              >
                Pendentes ({pending.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, tab === "RECEIVED" && styles.tabSelected]}
              onPress={() => setTab("RECEIVED")}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "RECEIVED" && styles.tabTextSelected,
                ]}
              >
                Recebidas ({received.length})
              </Text>
            </Pressable>
          </View>

          {tab === "PENDING" ? (
            <>
              {!pending.length ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>
                    Nenhuma avaliação pendente
                  </Text>

                  <Text style={styles.emptyText}>
                    Quando uma negociação for concluída, você poderá avaliar a
                    outra pessoa aqui.
                  </Text>
                </View>
              ) : (
                pending.map((item) => {
                  const imageUrl = getImageUrl(
                    item.targetVehicle?.images?.[0]?.url,
                  );

                  const rating = ratings[item.proposalId] || 0;

                  const comment = comments[item.proposalId] || "";

                  const sending = sendingId === item.proposalId;

                  return (
                    <View key={item.proposalId} style={styles.card}>
                      {imageUrl ? (
                        <Image
                          source={{
                            uri: imageUrl,
                          }}
                          style={styles.vehicleImage}
                        />
                      ) : null}

                      <Text style={styles.vehicleTitle}>
                        {item.targetVehicle.brand} {item.targetVehicle.model}{" "}
                        {item.targetVehicle.modelYear}
                      </Text>

                      <Text style={styles.label}>Avaliar</Text>

                      <Text style={styles.personName}>
                        {item.reviewedUser.name}
                      </Text>

                      <Text style={styles.helper}>
                        {item.role === "BUYER"
                          ? "Você participou como comprador."
                          : "Você participou como vendedor."}
                      </Text>

                      <Text style={styles.ratingLabel}>
                        Como foi a negociação?
                      </Text>

                      {renderStars(rating, (value) =>
                        setRatings((current) => ({
                          ...current,

                          [item.proposalId]: value,
                        })),
                      )}

                      <TextInput
                        style={styles.commentInput}
                        placeholder="Conte como foi sua experiência (opcional)"
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                        value={comment}
                        onChangeText={(value) =>
                          setComments((current) => ({
                            ...current,

                            [item.proposalId]: value,
                          }))
                        }
                      />

                      <Text style={styles.counter}>{comment.length}/500</Text>

                      <Pressable
                        disabled={sending}
                        style={[
                          styles.submitButton,
                          sending && styles.disabled,
                        ]}
                        onPress={() => handleSubmit(item)}
                      >
                        <Text style={styles.submitButtonText}>
                          {sending ? "Enviando..." : "Enviar avaliação"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </>
          ) : (
            <>
              <View style={styles.reputationCard}>
                <Text style={styles.reputationLabel}>Sua reputação</Text>

                <Text style={styles.average}>
                  {received.length ? average.toFixed(1) : "—"}
                </Text>

                {renderStars(Math.round(average))}

                <Text style={styles.reviewCount}>
                  {received.length}{" "}
                  {received.length === 1
                    ? "avaliação recebida"
                    : "avaliações recebidas"}
                </Text>
              </View>

              {!received.length ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>
                    Nenhuma avaliação recebida
                  </Text>

                  <Text style={styles.emptyText}>
                    Suas avaliações aparecerão aqui após negociações concluídas.
                  </Text>
                </View>
              ) : (
                received.map((review) => {
                  const vehicle = review.proposal?.targetVehicle;

                  return (
                    <View key={review.id} style={styles.card}>
                      <View style={styles.reviewHeader}>
                        <View>
                          <Text style={styles.reviewerName}>
                            {review.reviewer.name}
                          </Text>

                          {vehicle ? (
                            <Text style={styles.reviewVehicle}>
                              {vehicle.brand} {vehicle.model}{" "}
                              {vehicle.modelYear}
                            </Text>
                          ) : null}
                        </View>

                        <Text style={styles.ratingNumber}>
                          {review.rating}/5
                        </Text>
                      </View>

                      {renderStars(Number(review.rating))}

                      {review.comment ? (
                        <Text style={styles.comment}>“{review.comment}”</Text>
                      ) : (
                        <Text style={styles.noComment}>
                          Avaliação sem comentário.
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 6,
    color: "#666",
    lineHeight: 21,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#e9e9e9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },

  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 9,
  },

  tabSelected: {
    backgroundColor: "#fff",
  },

  tabText: {
    color: "#666",
    fontWeight: "700",
    fontSize: 13,
  },

  tabTextSelected: {
    color: "#1677ff",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 17,
    marginBottom: 16,
  },

  vehicleImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 14,
  },

  vehicleTitle: {
    fontSize: 20,
    fontWeight: "800",
  },

  label: {
    marginTop: 14,
    fontSize: 12,
    color: "#777",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  personName: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
  },

  helper: {
    color: "#777",
    marginTop: 4,
  },

  ratingLabel: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: "700",
  },

  stars: {
    flexDirection: "row",
    marginTop: 8,
    gap: 4,
  },

  star: {
    fontSize: 34,
    color: "#f5a623",
  },

  commentInput: {
    minHeight: 100,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fafafa",
    padding: 13,
    fontSize: 16,
    textAlignVertical: "top",
  },

  counter: {
    textAlign: "right",
    color: "#888",
    fontSize: 12,
    marginTop: 5,
  },

  submitButton: {
    height: 50,
    backgroundColor: "#1677ff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },

  submitButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  reputationCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    marginBottom: 18,
  },

  reputationLabel: {
    color: "#666",
    fontWeight: "700",
  },

  average: {
    fontSize: 42,
    fontWeight: "800",
    marginTop: 4,
  },

  reviewCount: {
    color: "#777",
    marginTop: 8,
  },

  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  reviewerName: {
    fontSize: 17,
    fontWeight: "800",
  },

  reviewVehicle: {
    color: "#777",
    marginTop: 3,
  },

  ratingNumber: {
    fontSize: 17,
    fontWeight: "800",
  },

  comment: {
    marginTop: 14,
    color: "#444",
    lineHeight: 21,
    fontStyle: "italic",
  },

  noComment: {
    marginTop: 14,
    color: "#888",
  },

  empty: {
    paddingVertical: 70,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 8,
    color: "#666",
    lineHeight: 21,
    textAlign: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
  },

  disabled: {
    opacity: 0.5,
  },
});
