import { React, useState, useEffect, useRef } from "react";
import getCurrentUser from "../utils/getCurrentUser";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";
import {
    useLoadScript,
    GoogleMap,
    Marker,
    Autocomplete,
    DirectionsRenderer,
} from "@react-google-maps/api";

export default function TripMatchingPage() {
    const [loading, setLoading] = useState(true);
    const [map, setMap] = useState(/** google.maps.Map */ null);
    const [originDistLoading, setOriginDistLoading] = useState(true);
    const [destDistLoading, setDestDistLoading] = useState(true);
    //const [tripRequest, setTripRequest] = useState(null);
    const router = useRouter();
    
    const [originCoords, setOriginCoords] = useState(true);
    const [destCoords, setDestCoords] = useState(true);

    let tripRequest;

    const [userTripRequestID, setUserTripRequestID] = useState(null);

    // const [userOriginResult, setUserOriginResult] = useState(null);
    // const [userDestinationResult, setUserDestinationResult] = useState(null);
    // const [otherOriginResult, setOtherOriginResult] = useState(null);
    // const [otherDestinationResult, setOtherDestinationResult] = useState(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
        libraries: ["places", "geometry"],
    });

    useEffect(() => {
        if (map) {
            getUsersRecentTripRequest();
        }
    }, [map]);

    // get the user's most recent trip request that is the current
    async function getUsersRecentTripRequest() {
        let user;
        try {
            setLoading(true);
            user = await getCurrentUser();

            let { data, error, status } = await supabase
                .from("trip_requests")
                .select('*')
                .eq("user_id", user.id)
                .eq("awaiting", true)
                .order("created_at", { ascending: false })
                .limit(1); // limiting only 1 trip request per person

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                // setOriginCoords(data[0].origin_lat, data[0].origin_long)

                // setDestCoords(data[0].dest_lat, data[0].dest_lat)
                //setUserTripRequestID(data[0].id);

                //setTripRequest(data[0]);
                tripRequest = data[0];
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
            findMatch(user);
        }
    }

    //match with some other trip request
    async function findMatch(user) {
        if (!user) {
            user = await getCurrentUser();
        }
        // get every trip request object where awaiting=true and user_id != user.id

        try {
            setLoading(true);

            // get all trip requests that are awaiting and not the current user's
            let { data, error } = await supabase
                .from("trip_requests")
                .select("*")
                .neq("user_id", user.id)
                .eq("awaiting", true);

            if (error) {
                throw error;
            }

            if (data) {
                
                let user_origin_lat = tripRequest.origin_lat;
                let user_origin_lon = tripRequest.origin_lon;
                let user_dest_lat = tripRequest.dest_lat;
                let user_dest_lon = tripRequest.dest_lon;
                let matched_user_index = -1;
                
                // result origin lat/lon, dest lat/lon

                for (let i = 0; i < data.length; i++) {
                    console.log(data[i]);

                    let other_origin_lat = data[i].origin_lat;
                    let other_origin_lon = data[i].origin_lon;
                    let other_dest_lat = data[i].dest_lat;
                    let other_dest_lon = data[i].dest_lon;
                    let distance_origin = google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(other_origin_lat, other_origin_lon),
                        new google.maps.LatLng(user_origin_lat, user_origin_lon));
                    let distance_dest = google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(other_dest_lat, other_dest_lon),
                        new google.maps.LatLng(user_dest_lat, user_dest_lon));
                    console.log("d_o" + distance_origin);
                    console.log("d_d" + distance_dest);
                    if (distance_origin < 500 && distance_dest < 500) {
                        matched_user_index = i;
                        break;
                    }
                }
                
                // If both origin and destination match, then this is a match
                if (matched_user_index != -1) {
                    let other_request = data[matched_user_index];
                    console.log("match found:", other_request);
                    ///////////////////////////////////////////// create trip object
                    const new_data = {
                        trip_request_1_id: tripRequest.id, // your trip request id
                        trip_request_2_id: other_request.id, // other person's trip request id
                    };

                    console.log(new_data);
                    if (new_data) {
                        console.log("making new trip", user.id);
                        // Insert into trips database
                        let { data1, error } = await supabase.from("trips").insert([new_data]);

                        console.log("error2" +  error);
                        // Change awaiting in user trip
                        let { data2, error2 } = await supabase
                            .from("trip_requests")
                            .update({ awaiting: false })
                            .eq("id", tripRequest.id); // setting your awaiting state to false
                        console.log("error2" + error2);
                        // Change awaiting in user trip
                        let { data3, error3 } = await supabase
                            .from("trip_requests")
                            .update({ awaiting: false })
                            .eq("id", other_request.id); // setting the other person's awaiting state to false
                        console.log("error3" + error3); 
                        // break from loop
                        router.push("/currentTrip");  
                    }              
                } else {
                    console.log("no match found");
                    noMatchFound(); // wait for a match
                }
            };
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }

    //no match found function
    async function noMatchFound() {

        let user = await getCurrentUser();
        console.log('waiting for a match in nomatchfound');

        while (true) {
            setTimeout(async () => {
            console.log('waiting for a match in loop');

            let { data: tripRequest1, error, status } = await supabase
                .from("trip_requests")
                .select('*')
                .eq("id", tripRequest.id)
                .eq("awaiting", false)
                .limit(1); // limiting only 1 trip request per person

            if (tripRequest1.length > 0) {
                // found match
                console.log('found match in noMatchFound');
                let {
                    data: trip,
                    error,
                    status,
                } = await supabase
                    .from("trips")
                    .select("*")
                    .eq("trip_request_2_id", tripRequest.id)
                    .order("created_at", { ascending: false })
                    .limit(1); // limiting only 1 match
                
                // router.push("/currentTrip");  
                // break;
            }
        }, 2000);
        }
    }

    

    if (!isLoaded) {
        return <div>Loading...</div>;
    }
    return (
        <>
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
                    {/* {currentLocation && <Marker position={currentLocation} />}
                    {directionsResponse && (
                        <DirectionsRenderer directions={directionsResponse} />
                    )} */}
                </GoogleMap>
                TripMatchingPage
            </div>
            ;
        </>
    );
}

