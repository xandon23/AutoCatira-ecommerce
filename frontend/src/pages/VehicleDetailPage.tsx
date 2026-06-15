import { useState, useEffect, useContext, FormEvent } from "react";
import api, {
  getVehicleById,
  createProposal,
  getProposalsByVehicle,
  updateProposalStatus,
  getVehicles,
  getImageUrl,
} from "../servicos/api";
// @ts-ignore
import "../styles/VehicleDetailPage.css";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { IVehicle, IProposal, IVehicleImage } from "../types";

interface IProposalForm {
  cashOffer: string | number;
  message: string;
  offeredVehicleId: string;
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id;
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const [vehicle, setVehicle] = useState<IVehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [proposals, setProposals] = useState<IProposal[]>([]);
  const [myVehicles, setMyVehicles] = useState<IVehicle[]>([]);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [imgIndex, setImgIndex] = useState<number>(0);
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");

  const [form, setForm] = useState<IProposalForm>({
    cashOffer: "",
    message: "",
    offeredVehicleId: "",
  });

  const [propError, setPropError] = useState<string>("");
  const [propSuccess, setPropSuccess] = useState<string>("");

  const isOwner =
    currentUser && vehicle && String(currentUser.id) === String(vehicle.userId);

  useEffect(() => {
    if (vehicleId) {
      getVehicleById(vehicleId).then((v: any) => {
        setVehicle(v);
        setLoading(false);
      });
    }
  }, [vehicleId]);

  useEffect(() => {
    if (isOwner && vehicleId) {
      getProposalsByVehicle(vehicleId)
        .then((res) => {
          setProposals(Array.isArray(res) ? res : []);
        })
        .catch(console.error);
    }
  }, [isOwner, vehicleId]);

  useEffect(() => {
    if (currentUser && showForm) {
      getVehicles().then((res: any) => {
        const vehiclesArray: IVehicle[] =
          res && Array.isArray(res.vehicles)
            ? res.vehicles
            : Array.isArray(res)
              ? res
              : [];

        setMyVehicles(
          vehiclesArray.filter(
            (v) =>
              String(v.userId) === String(currentUser.id) &&
              String(v.id) !== String(vehicleId),
          ),
        );
      });
    }
  }, [currentUser, showForm, vehicleId]);

  const handleProposal = async (e: FormEvent) => {
    e.preventDefault();
    setPropError("");
    setPropSuccess("");
    if (!vehicleId) return;

    const res: any = await createProposal({
      targetVehicleId: vehicleId,
      cashOffer: Number(form.cashOffer),
      message: form.message,
      offeredVehicleId: form.offeredVehicleId || undefined,
    });

    if (res.error) {
      setPropError(res.error);
      return;
    }

    setPropSuccess("Proposta enviada!");
    setShowForm(false);
  };

  const handleStatus = async (propId: string, status: string) => {
    try {
      await updateProposalStatus(propId, status);
      setProposals((prev) =>
        prev.map((p) => (p.id === propId ? { ...p, status } : p)),
      );
    } catch (error: any) {
      alert(
        "Erro ao atualizar status: " +
          (error.response?.data?.error || "Verifique a conexão."),
      );
    }
  };

  if (loading) {
    return (
      <div className="vehicle-detail-page">
        <div className="vehicle-detail-center">Carregando...</div>
      </div>
    );
  }

  if (!vehicle || (vehicle as any).error) {
    return (
      <div className="vehicle-detail-page">
        <div className="vehicle-detail-center">Veículo não encontrado.</div>
      </div>
    );
  }

