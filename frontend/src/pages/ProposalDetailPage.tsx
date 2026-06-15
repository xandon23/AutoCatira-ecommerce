import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { getImageUrl } from "../servicos/api";
// @ts-ignore
import "../styles/ProposalDetailPage.css";
import { IProposal, IVehicle, IUser } from "../types";

interface IProposalDetail extends Omit<IProposal, "buyer"> {
  buyer?: IUser;
  offeredVehicle?: IVehicle;
}

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<IProposalDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/proposals/${id}`)
      .then((res) => {
        setProposal(res.data);
        setLoading(false);
      })
      .catch((error: any) => {
        console.error("Erro ao buscar proposta:", error);
        alert("Erro ao carregar a proposta. Verifique sua conexão.");
        navigate("/perfil");
      });
  }, [id, navigate]);

  const handleDecision = async (decision: string) => {
    try {
      await api.patch(`/proposals/${id}/status`, { status: decision });
      alert(
        `Proposta ${decision === "ACCEPTED" ? "ACEITA" : "RECUSADA"} com sucesso!`,
      );
      navigate("/perfil");
    } catch (error: any) {
      alert(
        "Erro ao processar a decisão: " +
          (error.response?.data?.error || "Tente novamente."),
      );
    }
  };

  if (loading) {
    return (
      <div className="proposal-loading">Carregando detalhes da proposta...</div>
    );
  }

  if (!proposal) return null;

  return (
    <div className="proposal-page-container">
      <div className="proposal-card">
        <div className="proposal-header">
          <h2 className="proposal-title">Análise de Proposta</h2>
          <button
            onClick={() => navigate("/perfil")}
            className="proposal-btn-back"
          >
            Voltar
          </button>
        </div>

        <div className="proposal-info">
          <p>
            <strong>Comprador:</strong>{" "}
            {proposal.buyer?.name || "Não informado"} (📞{" "}
            {proposal.buyer?.phone || "Sem telefone"})
          </p>
          <p>
            <strong>Valor Ofertado:</strong>{" "}
            <span className="proposal-price">
              {Number(proposal.cashOffer).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </p>

          <div className="proposal-message-box">
            <strong className="proposal-message-label">
              Mensagem do Comprador:
            </strong>
            <p className="proposal-message-text">
              "{proposal.message || "Nenhuma mensagem enviada."}"
            </p>
          </div>
        </div>

        {proposal.offeredVehicle && (
          <div className="proposal-trade-box">
            <img
              src={
                proposal.offeredVehicle.images?.[0]?.url
                  ? getImageUrl(proposal.offeredVehicle.images[0].url) || ""
                  : "/fallback-autozoom.png"
              }
              alt="Troca"
              className="proposal-trade-image"
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src = "/fallback-autozoom.png";
              }}
            />
            <div>
              <h4 className="proposal-trade-title">Oferecido na Troca:</h4>
              <p className="proposal-trade-text">
                {proposal.offeredVehicle.brand} {proposal.offeredVehicle.model}{" "}
                ({proposal.offeredVehicle.manufactureYear})
              </p>
              <Link
                to={`/veiculo/${proposal.offeredVehicle.id}`}
                className="proposal-trade-link"
              >
                ↳ Ver Anúncio deste veículo
              </Link>
            </div>
          </div>
        )}

        {proposal.status === "PENDING" && (
          <div className="proposal-actions">
            <button
              onClick={() => handleDecision("ACCEPTED")}
              className="proposal-btn-accept"
            >
              ✓ ACEITAR PROPOSTA
            </button>
            <button
              onClick={() => handleDecision("REJECTED")}
              className="proposal-btn-reject"
            >
              X RECUSAR PROPOSTA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
