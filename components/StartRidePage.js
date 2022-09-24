import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import WhereToInput from "./whereToInput";

export default function StartRidePage({ session }) {
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState(null);
    const [avatar_url, setAvatarUrl] = useState(null);

    useEffect(() => {
        getProfile();
    }, [session]);

    async function getCurrentUser() {
        const {
            data: { session },
            error,
        } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        if (!session?.user) {
            throw new Error("User not logged in");
        }

        return session.user;
    }

    async function getProfile() {
        try {
            setLoading(true);
            const user = await getCurrentUser();

            let { data, error, status } = await supabase
                .from("profiles")
                .select(`username`)
                .eq("id", user.id)
                .single();

            console.log("username", data.username);

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setUsername(data.username);
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }
    return (
       <div>
            Hey, welcome to Walkify!
            <WhereToInput session={session}/>
            <div>
                <button
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => supabase.auth.signOut()}
                >
                    Sign Out
                </button>
            </div>
       </div>
    );
}