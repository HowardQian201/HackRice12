import { React, useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import Avatar from "./Avatar";
import {
    useLoadScript,
    GoogleMap,
    Marker,
    Autocomplete,
    DirectionsRenderer,
} from "@react-google-maps/api";
import UniversalFadeAnimation from "./UniversalFadeComponent";

import getCurrentUser from "../utils/getCurrentUser";

export default function CurrentTrip() {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
        libraries: ["places"],
    });
    const router = useRouter();
    const { tripRequest1ID, tripRequest2ID } = router.query;

    // Save buddy
    const [buddy, setBuddy] = useState(null);
    // save buddy's trip request
    const [buddyTripRequest, setBuddyTripRequest] = useState(null);
    // Save logged in user
    const [user, setUser] = useState(null);
    // save logged in user's trip request
    const [yourTripRequest, setYourTripRequest] = useState(null);

    const [resultTripOrigin, setResultTripOrigin] = useState(null);
    const [resultTripDestination, setResultTripDestination] = useState(null);

    const [midResultPoint, setMidResultPoint] = useState(null);

    // Google Maps stuff
    const [map, setMap] = useState(/** google.maps.Map */ null);
    const [directionsResponse, setDirectionsResponse] = useState(null);

    const [statusMessage, setStatusMessage] = useState("Loading...");
    const [progress, setProgress] = useState("Meeting");

    useEffect(() => {
        if (router.query.tripRequest1ID && router.query.tripRequest2ID) {
            getTripRequests(
                router.query.tripRequest1ID,
                router.query.tripRequest2ID
            );
        }
    }, [router, getTripRequests]);

    useEffect(() => {
        if (resultTripOrigin && resultTripDestination) {
            // Take the two way points and display it on the Google map
            calculateRoute(resultTripOrigin, resultTripDestination);
        }
    }, [resultTripOrigin, resultTripDestination]);

    /**
     * The function calculates the route between the current location and the destination.
     * Result: changes the directionsResponse, distance, and duration state variables
     */
    function calculateRoute(resultTripOrigin, resultTripDestination) {
        if (!resultTripOrigin || !resultTripDestination) {
            toast.error(
                "Oops, no result trip origin or result trip destination!"
            );
        }

        try {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: resultTripOrigin,
                    destination: resultTripDestination,
                    travelMode: google.maps.TravelMode.WALKING,
                },
                (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        setDirectionsResponse(result);
                        // setDistance(result.routes[0].legs[0].distance.text);
                        // setDuration(result.routes[0].legs[0].duration.text);
                    } else {
                        console.error(`error fetching directions ${result}`);
                    }
                }
            );
        } catch (error) {
            toast.error(error.message);
        }
    }

    // From the trip id, get the two trip requests and figure out which trip
    // request is yours and which is your buddy's
    async function getTripRequests(yourTripRequestID, buddyTripRequestID) {
        try {
            // Get first trip request
            let { data: yourTripRequest } = await supabase
                .from("trip_requests")
                .select("*")
                .eq("id", yourTripRequestID)
                .limit(1);
            // Get second trip request
            let { data: buddyTripRequest } = await supabase
                .from("trip_requests")
                .select("*")
                .eq("id", buddyTripRequestID)
                .limit(1);
            console.log("tripRequest1", yourTripRequest);
            console.log("tripRequest2", buddyTripRequest);
            // Get the user from yourTripRequest in supabase
            let { data: yourUser } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", yourTripRequest[0].user_id)
                .limit(1);
            // Get the user from buddyTripRequest in supabase
            let { data: buddyUser } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", buddyTripRequest[0].user_id)
                .limit(1);
            console.log("yourUser", yourUser);
            setUser(yourUser[0]);
            console.log("buddyUser", buddyUser);
            setBuddy(buddyUser[0]);

            setResultTrip(yourTripRequest, buddyTripRequest);
        } catch (error) {
            console.log("error", error);
        }
    }

    function setResultTrip(yourTripRequest, buddyTripRequest) {
        console.log("yourTripRequest in setResultTrip", yourTripRequest);
        console.log("buddyTripRequest in setResultTrip", buddyTripRequest);
        if (buddyTripRequest.created_at > yourTripRequest.created_at) {
            setResultTripOrigin({
                lat: yourTripRequest[0].origin_lat,
                lng: yourTripRequest[0].origin_lon,
            });
        } else {
            setResultTripOrigin({
                lat: buddyTripRequest[0].origin_lat,
                lng: buddyTripRequest[0].origin_lon,
            });
        }
        // TODO: add state for other person's destination for marker
        setResultTripDestination({
            lat: yourTripRequest[0].dest_lat,
            lng: yourTripRequest[0].dest_lon,
        });

        setMidResultPoint({
            lat: buddyTripRequest[0].dest_lat,
            lng: buddyTripRequest[0].dest_lon
        });

        setStatusMessage("Meet at Point A to walk together");
    }

    const completeTripAndRedirect = () => {
        console.log("buddy", buddy);
        if (buddy) {
            router.push(`/rateUser?buddyId=${buddy.id}`);
        }
    };

    if (!isLoaded) {
        return <div>Loading...</div>;
    }
    return (
        <>
            <div className="w-screen h-[50vh]">
                <div>
                    <h1 className="interSubheader absolute top-4 z-10 left-4 shadow-2xl bg-black text-white px-3 py-2 rounded-full">
                        Walkify
                    </h1>
                </div>
                <GoogleMap
                    mapContainerStyle={{
                        width: "100%",
                        height: "100%",
                    }}
                    zoom={16}
                    // 29.717154, -95.404182 is rice university
                    center={{ lat: 29.717, lng: -95.404 }}
                    options={{
                        streetViewControl: false,
                        fullscreenControl: false,
                        mapTypeControl: false,
                    }}
                    onLoad={(map) => {
                        setMap(map);
                    }}
                >
                    {directionsResponse && (
                        <DirectionsRenderer directions={directionsResponse} />
                    )}
                </GoogleMap>
            </div>
            <section className="flex flex-col justify-start items-center gap-10 bg-white shadow-2xl rounded-2xl w-screen h-[50vh]">
                <div className=" flex justify-center items-center gap-2 border-b border-black/10 w-screen h-20 shadow-md px-4">
                    <h1 className=" text-lg font-medium text-center">
                        {/* Meet at Point A to walk together */}
                        {statusMessage}
                    </h1>
                    {statusMessage !== "Loading..." && (
                        <div className="bg-black text-white w-14 h-14 flex justify-center items-center">
                            <h1 className="interBody text-2xl">Now</h1>
                        </div>
                    )}
                </div>
                <div className="flex justify-center items-center gap-4">
                    <Avatar
                        url={buddy?.avatar_url}
                        className="w-20 h-20 rounded-full"
                        showUpload={false}
                    />

                    <div className="flex flex-col justify-center items-center gap-2">
                        <h1 className="interHeader text-center">
                            {buddy?.firstName} {buddy?.lastName}
                        </h1>
                        <h1 className="interBody text-center opacity-70">
                            {buddy?.university}
                            {", "}
                            {buddy?.avg_rating} stars
                        </h1>
                    </div>
                </div>
                {progress === "Meeting" && (
                    <button
                        onClick={() => {
                            setProgress("In Progress");
                            setStatusMessage(
                                "Enjoy your walk, get to know each other!"
                            );
                        }}
                        className="w-[95vw] bg-black text-white text-2xl font-medium px-10 py-4 rounded-xl"
                    >
                        Successfully Met
                    </button>
                )}
                {progress === "In Progress" && (
                    <button
                        onClick={() => {
                            setProgress("Completed");
                            setStatusMessage(
                                "Have a great day!"
                            );
                            setTimeout(() => {
                                completeTripAndRedirect();
                            }, 2000);
                        }}
                        className="w-[95vw] bg-black text-white text-2xl font-medium px-10 py-4 rounded-xl"
                    >
                        Complete Trip
                    </button>
                )}
            </section>

            <div>
                <button
                    className="inline-flex absolute bottom-8 left-4 items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => supabase.auth.signOut()}
                >
                    Sign Out
                </button>
            </div>
        </>
    );
}
