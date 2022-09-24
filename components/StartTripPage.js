import { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import WhereToInput from "./whereToInput";
import getCurrentUser from "../utils/getCurrentUser";
import {
    useLoadScript,
    GoogleMap,
    Marker,
    Autocomplete,
    DirectionsRenderer,
} from "@react-google-maps/api";
import { Router } from "next/router";
// Import magnifying glass from heroicons

export default function StartTripPage() {
    const [loading, setLoading] = useState(true);
    const [map, setMap] = useState(/** google.maps.Map */ null);
    const [session, setSession] = useState(null);
    // Format = { lat: typeof float, lng: typeof float }
    const [currentLocation, setCurrentLocation] = useState(null);
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);

    const destinationsRef = useRef();

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
        libraries: ["places"],
    });
    /* Calling the getCurrentUser function when the session changes. */
    useEffect(() => {
        getCurrentUser();
    }, [session]);

    useEffect(() => {
        getLocation();
    }, []);

    /* Setting the current location of the user. */
    useEffect(() => {
        if (currentLocation && map) {
            map.panTo(currentLocation);
        } else {
            getLocation();
        }
    }, [currentLocation, map]);

    /**
     * If the browser supports geolocation, get the current position and pass it to the showPosition
     * function.
     */
    async function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        }
    }

    /**
     * It sets the current location of the user.
     * @param position - An object that contains the following properties:
     */
    async function showPosition(position) {
        console.log(position.coords.latitude);
        console.log(position.coords.longitude);
        setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        });
    }

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    /**
     * Creates a trip request by storing it in the supabase database.
     * Uses the following state variables: destination, origin,
     */
    async function createTripRequest() {
        try {
            const user = await getCurrentUser();

            const data = {
                user_id: user.id,
                origin_place_id:
                    directionsResponse.geocoded_waypoints[0].place_id,
                destination_place_id:
                    directionsResponse.geocoded_waypoints[1].place_id,
                awaiting: true,
            };

            console.log(data);

            let { error } = await supabase.from("trip_requests").insert([data]);

            if (error) {
                throw error;
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    /**
     * The function calculates the route between the current location and the destination.
     * Result: changes the directionsResponse, distance, and duration state variables
     */
    function calculateRoute() {
        if (destinationsRef.current.value === "") {
            alert("Please enter a destination");
            return;
        }
        try {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: currentLocation,
                    destination: destinationsRef.current.value,
                    travelMode: google.maps.TravelMode.WALKING,
                },
                (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        setDirectionsResponse(result);
                        setDistance(result.routes[0].legs[0].distance.text);
                        setDuration(result.routes[0].legs[0].duration.text);
                        console.log("result", result);
                        console.log(
                            "result.routes[0].legs[0].distance.text",
                            result.routes[0].legs[0].distance.text
                        );
                        console.log(
                            "result.routes[0].legs[0].duration.text",
                            result.routes[0].legs[0].duration.text
                        );
                    } else {
                        console.error(`error fetching directions ${result}`);
                    }
                }
            );
        } catch (error) {
            alert(error.message);
        }

        // Consider
    }

    // async function getProfile() {
    //     try {
    //         setLoading(true);
    //         const user = await getCurrentUser();

    //         let { data, error, status } = await supabase
    //             .from("profiles")
    //             .select(`username, firstName, lastName, university, avatar_url`)
    //             .eq("id", user.id)
    //             .single();

    //         // console.log("username", data.username);

    //         if (error && status !== 406) {
    //             throw error;
    //         }

    //         if (data) {
    //             setUsername(data.username);
    //         }
    //     } catch (error) {
    //         alert(error.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // }
    return (
        <>
            {/* <WhereToInput /> */}

            <div className="absolute w-screen h-screen">
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
                    {currentLocation && <Marker position={currentLocation} />}
                    {directionsResponse && (
                        <DirectionsRenderer directions={directionsResponse} />
                    )}
                </GoogleMap>
            </div>
            <div className="flex justify-start items-center absolute left-0 right-0 m-auto top-14 z-10 w-[95vw] h-14 bg-white shadow-lg rounded-full">
                <button
                    onClick={() => {
                        // Calculate the route and add new component to confirm trip
                        calculateRoute();
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-10 h-10 ml-4"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                    </svg>
                </button>
                <Autocomplete>
                    <input
                        type="text"
                        placeholder="Where to?"
                        className="w-[85vw] h-full bg-transparent outline-none text-lg font-medium border-none focus:border-none focus:ring-0"
                        ref={destinationsRef}
                        autoComplete={"off"}
                        min={10}
                    />
                </Autocomplete>
            </div>
            {
                // If the user has entered a destination, show the trip confirmation component
                directionsResponse && (
                    <button
                        disabled={
                            destinationsRef.current.value < 10 ? true : false
                        }
                        onClick={() => {
                            createTripRequest();
                        }}
                        className="absolute bottom-32 w-[95vw] m-auto left-0 right-0 bg-black text-white text-2xl font-medium px-10 py-4"
                    >
                        Start Trip Matching
                    </button>
                )
            }
            <div>
                <button
                    className="inline-flex absolute bottom-10 left-0 items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => supabase.auth.signOut()}
                >
                    Sign Out
                </button>
            </div>
        </>
    );
}