  const images: IVehicleImage[] = vehicle.images || [];
  const price = Number(vehicle.price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="vehicle-detail-page">
      <div className="vehicle-detail-layout">
        <div>
          <div className="vehicle-detail-img-main">
            <img
              src={
                images.length > 0
                  ? getImageUrl(images[imgIndex].url) || ""
                  : "/fallback-autozoom.png"
              }
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="vehicle-detail-main-image"
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src = "/fallback-autozoom.png";
              }}
            />
            {images.length > 1 && (
              <div className="vehicle-detail-nav-row">
                <button
                  className="vehicle-detail-nav-btn"
                  onClick={() =>
                    setImgIndex((i) => (i - 1 + images.length) % images.length)
                  }
                >
                  ‹
                </button>
                <span className="vehicle-detail-counter">
                  {imgIndex + 1}/{images.length}
                </span>
                <button
                  className="vehicle-detail-nav-btn"
                  onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="vehicle-detail-thumbs">
              {images.map((img, i) => (
                <img
                  key={img.id || i}
                  src={getImageUrl(img.url) || ""}
                  alt={`Foto ${i + 1} de ${vehicle.model}`}
                  onClick={() => setImgIndex(i)}
                  className={`vehicle-detail-thumb ${i === imgIndex ? "vehicle-detail-thumb-active" : ""}`}
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = "/fallback-autozoom.png";
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="vehicle-detail-info">
          <div className="vehicle-detail-header">
            <div>
              <h1 className="vehicle-detail-name">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="vehicle-detail-year">
                {vehicle.manufactureYear}/{vehicle.modelYear}
              </p>
            </div>
            <span className="vehicle-detail-price">{price}</span>
          </div>

          <div className="vehicle-detail-specs">
            {[
              ["Motor", vehicle.engine],
              ["Câmbio", vehicle.transmission],
              ["KM", vehicle.mileage?.toLocaleString("pt-BR")],
              ["Local", vehicle.location],
            ].map(([k, v]) => (
              <div key={k} className="vehicle-detail-spec">
                <span className="vehicle-detail-spec-label">{k}</span>
                <strong className="vehicle-detail-spec-val">{v}</strong>
              </div>
            ))}
          </div>

          {vehicle.features && vehicle.features.length > 0 && (
            <div>
              <p className="vehicle-detail-section-label">Opcionais</p>
              <div className="vehicle-detail-tags">
                {vehicle.features.map((f) => (
                  <span key={f} className="vehicle-detail-tag">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="vehicle-detail-section-label">Descrição</p>
            <p className="vehicle-detail-description">{vehicle.description}</p>
          </div>

          <div className="vehicle-detail-seller">
            <div className="vehicle-detail-avatar">
              {vehicle.user?.name?.[0]?.toUpperCase() || "V"}
            </div>
            <div>
              <strong className="vehicle-detail-seller-name">
                {vehicle.user?.name || "Vendedor"}
              </strong>
              <p className="vehicle-detail-seller-email">
                {vehicle.user?.email}
              </p>
            </div>
          </div>

          {!currentUser && (
            <button
              className="vehicle-detail-btn"
              onClick={() => navigate("/login")}
            >
              Entre para fazer proposta
            </button>
          )}

          {currentUser && !isOwner && (
            <button
              className="vehicle-detail-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancelar" : "Fazer Proposta"}
            </button>
          )}

          {isOwner && (
            <button
              className="vehicle-detail-btn-outline"
              onClick={() => navigate(`/editar-veiculo/${vehicleId}`)}
            >
              Editar Anúncio
            </button>
          )}

          {showForm && (
            <div className="vehicle-detail-prop-form">
              <h4 className="vehicle-detail-form-title">Sua Proposta</h4>
              {propError && (
                <div className="vehicle-detail-error">{propError}</div>
              )}
              {propSuccess && (
                <div className="vehicle-detail-success">{propSuccess}</div>
              )}

              <form
                onSubmit={handleProposal}
                className="vehicle-detail-form-fields"
              >
                <div>
                  <label className="vehicle-detail-label">Valor (R$)</label>
                  <input
                    className="vehicle-detail-input"
                    type="number"
                    placeholder="45000"
                    value={form.cashOffer}
                    onChange={(e) =>
                      setForm({ ...form, cashOffer: e.target.value })
                    }
                    required
                  />
                </div>
                {myVehicles.length > 0 && (
                  <div>
                    <label className="vehicle-detail-label">
                      Oferecer na troca (opcional)
                    </label>
                    <select
                      className="vehicle-detail-input"
                      value={form.offeredVehicleId}
                      onChange={(e) =>
                        setForm({ ...form, offeredVehicleId: e.target.value })
                      }
                    >
                      <option value="">Somente dinheiro</option>
                      {myVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.brand} {v.model} ({v.manufactureYear})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="vehicle-detail-label">Mensagem</label>
                  <textarea
                    className="vehicle-detail-input vehicle-detail-textarea"
                    rows={3}
                    placeholder="Pago à vista se fechar hoje!"
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                  />
                </div>
                <button type="submit" className="vehicle-detail-btn">
                  Enviar Proposta
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="vehicle-detail-prop-section">
          <ProposalList proposals={proposals} onUpdateStatus={handleStatus} />

          <div className="vehicle-detail-sell-box">
            <h3 className="vehicle-detail-sell-title">
              Finalizar Venda do Veículo
            </h3>
            <div>
              <label className="vehicle-detail-sell-label">
                Selecione o Comprador:
              </label>
              <select
                className="vehicle-detail-sell-select"
                value={selectedBuyer}
                onChange={(e) => setSelectedBuyer(e.target.value)}
              >
                <option value="">Selecione...</option>
                {proposals
                  .filter((p) => p.status === "ACCEPTED")
                  .map((p) => (
                    <option key={p.id} value={p.buyerId}>
                      {p.buyer?.name || "Comprador"} (Proposta Aceita)
                    </option>
                  ))}
                <option value="OUTRA_PLATAFORMA">
                  Vendido em outra plataforma / Fora do site
                </option>
              </select>

              <button
                className="vehicle-detail-btn-green vehicle-detail-sell-confirm"
                disabled={!selectedBuyer}
                onClick={async () => {
                  try {
                    const payload =
                      selectedBuyer === "OUTRA_PLATAFORMA"
                        ? { buyerId: null }
                        : { buyerId: selectedBuyer };
                    await api.patch(`/vehicles/${vehicleId}/sell`, payload);
                    alert("Veículo marcado como vendido com sucesso!");
                    navigate(`/perfil/${currentUser.id}`);
                  } catch (error: any) {
                    alert(
                      "Erro ao finalizar venda: " +
                        (error.response?.data?.error ||
                          "Verifique sua conexão."),
                    );
                  }
                }}
              >
                Confirmar Venda e Encerrar Anúncio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProposalListProps {
  proposals: IProposal[];
  onUpdateStatus: (id: string, status: string) => void;
}

function ProposalList({ proposals, onUpdateStatus }: ProposalListProps) {
  if (proposals.length === 0) return null;

  return (
    <div className="vehicle-detail-proposals-box">
      <h3 className="vehicle-detail-proposals-title">
        Propostas Recebidas ({proposals.length})
      </h3>
      <div className="vehicle-detail-proposals-list">
        {proposals.map((p) => (
          <div key={p.id} className="vehicle-detail-proposal-item">
            <div className="vehicle-detail-proposal-header">
              <strong className="vehicle-detail-proposal-price">
                {Number(p.cashOffer).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
              <span
                className={`vehicle-detail-proposal-badge ${p.status === "ACCEPTED" ? "badge-accepted" : p.status === "REJECTED" ? "badge-rejected" : "badge-pending"}`}
              >
                {p.status === "PENDING"
                  ? "Pendente"
                  : p.status === "ACCEPTED"
                    ? "Aceita"
                    : "Recusada"}
              </span>
            </div>
            <p className="vehicle-detail-proposal-buyer">
              <strong>Comprador:</strong> {p.buyer?.name || "Desconhecido"}
            </p>
            {p.message && (
              <p className="vehicle-detail-proposal-msg">"{p.message}"</p>
            )}

            {p.status === "PENDING" && (
              <div className="vehicle-detail-proposal-actions">
                <button
                  onClick={() => p.id && onUpdateStatus(p.id, "ACCEPTED")}
                  className="btn-accept-prop"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => p.id && onUpdateStatus(p.id, "REJECTED")}
                  className="btn-reject-prop"
                >
                  Recusar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
