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
    // Save buddy
    const [buddy, setBuddy] = useState(null);
    // save buddy's trip request
    const [buddyTripRequest, setBuddyTripRequest] = useState(null);
    // Save logged in user
    const [user, setUser] = useState(null);
    // save logged in user's trip request
    const [yourTripRequest, setYourTripRequest] = useState(null);

    const [yourTripRequestID, setYourTripRequestID] = useState(null);
    const [buddyTripRequestID, setBuddyTripRequestID] = useState(null);


    const [resultTripOrigin, setResultTripOrigin] = useState(null);
    const [resultTripDestination, setResultTripDestination] = useState(null);

    // Google Maps stuff
    const [map, setMap] = useState(/** google.maps.Map */ null);
    const [directionsResponse, setDirectionsResponse] = useState(null);

    useEffect(() => {
        getTripRequestIDs();
    }, []);

    useEffect(() => {
        if (resultTripOrigin && resultTripDestination) {
            // Take the two way points and display it on the Google map

        }
    }, [resultTripOrigin, resultTripDestination])

    /**
     * The function calculates the route between the current location and the destination.
     * Result: changes the directionsResponse, distance, and duration state variables
     */
     function calculateRoute(resultTripOrigin, resultTripDestination) {
        if (!resultTripOrigin || !resultTripDestination) {
            toast.error("Oops, no result trip origin or result trip destination!")
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
    async function getTripRequestIDs() {
        const urlParams = new URLSearchParams();
        setYourTripRequestID(urlParams.get("tripRequest1ID"));
        setBuddyTripRequestID(urlParams.get("tripRequest2ID"));

        var user = getCurrentUser();
        setUser(user);

        getTripRequests().then(() => {
            setResultTrip();
        });
        
    }

    // From the trip id, get the two trip requests and figure out which trip
    // request is yours and which is your buddy's
    async function getTripRequests() {
        try {
            // Get first trip request
            let { data: tripRequest1 } = await supabase
                .from("trip_requests")
                .select("*")
                .eq("id", yourTripRequestID)
                .limit(1);
            // Get second trip request
            let { data: tripRequest2 } = await supabase
                .from("trip_requests")
                .select("*")
                .eq("id", buddyTripRequestID)
                .limit(1);
            console.log(tripRequest1);
            console.log(tripRequest2);
            console.log('here');

            if (tripRequest1.user_id != yourID) {
                console.log('here1');
                // We found the trip request corresponding to the buddy. Set stuff.
                // Find this buddy profile in the profiles table
                let { data: buddyProfile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", tripRequest1.user_id)
                    .limit(1);
                setBuddy(buddyProfile);
                console.log('buddy', buddy);

                // Find your profile in the profiles table
                let { data: yourProfile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", tripRequest2.user_id)
                    .limit(1);
                setUser(yourProfile);
                console.log(user);

                setBuddyTripRequest(tripRequest1);
                setYourTripRequest(tripRequest2);
                console.log(buddyTripRequest);
                console.log(yourTripRequest);

            } else if (tripRequest1.user_id === yourID) {
                console.log('here2');
                // We found the trip request corresponding to the buddy. Set stuff.
                // Find this buddy profile in the profiles table
                let { data: buddyProfile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", tripRequest2.user_id)
                    .limit(1);
                setBuddy(buddyProfile);
                console.log('buddy', buddy);

                // Find your profile in the profiles table
                let { data: yourProfile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", tripRequest1.user_id)
                    .limit(1);
                setUser(yourProfile);
                console.log(user);

                setBuddyTripRequest(tripRequest2);
                setYourTripRequest(tripRequest1);
                console.log(buddyTripRequest);
                console.log(yourTripRequest);
            }
        } catch (error) {
            console.log("error", error);
        }
    }


    function setResultTrip() {
        // if (buddyTripRequest.created_at > yourTripRequest.created_at) {
        //     setResultTripOrigin(new google.maps.LatLng(yourTripRequest.origin_lat, yourTripRequest.origin_lon));
        // } else {
        //     setResultTripOrigin(new google.maps.LatLng(buddyTripRequest.origin_lat, buddyTripRequest.origin_lon));
        // }
        // setResultTripDestination(new google.maps.LatLng(yourTripRequest.dest_lat, yourTripRequest.dest_lon));

        setResultTripOrigin(new google.maps.LatLng(yourTripRequest.origin_lat, yourTripRequest.origin_lon));
        setResultTripDestination(new google.maps.LatLng(yourTripRequest.dest_lat, yourTripRequest.dest_lon));
    }

    const completeTripAndRedirect = () => {
        console.log("buddy", buddy);
        if (buddy) {
            router.redirect(`/rateUser?${buddy.id}`);
        }
    }

    if (!isLoaded) {
        return <div>Loading...</div>;
    }
    return (
        <>
            <div className="w-screen h-[60vh]">
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

            <Avatar
                url={buddy.avatar_url}
                size={150}
            />
            <h1 className="interHeader text-center">
                {buddy.firstName} {buddy.lastName} 
            </h1>
            <h1 className="interHeader text-center">
                {buddy.avg_rating}
            </h1>

            {/* {
                // If the user has entered a destination, show the trip confirmation component
                directionsResponse && (
                    <button
                        disabled={
                            destinationsRef.current.value < 10 ? true : false
                        }
                        onClick={() => {
                            // createTripRequest();
                        }}
                        className="absolute bottom-32 w-[95vw] m-auto left-0 right-0 bg-black text-white text-2xl font-medium px-10 py-4"
                    ></button>
                )
            } */}
            <section className="flex flex-col bg-white shadow-2xl rounded-2xl w-screen h-[40vh]">
              <div className="border-b border-black/90 w-screen h-1/3">
                <h1 className=" text-2xl font-medium">
                  Current Trip
                </h1>
              </div>
              <button
                onClick={() => {
                    completeTripAndRedirect()

                }}
                className="w-[95vw] bg-black text-white text-2xl font-medium px-10 py-4 rounded-xl"
            >
                            Trip Completed
            </button>
            </section>
            <div>
                <button
                    className="inline-flex absolute bottom-4 left-0 items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => supabase.auth.signOut()}
                >
                    Sign Out
                </button>
            </div>
        </>
    );
}
