import { useState } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleLogin = async (email) => {
        try {
            setLoading(true);
            // If the email is not a Rice email, throw an error
            if (!email.endsWith("@rice.edu")) {
                throw new Error("Please use a Rice email");
            }
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            alert("Check your email for the login link!");
        } catch (error) {
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="">
            <h2 className="">Sign in via magic link with your email below</h2>
            <div className="">
                <input
                    className=""
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        handleLogin(email);
                    }}
                    className=""
                    disabled={loading}
                >
                    <span className="">
                        {loading ? "Loading" : "Send magic link"}
                    </span>
                </button>
            </div>
        </div>
    );
}
