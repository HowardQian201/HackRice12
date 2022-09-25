import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

export default function RatingComponent() {
    const [rating, setRating] = useState(5);
    const [buddyId, setBuddyId] = useState(null);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState(null);

    useEffect(() => {
        getCurrentUser();
    }, [session]);

    useEffect(() => {
        if (router.query.buddyId) {
            setBuddyId(router.query.buddyId);
        }
    }, [router]);

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

    async function handleRating(rate) {
        let rating_converted = rate;
        const { data: select_d, error: select_e } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", buddyId)
            .single();

        console.log("old updates");
        console.log("select_d", select_d);
        console.log(select_d.num_ratings);
        console.log(select_d.avg_rating);

        var newRating =
            (select_d.num_ratings * select_d.avg_rating + rating_converted) /
            (select_d.num_ratings + 1);
        var newNumRatings = select_d.num_ratings + 1;

        const { error } = await supabase.from("profiles").upsert({
            id: buddyId,
            num_ratings: newNumRatings,
            avg_rating: newRating,
        });
    }

    return (
        <div className="flex flex-col justify-center items-center h-screen w-screen gap-10">
            <div>
                <h1 className="interSubheader absolute top-10 z-10 left-4 shadow-2xl bg-black text-white px-3 py-2 rounded-full">
                    Walkify
                </h1>
            </div>
            <h1 className="interHeader text-center">
                Give a rating for your buddy
            </h1>
            <input
                className="interHeader text-4xl border border-black/20 text-center"
                type="number"
                placeholder="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                min={1}
                max={5}

            />

            <button
                onClick={(e) => {
                    e.preventDefault();
                    handleRating(rating);

                    router.push("/congratulationsPage");
                }}
                className="w-[95vw] bg-black text-white text-2xl font-medium px-10 py-4 rounded-xl"
                disabled={false}
            >
                Rate your Buddy
            </button>
        </div>
    );
}
