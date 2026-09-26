import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { sendContactMessage } from "../services/contactService";

const SUPPORT_EMAIL = "support@skill-forge.study";
const REPO_URL      = "https://github.com/VUTP-University/skillforge";
const MAX_NAME      = 100;
const MAX_MESSAGE   = 5000;

function AlertIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function ContactPage() {
  const { user } = useAuth();

  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  // Prefill from the logged-in user once auth resolves, without clobbering
  // anything the visitor already typed.
  useEffect(() => {
    if (user && !name)  setName(user.username);
    if (user && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendContactMessage({ name: name.trim(), email: email.trim().toLowerCase(), message: message.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSendAnother() {
    setSent(false);
    setMessage("");
    setError("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ── */}
      <div className="term-window page-enter">
        <div className="term-bar">
          <span className="term-dot term-dot--red" />
          <span className="term-dot term-dot--yellow" />
          <span className="term-dot term-dot--green" />
          <span className="term-title">mail --compose {SUPPORT_EMAIL}</span>
        </div>
        <div className="term-body" style={{ textAlign: "center" }}>
          <p className="hero-eyebrow" style={{ justifyContent: "center" }}>$ mail --compose {SUPPORT_EMAIL}</p>
          <h1 className="glow-pulse" style={{
            fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: "clamp(2.4rem, 5vw, 3.4rem)", lineHeight: 1,
            color: "var(--color-green)", marginBottom: "0.6rem",
          }}>
            CONTACT(1)
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--color-text-secondary)", maxWidth: "480px", margin: "0 auto" }}>
            Got a question, a bug report, or feedback? Send us a message — we read every one.
          </p>
        </div>
      </div>

      {/* ── Body: form + info ── */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Form */}
        <div className="term-window" style={{ flex: "2 1 420px" }}>
          <div className="term-bar">
            <span className="term-dot term-dot--red" />
            <span className="term-dot term-dot--yellow" />
            <span className="term-dot term-dot--green" />
            <span className="term-title">./send_message.sh</span>
          </div>
          <div className="term-body">
            {sent ? (
              <>
                <div className="mb-7">
                  <h2 className="text-3xl font-bold text-white mb-1.5">Message sent</h2>
                  <p className="text-sub font-body text-lg">
                    Thanks, {name.trim()} — we'll get back to you at{" "}
                    <span style={{ color: "var(--color-green)" }}>{email.trim()}</span>.
                  </p>
                </div>

                <div className="sf-success">
                  <CheckIcon />
                  We typically reply within a few business days.
                </div>

                <button className="sf-btn-ghost" style={{ marginTop: "1.5rem", width: "auto" }} onClick={handleSendAnother}>
                  Send another message
                </button>
              </>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label className="sf-label" htmlFor="contact-name">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    className="sf-input"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={MAX_NAME}
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label className="sf-label" htmlFor="contact-email">Email address</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="sf-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="sf-label" htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    className="sf-input"
                    placeholder="What's on your mind?"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                    style={{ resize: "vertical" }}
                    required
                  />
                  <p style={{ marginTop: "0.35rem", fontSize: "0.718rem", color: "var(--color-text-faint)", fontFamily: "var(--font-heading)", textAlign: "right" }}>
                    {message.length} / {MAX_MESSAGE}
                  </p>
                </div>

                {error && (
                  <div className="sf-error">
                    <AlertIcon />
                    {error}
                  </div>
                )}

                <button type="submit" className="sf-btn" disabled={loading}>
                  {loading ? <><span className="sf-spinner" />Sending…</> : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="term-window" style={{ flex: "1 1 260px" }}>
          <div className="term-bar">
            <span className="term-dot term-dot--red" />
            <span className="term-dot term-dot--yellow" />
            <span className="term-dot term-dot--green" />
            <span className="term-title">whoami</span>
          </div>
          <div className="term-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <p className="sf-label" style={{ marginBottom: "0.5rem" }}>Email</p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-2"
                style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.87rem", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-green)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                <MailIcon />
                {SUPPORT_EMAIL}
              </a>
            </div>

            <div>
              <p className="sf-label" style={{ marginBottom: "0.5rem" }}>Source</p>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
                style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.87rem", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-green)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                <GitHubIcon />
                GitHub Repository
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
