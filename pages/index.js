import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import Auth from "../components/Auth";
import Profile from "../components/ProfilePage";

export default function Home() {
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

    return (
        <div className="">
            {!session ? (
                <Auth />
            ) : (
                // <StartRidePage key={session.user.id} session={session} />
                <Profile key={session.user.id} session={session} />
            )}
        </div>
    );
}