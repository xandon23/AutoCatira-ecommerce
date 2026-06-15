import { useState, useContext, ChangeEvent } from "react";
import { getVehicles } from "../servicos/api";
import VehicleCard from "../components/VehicleCard";
// @ts-ignore
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { IVehicle } from "../types";
import { useEffect } from "react";

function HeroBanner() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="circle circle-red" />
        <div className="circle circle-green" />
        <div className="hero-grid" />
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          O carro dos seus
          <br />
          <span>sonhos está aqui.</span>
        </h1>

        <p className="hero-sub">
          Compre, venda e negocie veículos com segurança e transparência.
        </p>

        {!currentUser ? (
          <div className="hero-actions">
            <button className="btn-green" onClick={() => navigate("/register")}>
              Criar Conta
            </button>
            <button className="btn-outline" onClick={() => navigate("/login")}>
              Entrar
            </button>
          </div>
        ) : (
          <div className="hero-actions">
            <button className="btn-green" onClick={() => navigate("/anunciar")}>
              Anunciar meu carro agora
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

interface IFilters {
  search: string;
  location: string;
  transmission: string;
  sort: string;
}

interface FilterBarProps {
  filters: IFilters;
  setFilters: React.Dispatch<React.SetStateAction<IFilters>>;
  onSearch: () => void;
}

function FilterBar({ filters, setFilters, onSearch }: FilterBarProps) {
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="filter-bar">
      <input
        className="filter-input"
        name="search"
        placeholder="Marca ou modelo..."
        value={filters.search}
        onChange={handleChange}
      />

      <input
        className="filter-input"
        name="location"
        placeholder="Cidade / Estado"
        value={filters.location}
        onChange={handleChange}
      />

      <select
        className="filter-input"
        name="transmission"
        value={filters.transmission}
        onChange={handleChange}
      >
        <option value="">Câmbio</option>
        <option value="Manual">Manual</option>
        <option value="Automático">Automático</option>
        <option value="CVT">CVT</option>
      </select>

      <select
        className="filter-input"
        name="sort"
        value={filters.sort}
        onChange={handleChange}
      >
        <option value="">Ordenar por</option>
        <option value="price_asc">Menor preço</option>
        <option value="price_desc">Maior preço</option>
        <option value="mileage_asc">Menor KM</option>
        <option value="newest">Mais recentes</option>
      </select>

      <button className="btn-green" onClick={onSearch}>
        Buscar
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton">
      <div className="skeleton-img" />
      <div className="skeleton-content">
        <div className="skeleton-line line-80" />
        <div className="skeleton-line line-55" />
        <div className="skeleton-line line-35" />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filters, setFilters] = useState<IFilters>({
    search: "",
    location: "",
    transmission: "",
    sort: "",
  });

  const fetchVehicles = async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getVehicles(pageNum, 12);

      const fetchedVehicles =
        data && Array.isArray(data.vehicles) ? data.vehicles : [];

      setVehicles(fetchedVehicles);

      if (data.total) {
        setTotalPages(Math.ceil(data.total / 12));
      } else {
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar veículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(currentPage);
  }, [currentPage]);

  const filtered = vehicles
    .filter((v) => {
      const q = filters.search.toLowerCase();
      if (
        q &&
        !v.brand.toLowerCase().includes(q) &&
        !v.model.toLowerCase().includes(q)
      )
        return false;
      if (
        filters.location &&
        !v.location?.toLowerCase().includes(filters.location.toLowerCase())
      )
        return false;
      if (filters.transmission && v.transmission !== filters.transmission)
        return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "price_asc") return a.price - b.price;
      if (filters.sort === "price_desc") return b.price - a.price;
      if (filters.sort === "mileage_asc")
        return (a.mileage || 0) - (b.mileage || 0);
      if (filters.sort === "newest")
        return (
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
        );
      return 0;
    });

  return (
    <div className="page">
      <HeroBanner />

      <main className="main">
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          onSearch={() => {
            fetchVehicles(1);
          }}
        />

        <div className="vitrine-header">
          <h2 className="vitrine-title">Veículos disponíveis</h2>

          {!loading && !error && (
            <span className="vitrine-count">
              {filtered.length} anúncio{filtered.length !== 1 ? "s" : ""}
            </span>
          )}

          {currentUser && (
            <button
              className="btn-green vitrine-btn"
              onClick={() => navigate("/anunciar")}
            >
              + Anunciar Veículo
            </button>
          )}
        </div>

        {error && (
          <div className="state-error">
            <span>⚠️</span>
            <p>{error}</p>
            <button className="btn-outline" onClick={() => fetchVehicles(1)}>
              Tentar novamente
            </button>
          </div>
        )}

        {!error && (
          <div className="cards-grid">
            {filtered.length === 0 && !loading ? (
              <div className="state-empty">
                <span className="empty-icon">🔍</span>
                <p>Nenhum veículo encontrado com esses filtros.</p>
              </div>
            ) : (
              filtered.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  onClick={() => navigate(`/veiculo/${v.id}`)}
                />
              ))
            )}

            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={`skel-${i}`} />
              ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              marginTop: "30px",
              paddingBottom: "20px",
            }}
          >
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn-outline"
            >
              ← Anterior
            </button>

            <span
              style={{ alignSelf: "center", color: "#fff", fontWeight: "bold" }}
            >
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="btn-outline"
            >
              Próxima →
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <span className="footer-brand">AutoZumm</span>
        <span className="footer-copy">
          © {new Date().getFullYear()} — Todos os direitos reservados
        </span>
      </footer>
    </div>
  );
}
