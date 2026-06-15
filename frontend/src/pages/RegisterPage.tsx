import { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../servicos/api";
// @ts-ignore
import "../styles/RegisterPage.css";

interface IFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  cpf?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<IFormErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const isValidCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let calc = (n: number) => {
      let sum = 0;
      for (let i = 0; i < n - 1; i++) sum += parseInt(cpf.charAt(i)) * (n - i);
      let rev = 11 - (sum % 11);
      return rev === 10 || rev === 11 ? 0 : rev;
    };
    return (
      calc(10) === parseInt(cpf.charAt(9)) &&
      calc(11) === parseInt(cpf.charAt(10))
    );
  };

  const validate = (): IFormErrors => {
    const newErrors: IFormErrors = {};

    if (!form.name.trim()) newErrors.name = "Nome é obrigatório.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      newErrors.email = "Digite um e-mail válido. Ex: joao@gmail.com";
    }

    if (!form.phone.trim()) newErrors.phone = "Telefone é obrigatório.";

    if (!isValidCPF(form.cpf)) {
      newErrors.cpf = "CPF inválido. Verifique a numeração.";
    }

    if (!form.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória.";
    } else {
      const age = Math.floor(
        (Date.now() - new Date(form.birthDate).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      );
      if (age < 18) newErrors.birthDate = "Você precisa ter 18 anos ou mais.";
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(form.password)) {
      newErrors.password =
        "A senha precisa de 8+ caracteres, maiúscula, número e símbolo.";
    }

    // Regra da Rubrica: Verificação Dupla de Senha
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem.";
    }

    return newErrors;
  };

  const translateBackendError = (message: string): string => {
    if (!message) return "Erro desconhecido. Tente novamente.";
    const msg = message.toLowerCase();

    if (msg.includes("cpf")) return "❌ CPF inválido ou já cadastrado.";
    if (msg.includes("email")) return "❌ Este e-mail já está em uso.";
    if (msg.includes("18")) return "❌ Você precisa ter 18 anos ou mais.";

    return `❌ ${message}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    const localErrors = validate();
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      payload.cpf = payload.cpf.replace(/[^\d]+/g, "");

      await createUser(payload);
      navigate("/login");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message;
      setGlobalError(translateBackendError(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-center">
        <div className="register-card">
          <h2 className="register-title">Criar Conta</h2>
          <p className="register-sub">Preencha seus dados para negociar</p>

          {globalError && (
            <div className="register-error" role="alert">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-group">
              <label className="register-label">Nome completo *</label>
              <input
                className="register-input"
                name="name"
                value={form.name}
                onChange={handle}
                required
              />
              {errors.name && (
                <span className="register-field-error">{errors.name}</span>
              )}
            </div>

            <div className="register-group">
              <label className="register-label">E-mail *</label>
              <input
                className="register-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handle}
                required
              />
              {errors.email && (
                <span className="register-field-error">{errors.email}</span>
              )}
            </div>

            <div className="register-row">
              <div className="register-group">
                <label className="register-label">Telefone *</label>
                <input
                  className="register-input"
                  name="phone"
                  value={form.phone}
                  onChange={handle}
                  required
                />
                {errors.phone && (
                  <span className="register-field-error">{errors.phone}</span>
                )}
              </div>
              <div className="register-group">
                <label className="register-label">Nascimento *</label>
                <input
                  className="register-input"
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handle}
                  required
                />
                {errors.birthDate && (
                  <span className="register-field-error">
                    {errors.birthDate}
                  </span>
                )}
              </div>
            </div>

            <div className="register-group">
              <label className="register-label">CPF *</label>
              <input
                className="register-input"
                name="cpf"
                placeholder="Apenas números"
                value={form.cpf}
                onChange={handle}
                required
              />
              {errors.cpf && (
                <span className="register-field-error">{errors.cpf}</span>
              )}
            </div>

            <div className="register-group">
              <label className="register-label">Senha *</label>
              <input
                className="register-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handle}
                required
              />
              {errors.password && (
                <span className="register-field-error">{errors.password}</span>
              )}
            </div>

            <div className="register-group">
              <label className="register-label">Confirmar Senha *</label>
              <input
                className="register-input"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handle}
                required
              />
              {errors.confirmPassword && (
                <span className="register-field-error">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <button className="register-btn" type="submit" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <p className="register-footer">
            Já tem conta?{" "}
            <span className="register-link" onClick={() => navigate("/login")}>
              Entrar
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
