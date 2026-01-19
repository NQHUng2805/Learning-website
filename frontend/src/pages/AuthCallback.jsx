import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
    const navigate = useNavigate();
    const { setUser, setToken } = useAuth();

    useEffect(() => {
        const doAuth = async () => {
            const query = new URLSearchParams(window.location.search);
            const code = query.get("code");
            const state = query.get("state");
            const storedState = sessionStorage.getItem("oauthState");

            if (!code || !state || state !== storedState) {
                navigate("/login");
                return;
            }

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                    credentials: "include"
                });

                const data = await res.json();
                console.log("Google auth response:", data);
                console.log("Response status:", res.status);
                console.log("Response ok:", res.ok);
                
                if (res.ok && data.accessToken && data.user) {
                    localStorage.setItem("accessToken", data.accessToken);
                    setToken(data.accessToken);
                    setUser(data.user);
                    sessionStorage.removeItem("oauthState");
                    navigate("/dashboard");
                } else {
                    console.error("Auth failed:", data);
                    alert(`Auth failed: ${JSON.stringify(data)}`);
                    navigate("/login");
                }
            } catch (err) {
                console.error("Login failed", err);
                alert(`Login error: ${err.message}`);
                navigate("/login");
            }
        };

        doAuth();
    }, [navigate, setUser, setToken]);
    return <p>Logging in with Google...</p>;
};

export default AuthCallback;