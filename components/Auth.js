import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import UniversalFadeAnimation from "./UniversalFadeComponent";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [showInput, setShowInput] = useState(false);
    const router = useRouter();
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
        <UniversalFadeAnimation>
            <div className="flex flex-col justify-center items-center w-screen h-screen bg-white">
                <h1 className="interHeader">Walkify</h1>
                <img src="/images/authCityWomen.png"/> 


                <h2 className="">
                Sign in via magic link with your email below
            </h2>
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
                    disabled={false}
                >
                    {loading ? "Loading..." : "Send magic link"}
                </button>
            </div>
            </div>
        </UniversalFadeAnimation>
    );
}