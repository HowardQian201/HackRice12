import { React, useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import {
    useLoadScript,
    GoogleMap,
    Marker,
    Autocomplete,
    DirectionsRenderer,
} from "@react-google-maps/api";

import getCurrentUser from "../utils/getCurrentUser";

export default function CurrentTrip() {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
        libraries: ["places"],
    });

    // Trip id (gotten from URL)
    const [tripID, setTripID] = useState(null);
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

    // Google Maps stuff
    const [map, setMap] = useState(/** google.maps.Map */ null);
    const [directionsResponse, setDirectionsResponse] = useState(null);

    useEffect(() => {
        getURLParams();
    }, []);

    async function getURLParams() {
        const urlParams = new URLSearchParams();
        setTripID(urlParams.get("tripID"));

        var user = getCurrentUser();
        setUser(user);

        getTripRequests();
    }

    // From the trip id, get the two trip requests and figure out which trip
    // request is yours and which is your buddy's
    async function getTripRequests() {
        try {
            // Get the trip requests from the trip id
            let {
                data: trip,
                error,
                status,
            } = await supabase
                .from("trips")
                .select("trip_request_1_id, trip_request_2_id")
                .eq("id", tripID)
                .limit(1);
            // Get first trip request
            let { data: tripRequest1 } = await supabase
                .from("trip_requests")
                .select("*")
                .eq("id", trip.trip_request_1_id)
                .limit(1);
            // Get second trip request
            let { data: tripRequest2 } = await supabase
                .from("trip_requests")
                .select("*")
                .eq("id", trip.trip_request_2_id)
                .limit(1);

            if (tripRequest1.user_id != yourID) {
                // We found the trip request corresponding to the buddy. Set stuff.
                // Find this buddy profile in the profiles table
                let { data: buddyProfile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", tripRequest1.user_id)
                    .limit(1);
                setBuddy(buddyProfile);

                // Find your profile in the profiles table
                let { data: yourProfile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", tripRequest2.user_id)
                    .limit(1);
                setUser(yourProfile);

                setBuddyTripRequest(tripRequest1);

                setYourTripRequest(tripRequest2);
            } else if (tripRequest1.user_id == yourID) {
                // We found the trip request corresponding to the buddy. Set stuff.
                // Find this buddy profile in the profiles table
                let { data: buddyProfile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", tripRequest2.user_id)
                    .limit(1);
                setBuddy(buddyProfile);

                // Find your profile in the profiles table
                let { data: yourProfile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", tripRequest1.user_id)
                    .limit(1);
                setUser(yourProfile);

                setBuddyTripRequest(tripRequest2);

                setYourTripRequest(tripRequest1);
            }
        } catch (error) {
            console.log("error", error);
        }
    }

    /**
     * Convert google place id to latitude and longitude
     */
    function convert_place_id_to_lat_lon(place_id) {
        const geocoder = new google.maps.Geocoder();
        let location_h = null;
        geocoder
            .geocode({ placeId: place_id })
            .then(({ results }) => {
                location_h = results[0].geometry.location;
            })
            .catch((e) => alert(e));
        console.log(location_h);
        return location_h;
    }

    function setResultTrip() {
        if (buddyTripRequest.created_at > yourTripRequest.created_at) {
            setResultTripOrigin(yourTripRequest.origin_place_id);
        } else {
            setResultTripOrigin(buddyTripRequest.origin_place_id);
        }
        setResultTripDestination(yourTripRequest.destination_place_id);
    }

    if (!isLoaded) {
        return <div>Loading...</div>;
    }
    return (
        <div className="">
            <div className="w-screen h-[60vh]">
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
            </section>
            <div>
                <button
                    className="inline-flex absolute bottom-4 left-0 items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => supabase.auth.signOut()}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
