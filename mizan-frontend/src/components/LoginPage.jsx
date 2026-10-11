
import React, { useState } from 'react';
import fondConnexion from '../assets/login-background.jpg';

const API_URL = 'http://localhost:5000/api';

// ============================================================
// ICÔNES SVG
// ============================================================

const IconAncre = () => (
    <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v13" />
        <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
        <path d="M9 9l3-2 3 2" />
    </svg>
);

const IconBadge = () => (
    <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20v-1a5 5 0 0 1 10 0v1" />
    </svg>
);

const IconCadenas = () => (
    <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconFleche = () => (
    <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
    </svg>
);

const IconSupport = () => (
    <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
);

const IconCheck = () => (
    <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 6L9 17l-5-5" />
    </svg>
);

const PRIMARY = '#315CA8';

// ============================================================
// LOGIN PAGE
// ============================================================

export default function LoginPage({ onLoginSuccess }) {

    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [erreur, setErreur] = useState('');
    const [chargement, setChargement] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);
    const [pinFocus, setPinFocus] = useState(false);

    // ========================================================
    // LOGIQUE DE CONNEXION
    // ========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErreur('');
        setChargement(true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    mot_de_passe: motDePasse
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErreur(data.error || 'Identifiants invalides.');
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem(
                'user',
                JSON.stringify(data.user)
            );

            if (onLoginSuccess) {
                onLoginSuccess(data.user);
            }

        } catch {
            setErreur(
                'Serveur injoignable. Vérifie que le backend tourne (port 5000).'
            );
        } finally {
            setChargement(false);
        }
    };

    // ========================================================
    // INTERFACE
    // ========================================================

    return (
        <>
            <div className="mizan-login">

                {/* ==================================================
                    BACKGROUND
                ================================================== */}

                <div className="mizan-background" />

                <div className="mizan-overlay" />

                <div className="background-glow glow-one" />
                <div className="background-glow glow-two" />

                {/* ==================================================
                    CONTENU PRINCIPAL
                ================================================== */}

                <main className="login-container">

                    {/* ==================================================
                        LOGO / BRANDING
                    ================================================== */}

                    <header className="brand-section">

                        <div className="brand-logo">
                            <IconAncre />
                        </div>

                        <h1>Marsa Maroc</h1>

                        <div className="brand-subtitle">
                            <span />
                            <p>Mizan · Weigh System</p>
                            <span />
                        </div>

                    </header>

                    {/* ==================================================
                        CARTE DE CONNEXION
                    ================================================== */}

                    <form
                        className="login-card"
                        onSubmit={handleSubmit}
                    >

                        <div className="card-top-line" />

                        <div className="card-header">

                            <h2>Bienvenue</h2>

                            <p>
                                Connectez-vous à votre espace Mizan.
                            </p>

                        </div>

                        {/* ==================================================
                            ERREUR
                        ================================================== */}

                        {erreur && (
                            <div className="error-message">

                                <div className="error-dot" />

                                <span>
                                    {erreur}
                                </span>

                            </div>
                        )}

                        {/* ==================================================
                            EMAIL
                        ================================================== */}

                        <div className="field-group">

                            <label htmlFor="email">
                                Adresse email
                            </label>

                            <div
                                className={`input-wrapper ${emailFocus
                                    ? 'input-active'
                                    : ''
                                    }`}
                            >

                                <span className="input-icon">
                                    <IconBadge />
                                </span>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    onFocus={() =>
                                        setEmailFocus(true)
                                    }
                                    onBlur={() =>
                                        setEmailFocus(false)
                                    }
                                    placeholder="admin@mizan.local"
                                    required
                                    autoComplete="email"
                                />

                            </div>

                        </div>

                        {/* ==================================================
                            MOT DE PASSE
                        ================================================== */}

                        <div className="field-group password-group">

                            <label htmlFor="password">
                                Mot de passe
                            </label>

                            <div
                                className={`input-wrapper ${pinFocus
                                    ? 'input-active'
                                    : ''
                                    }`}
                            >

                                <span className="input-icon">
                                    <IconCadenas />
                                </span>

                                <input
                                    id="password"
                                    type="password"
                                    value={motDePasse}
                                    onChange={(e) =>
                                        setMotDePasse(
                                            e.target.value
                                        )
                                    }
                                    onFocus={() =>
                                        setPinFocus(true)
                                    }
                                    onBlur={() =>
                                        setPinFocus(false)
                                    }
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />

                            </div>

                        </div>

                        {/* ==================================================
                            BOUTON CONNEXION
                        ================================================== */}

                        <button
                            type="submit"
                            className={`login-button ${chargement
                                ? 'button-loading'
                                : ''
                                }`}
                            disabled={chargement}
                        >

                            {chargement ? (
                                <>
                                    <span className="spinner" />

                                    <span>
                                        Connexion en cours...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span>
                                        Se connecter
                                    </span>

                                    <IconFleche />
                                </>
                            )}

                        </button>

                        {/* ==================================================
                            SECURITE
                        ================================================== */}

                        <div className="secure-login">

                            <span className="secure-icon">
                                <IconCheck />
                            </span>

                            <span>
                                Connexion sécurisée
                            </span>

                        </div>

                    </form>

                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <footer className="login-footer">

                        <a href="#">
                            <IconSupport />
                            <span>
                                Contacter le support
                            </span>
                        </a>

                        <div className="version">

                            <i />
                            <span>
                                MIZAN_V1.0_STABLE
                            </span>
                            <i />

                        </div>

                    </footer>

                </main>

            </div>

            {/* ==========================================================
                STYLES
            ========================================================== */}

            <style>{`

                * {
                    box-sizing: border-box;
                }

                html,
                body,
                #root {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    min-height: 100%;
                }

                body {
                    font-family:
                        'Inter',
                        'Segoe UI',
                        -apple-system,
                        BlinkMacSystemFont,
                        sans-serif;
                }

                /* =====================================================
                   CONTAINER
                ===================================================== */

                .mizan-login {
                    min-height: 100vh;
                    width: 100%;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 45px 20px;
                    overflow: hidden;
                    background: #0b1931;
                }

                /* =====================================================
                   BACKGROUND
                ===================================================== */

                .mizan-background {
                    position: absolute;
                    inset: 0;
                    background-image:
                        url(${fondConnexion});
                    background-size: cover;
                    background-position: center;
                    transform: scale(1.03);
                }

                .mizan-overlay {
                    position: absolute;
                    inset: 0;

                    background:
                        linear-gradient(
                            135deg,
                            rgba(5, 16, 34, 0.90) 0%,
                            rgba(14, 34, 65, 0.76) 48%,
                            rgba(5, 17, 37, 0.91) 100%
                        );
                }

                .background-glow {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                }

                .glow-one {
                    width: 520px;
                    height: 520px;
                    top: -300px;
                    left: -150px;

                    background:
                        radial-gradient(
                            circle,
                            rgba(75, 123, 198, 0.22) 0%,
                            rgba(75, 123, 198, 0) 70%
                        );
                }

                .glow-two {
                    width: 650px;
                    height: 650px;
                    right: -300px;
                    bottom: -420px;

                    background:
                        radial-gradient(
                            circle,
                            rgba(53, 103, 180, 0.18) 0%,
                            rgba(53, 103, 180, 0) 70%
                        );
                }

                /* =====================================================
                   MAIN
                ===================================================== */

                .login-container {
                    width: 100%;
                    max-width: 440px;
                    position: relative;
                    z-index: 5;
                }

                /* =====================================================
                   BRAND
                ===================================================== */

                .brand-section {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .brand-logo {
                    width: 76px;
                    height: 76px;

                    margin: 0 auto 20px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    color: white;

                    border-radius: 24px;

                    background:
                        linear-gradient(
                            145deg,
                            #4b78c4 0%,
                            #294d91 100%
                        );

                    border:
                        1px solid
                        rgba(255,255,255,0.24);

                    box-shadow:
                        0 18px 45px
                        rgba(0,0,0,0.32),

                        inset 0 1px 0
                        rgba(255,255,255,0.24);

                    animation:
                        logoAppear 0.7s ease-out;
                }

                .brand-section h1 {
                    margin: 0;

                    color: #ffffff;

                    font-size: 30px;
                    line-height: 1.15;

                    font-weight: 750;

                    letter-spacing: -0.8px;

                    text-shadow:
                        0 4px 22px
                        rgba(0,0,0,0.30);
                }

                .brand-subtitle {
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    gap: 10px;

                    margin-top: 10px;
                }

                .brand-subtitle span {
                    width: 27px;
                    height: 1px;

                    background:
                        rgba(255,255,255,0.35);
                }

                .brand-subtitle p {
                    margin: 0;

                    color:
                        rgba(255,255,255,0.70);

                    font-size: 10px;

                    font-weight: 700;

                    letter-spacing: 2px;

                    text-transform: uppercase;
                }

                /* =====================================================
                   CARD
                ===================================================== */

                .login-card {
                    position: relative;

                    width: 100%;

                    padding:
                        34px
                        34px
                        31px;

                    background:
                        rgba(255,255,255,0.975);

                    border:
                        1px solid
                        rgba(255,255,255,0.72);

                    border-radius: 26px;

                    box-shadow:
                        0 30px 70px
                        rgba(0,0,0,0.30),

                        0 8px 25px
                        rgba(0,0,0,0.12);

                    backdrop-filter: blur(20px);

                    animation:
                        cardAppear 0.65s ease-out;
                }

                .card-top-line {
                    width: 42px;
                    height: 4px;

                    border-radius: 10px;

                    margin-bottom: 25px;

                    background:
                        linear-gradient(
                            90deg,
                            #315ca8,
                            #7899d0
                        );
                }

                .card-header {
                    margin-bottom: 26px;
                }

                .card-header h2 {
                    margin: 0;

                    color: #17233a;

                    font-size: 23px;

                    line-height: 1.2;

                    font-weight: 750;

                    letter-spacing: -0.4px;
                }

                .card-header p {
                    margin:
                        7px
                        0
                        0;

                    color: #727b8c;

                    font-size: 13px;

                    line-height: 1.5;
                }

                /* =====================================================
                   ERROR
                ===================================================== */

                .error-message {
                    display: flex;
                    align-items: flex-start;

                    gap: 10px;

                    padding:
                        12px
                        14px;

                    margin-bottom: 21px;

                    border-radius: 13px;

                    background: #fff3f2;

                    border:
                        1px solid
                        #f4d0cd;

                    color: #b42318;

                    font-size: 12.5px;

                    line-height: 1.45;

                    animation:
                        errorAppear 0.25s ease-out;
                }

                .error-dot {
                    width: 7px;
                    height: 7px;

                    flex-shrink: 0;

                    margin-top: 5px;

                    border-radius: 50%;

                    background: #d92d20;
                }

                /* =====================================================
                   FORM
                ===================================================== */

                .field-group {
                    margin-bottom: 20px;
                }

                .password-group {
                    margin-bottom: 26px;
                }

                .field-group label {
                    display: block;

                    margin-bottom: 8px;

                    color: #273247;

                    font-size: 12px;

                    font-weight: 700;

                    letter-spacing: 0.02em;
                }

                .input-wrapper {
                    position: relative;

                    width: 100%;

                    height: 54px;

                    border:
                        1.5px solid
                        #d9dee7;

                    border-radius: 14px;

                    background: #f9fafc;

                    transition:
                        border-color 0.2s ease,
                        box-shadow 0.2s ease,
                        background 0.2s ease;
                }

                .input-wrapper.input-active {
                    background: #ffffff;

                    border-color: #315ca8;

                    box-shadow:
                        0 0 0 4px
                        rgba(49,92,168,0.10);
                }

                .input-icon {
                    position: absolute;

                    left: 15px;
                    top: 50%;

                    transform:
                        translateY(-50%);

                    display: flex;

                    color: #8b94a5;

                    pointer-events: none;

                    transition:
                        color 0.2s ease;
                }

                .input-active .input-icon {
                    color: #315ca8;
                }

                .input-wrapper input {
                    width: 100%;
                    height: 100%;

                    border: none;
                    outline: none;

                    background: transparent;

                    padding:
                        0
                        15px
                        0
                        46px;

                    color: #172033;

                    font-size: 14px;

                    font-weight: 500;
                }

                .input-wrapper input::placeholder {
                    color: #a4acba;

                    letter-spacing: 0;
                }

                /* =====================================================
                   BUTTON
                ===================================================== */

                .login-button {
                    width: 100%;
                    height: 54px;

                    border: none;

                    border-radius: 14px;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    gap: 9px;

                    background:
                        linear-gradient(
                            135deg,
                            #3b68b5 0%,
                            #294f96 100%
                        );

                    color: #ffffff;

                    font-size: 14px;

                    font-weight: 750;

                    cursor: pointer;

                    box-shadow:
                        0 10px 24px
                        rgba(49,92,168,0.25);

                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease,
                        opacity 0.2s ease;
                }

                .login-button:hover:not(:disabled) {
                    transform:
                        translateY(-2px);

                    box-shadow:
                        0 15px 32px
                        rgba(49,92,168,0.34);
                }

                .login-button:active:not(:disabled) {
                    transform:
                        translateY(0);
                }

                .login-button:disabled {
                    cursor: not-allowed;

                    background:
                        #91a5d1;

                    box-shadow: none;
                }

                .button-loading {
                    opacity: 0.95;
                }

                .spinner {
                    width: 16px;
                    height: 16px;

                    border:
                        2px solid
                        rgba(255,255,255,0.38);

                    border-top-color:
                        #ffffff;

                    border-radius: 50%;

                    animation:
                        mizan-spin 0.8s
                        linear infinite;
                }

                /* =====================================================
                   SECURITY
                ===================================================== */

                .secure-login {
                    display: flex;

                    align-items: center;
                    justify-content: center;

                    gap: 7px;

                    margin-top: 20px;

                    color: #8992a2;

                    font-size: 10.5px;

                    font-weight: 600;
                }

                .secure-icon {
                    width: 21px;
                    height: 21px;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    border-radius: 50%;

                    color: #315ca8;

                    background: #eef5ff;
                }

                /* =====================================================
                   FOOTER
                ===================================================== */

                .login-footer {
                    text-align: center;

                    margin-top: 25px;
                }

                .login-footer a {
                    display: inline-flex;

                    align-items: center;

                    gap: 7px;

                    color:
                        rgba(255,255,255,0.86);

                    font-size: 12px;

                    font-weight: 600;

                    text-decoration: none;

                    transition:
                        opacity 0.2s ease;
                }

                .login-footer a:hover {
                    opacity: 0.68;
                }

                .version {
                    display: flex;

                    align-items: center;
                    justify-content: center;

                    gap: 9px;

                    margin-top: 13px;
                }

                .version i {
                    display: block;

                    width: 4px;
                    height: 4px;

                    border-radius: 50%;

                    background:
                        rgba(255,255,255,0.40);
                }

                .version span {
                    color:
                        rgba(255,255,255,0.45);

                    font-size: 9.5px;

                    font-family: monospace;

                    letter-spacing: 1.3px;
                }

                /* =====================================================
                   ANIMATIONS
                ===================================================== */

                @keyframes mizan-spin {
                    from {
                        transform:
                            rotate(0deg);
                    }

                    to {
                        transform:
                            rotate(360deg);
                    }
                }

                @keyframes cardAppear {
                    from {
                        opacity: 0;
                        transform:
                            translateY(18px);
                    }

                    to {
                        opacity: 1;
                        transform:
                            translateY(0);
                    }
                }

                @keyframes logoAppear {
                    from {
                        opacity: 0;
                        transform:
                            translateY(-12px)
                            scale(0.94);
                    }

                    to {
                        opacity: 1;
                        transform:
                            translateY(0)
                            scale(1);
                    }
                }

                @keyframes errorAppear {
                    from {
                        opacity: 0;
                        transform:
                            translateY(-5px);
                    }

                    to {
                        opacity: 1;
                        transform:
                            translateY(0);
                    }
                }

                /* =====================================================
                   RESPONSIVE
                ===================================================== */

                @media (max-width: 520px) {

                    .mizan-login {
                        padding:
                            30px
                            16px;
                    }

                    .login-container {
                        max-width: 430px;
                    }

                    .login-card {
                        padding:
                            29px
                            24px
                            27px;

                        border-radius: 22px;
                    }

                    .brand-logo {
                        width: 68px;
                        height: 68px;

                        border-radius: 21px;
                    }

                    .brand-section h1 {
                        font-size: 27px;
                    }
                }

                @media (max-width: 360px) {

                    .mizan-login {
                        padding:
                            22px
                            12px;
                    }

                    .login-card {
                        padding:
                            26px
                            19px
                            24px;
                    }

                    .card-header h2 {
                        font-size: 21px;
                    }

                    .brand-section {
                        margin-bottom: 24px;
                    }

                    .brand-section h1 {
                        font-size: 25px;
                    }

                    .brand-subtitle p {
                        font-size: 9px;
                        letter-spacing: 1.5px;
                    }
                }

            `}</style>
        </>
    );
}

