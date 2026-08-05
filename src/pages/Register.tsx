import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


// Reaproveitando a mesma imagem do login
import LoginIllustration from "../assets/login-left.png";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

export default function Register() {
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        alert("Cadastro realizado com sucesso!");
        navigate("/login");
      } else {
        setError(data.message || "Erro ao cadastrar");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="register-container">
      {/* ========== LADO ESQUERDO (mesma ilustração do Login) ========== */}
      <div className="register-left">
        <img
          src={LoginIllustration}
          alt="Ilustração de cadastro"
          className="register-left-image"
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* ========== LADO DIREITO (formulário) ========== */}
      <div className="register-right">
        <div className="form-wrapper">
          <h1 className="register-title">Cadastre-se</h1>
          <p className="register-subtitle">
            Preencha seus dados para se cadastrar
          </p>

          <form onSubmit={handleSubmit}>
            {/* ====== CAMPO NOME (usando as mesmas classes dos outros inputs) ====== */}
            <div className="input-group name-group">
              <span className="input-icon user-icon">
                {/* Ícone de usuário (preto com opacidade 60%) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Nome Completo"
                value={form.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            {/* ====== CAMPO EMAIL ====== */}
            <div className="input-group">
              <span className="input-icon email-icon">
                {/* Ícone de e-mail (preto 60%) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="email@gmail.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* ====== CAMPO SENHA ====== */}
            <div className="input-group">
              <span className="input-icon lock-icon">
                {/* Ícone de cadeado (preto 60%) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            {/* Mensagem de erro, se existir */}
            {error && <p className="error-message">{error}</p>}

            {/* Botão “Cadastrar-se” */}
            <button type="submit" className="btn-register" disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Cadastrar-se"}
            </button>
          </form>

          {/* Link para voltar ao Login */}
          <p className="back-text">
            Já possui uma conta?{" "}
            <span className="back-link" onClick={() => navigate("/login")}>
              Entrar
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
