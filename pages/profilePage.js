
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import SplashScreen from "../components/SplashScreen";
import Profile from "../components/ProfilePage";
import Auth from "../components/Auth";
import { useRouter } from "next/router"
export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState(null);
    const router = useRouter();
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
                }

                setIsLoading(false);
            }
        }

        getInitialSession();

        const { subscription } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                console.log("hello")
                router.push("/");
            }
        );

        return () => {
            mounted = false;

            subscription?.unsubscribe();
        };
    }, [router]);
    
    return (
        <div className="">
            {!session ? (
                <div>
                    </div>
            ) : (
                // <StartRidePage key={session.user.id} session={session} />
                <Profile key={session.user.id} session={session} />
            )}
            
        </div>
    );
}