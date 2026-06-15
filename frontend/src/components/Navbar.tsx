import { useContext } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import "../styles/Navbar.css";
import { AuthContext } from "../contexts/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { currentUser, handleLogout } = useContext(AuthContext);

  const handleSair = (): void => {
    handleLogout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div
        className="navbar-brand"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        <img src="/logofull2.png" alt="AutoZoom" className="navbar-logo" />
      </div>

      <div className="navbar-links">
        {currentUser && (
          <button className="navbar-link" onClick={() => navigate("/anunciar")}>
            + Anunciar
          </button>
        )}
      </div>

      <div>
        {currentUser ? (
          <div className="navbar-user-actions">
            <span
              className="navbar-user-btn"
              onClick={() => navigate(`/perfil/${currentUser.id}`)}
              style={{ cursor: "pointer" }}
            >
              👤 {currentUser.name?.split(" ")[0]}
            </span>

            <button className="navbar-btn-red" onClick={handleSair}>
              Sair
            </button>
          </div>
        ) : (
          <div className="navbar-auth-actions">
            <button
              className="navbar-btn-outline"
              onClick={() => navigate("/login")}
            >
              Entrar
            </button>

            <button
              className="navbar-btn-solid"
              onClick={() => navigate("/register")}
            >
              Cadastrar
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
