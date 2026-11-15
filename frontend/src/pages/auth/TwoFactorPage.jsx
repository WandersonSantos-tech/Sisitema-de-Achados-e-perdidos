import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../services/api";
import "./AuthFormPage.css";

export default function TwoFactorPage() {
  const [setup, setSetup] = useState(null),
    [code, setCode] = useState(""),
    [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function run(path, body) {
    setBusy(true);
    setMessage("");
    try {
      const result = await apiRequest("/security/2fa/" + path, {
        method: "POST",
        body: JSON.stringify(body || {}),
      });
      if (path === "setup") setSetup(result);
      else {
        setSetup(null);
        setCode("");
        setPassword("");
        setMessage(result.message);
      }
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-form-page">
      <section className="auth-form-card">
        <Link to="/login">Voltar ao acesso</Link>
        <h1>Autenticação de dois fatores</h1>
        <p>
          Use um aplicativo autenticador. Guarde acesso a ele: redefinir a senha
          não desativa o segundo fator.
        </p>
        {message && <p role="status">{message}</p>}
        <button disabled={busy} onClick={() => run("setup")}>
          Configurar 2FA
        </button>
        {setup && (
          <>
            <img
              src={setup.qr_code}
              alt="QR Code para o autenticador"
              style={{ width: "100%", maxWidth: 260 }}
            />
            <p>
              Chave manual: <code>{setup.secret}</code>
            </p>
          </>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(setup ? "verify" : "disable", { code, password });
          }}
        >
          <div className="auth-field">
            <label>
              Código de seis dígitos
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
          </div>
          {!setup && (
            <div className="auth-field">
              <label>
                Senha atual para desativar
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </div>
          )}
          <button className="auth-submit-button" disabled={busy}>
            {busy
              ? "Aguarde..."
              : setup
                ? "Confirmar ativação"
                : "Desativar 2FA"}
          </button>
        </form>
        <button
          disabled={busy}
          onClick={() => {
            setSetup(null);
            setCode("");
          }}
        >
          Cancelar
        </button>
      </section>
    </main>
  );
}
