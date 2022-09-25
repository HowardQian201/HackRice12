import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import UniversalFadeAnimation from "./UniversalFadeComponent";

export default function Auth() {
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState(null);

    // On mount, check to see if the user has an active session
    // If they do, set the session object in state
    // If they don't, send them to the Auth component
    // to sign in
    useEffect(() => {
        let mounted = true;

        async function getInitialSession() {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            // only update the react state if the component is still mounted
            if (mounted) {
                if (session) {
                    setSession(session);
                    router.push("/profilePage")
                }

                setIsLoading(false);
            }
        }

        getInitialSession();

        const { subscription } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => {
            mounted = false;

            subscription?.unsubscribe();
        };
    }, []);

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
