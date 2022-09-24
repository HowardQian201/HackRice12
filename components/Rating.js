import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";

export default function Rating() {
    const [rating, setRating] = useState(5);
    const [userBeingRated, setUserBeingRated] = useState(null);
    const [currUser, setCurrUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        setCurrUser(getCurrentUser());
        getUserBeingRated();
    }, [session]);


    async function getUserBeingRated() {
        const queryString = window.location.search;
        console.log(queryString);

        const urlParams = new URLSearchParams(queryString);
        setUserBeingRated(urlParams.get('matched_user')) ////  need to change to correct key
    }

    async function handleRating(rating) {
        const { data, error } = await supabase
            .from('profiles')
            .select()
            .eq('id', userBeingRated.id)
            .single();
        
        console.log(userBeingRated.id);
        console.log(data.num_ratings);
        console.log(data.avg_rating);

        
        var newRating = ((data.num_ratings * data.avg_rating) + rating) / (data.num_ratings + 1);
        var newNumRatings = data.num_ratings+1

        const { data1, error1 } = await supabase
            .from('profiles')
            .update({ num_ratings: newNumRatings, avg_rating: newRating })
            .eq({ 'id': userBeingRated.id })
            .select();

        console.log(data1.num_ratings);
        console.log(data1.avg_rating);
        
    }


    return (
        <div className="">
            <h2 className="">Give a rating for your buddy</h2>
            <div className="">
                <input
                    className=""
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
                    className=""
                    disabled={false}
                >
                </button>
            </div>
        </div>

        
    );
}