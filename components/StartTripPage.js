import { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import getCurrentUser from "../utils/getCurrentUser";
import UniversalFadeAnimation from "./UniversalFadeComponent";
import {
    useLoadScript,
    GoogleMap,
    Marker,
    Autocomplete,
    DirectionsRenderer,
} from "@react-google-maps/api";
import { useRouter } from "next/router";
// Import magnifying glass from heroicons

export default function StartTripPage() {
    const [loading, setLoading] = useState(true);
    const [map, setMap] = useState(/** google.maps.Map */ null);
    const [session, setSession] = useState(null);
    // Format = { lat: typeof float, lng: typeof float }
    const [currentLocation, setCurrentLocation] = useState(null);
    const [destLocation, setDestLocation] = useState(null);
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);
    const router = useRouter();

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
        setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        });
    }

    /**
     * Creates a trip request by storing it in the supabase database.
     * Uses the following state variables: destination, origin,
     */
    async function createTripRequest() {
        try {
            const user = await getCurrentUser();

            // Get destination location from Google
            // Don't need origin because that will just be current location
            const geocoder = new google.maps.Geocoder();
            geocoder
                .geocode({
                    placeId: directionsResponse.geocoded_waypoints[1].place_id,
                })
                .then(async ({ results }) => {

                    // setDestLocation({
                    //     lat: results[0].geometry.location.lat(),
                    //     lng: results[0].geometry.location.lng(),
                    // });
                    const data = {
                        user_id: user.id,
                        origin_lon: currentLocation.lng,
                        origin_lat: currentLocation.lat,
                        dest_lon: results[0].geometry.location.lng(),
                        dest_lat: results[0].geometry.location.lat(),
                        awaiting: true,
                    };

                    console.log("here2");

                    console.log(data);

                    let { error } = await supabase
                        .from("trip_requests")
                        .insert(data);
                    console.log("here3");

                    if (error) {
                        throw error;
                    }
                });
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
            router.push("/tripMatchingPage");
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
                    } else {
                        console.error(`error fetching directions ${result}`);
                    }
                }
            );
        } catch (error) {
            alert(error.message);
        }
    }

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

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
            <div>
                <UniversalFadeAnimation>
                    <h1 className="interSubheader absolute top-4 left-4 shadow-2xl bg-black text-white px-3 py-2 rounded-full">
                        Walkify
                    </h1>
                </UniversalFadeAnimation>
            </div>
            <div className="flex justify-start items-center absolute left-0 right-0 m-auto top-20 z-10 w-[95vw] h-14 bg-white shadow-lg rounded-full">
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
                        className="w-[85vw] h-full bg-transparent outline-none text-lg font-medium border-none focus:border-none focus:ring-0 pr-6"
                        ref={destinationsRef}
                        autoComplete={"off"}
                        min={10}
                    />
                </Autocomplete>
            </div>
            {
                
                // If the user has entered a destination, show the trip confirmation component
                directionsResponse && (
                    <div className="absolute flex flex-col justify-between p-4 bottom-0 bg-white h-[40vh] w-screen rounded-xl">
                        <button
                            disabled={
                                destinationsRef.current.value < 10
                                    ? true
                                    : false
                            }
                            onClick={() => {
                                createTripRequest();
                            }}
                            className="w-[95vw] bg-black text-white text-2xl font-medium px-10 py-4 rounded-xl"
                        >
                            Start Trip Matching
                        </button>
                        <h1 className="interBody"> - You&apos;ll be matched with another verified female student from your school.</h1>
                        <div className="flex gap-2 items-center justify-end mb-4">
                            <button
                                className="inline-flex p-4 items-center rounded-full bg-gray-200 text-sm font-medium text-gray-700 shadow-sm hover:opacity-90 focus:outline-none"
                                onClick={() => router.push("/profilePage")}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                            <button
                                className="interBody px-4 py-2 inline-flex items-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                onClick={() => supabase.auth.signOut()}
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )
            }
        </>
    );
}
