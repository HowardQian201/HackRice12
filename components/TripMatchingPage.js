import { React, useState, useRouter, useEffect, useRef } from "react";
import getCurrentUser from "../utils/getCurrentUser";
import { supabase } from "../utils/supabaseClient";
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
    const [originPlaceId, setOriginPlaceId] = useState(null);
    const [destinationPlaceId, setDestinationPlaceId] = useState(null);

    const [userTripRequestID, setUserTripRequestID] = useState(null);

    

    // const [userOriginResult, setUserOriginResult] = useState(null);
    // const [userDestinationResult, setUserDestinationResult] = useState(null);
    // const [otherOriginResult, setOtherOriginResult] = useState(null);
    // const [otherDestinationResult, setOtherDestinationResult] = useState(null);

    const userOriginResult = useRef();
    const userDestinationResult = useRef();
    const otherOriginResult = useRef();
    const otherDestinationResult = useRef();
    

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
        libraries: ["places"],
    });

    useEffect(() => {
        getUsersRecentTripRequest();
    }, [map]);

    // get the user's most recent trip request that is the current
    async function getUsersRecentTripRequest() {
        let user;
        try {
            setLoading(true);
            user = await getCurrentUser();

            let { data, error, status } = await supabase
                .from("trip_requests")
                .select(`*`)
                .eq("user_id", user.id)
                .eq("awaiting", true)
                .order("created_at", { ascending: false })
                .limit(1); // limiting only 1 trip request per person
            
            if (error && status !== 406) {
                throw error;
            }

            if (data && map) {
                console.log("map", map);
                console.log("data", data);
                setUserTripRequestID(data[0].id);
                setOriginPlaceId(data[0].origin_place_id);
                setDestinationPlaceId(data[0].destination_place_id);
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
            findMatch2(user);
        }
    }

    async function findMatch2(user) {
        if (!user) {
            user = await getCurrentUser();
        }

        try {
            setLoading(true);
            let { data, error } = await supabase
                .from("trip_requests")
                .select("*")
                .neq("user_id", user.id)
                .eq("awaiting", true);

            if (error) {
                throw error;
            }

            if (!data) {
                console.log("no data");
                return;
            }

            const directionsService = new google.maps.DirectionsService();
            // Create PlacesServices object
            let placesService = new google.maps.places.PlacesService(map);

            // Create PlacesDetailsRequest object
            var userOriginRequest = {
                placeId: data[0].origin_place_id,
            };

            // Create PlacesDetailsRequest object
            var userDestinationRequest = {
                placeId: data[0].destination_place_id,
            };

            // Send request to PlacesService to get place details via placeID
            placesService.getDetails(
                userOriginRequest,
                function (_userOriginResult, userOriginStatus) {
                    if (
                        userOriginStatus ==
                        google.maps.places.PlacesServiceStatus.OK
                    ) {
                        // Set variable
                        // setUserOriginResult(_userOriginResult);
                        userOriginResult.current = _userOriginResult;
                    }
                }
            );

            // Send request to PlacesService to get place details via placeID
            placesService.getDetails(
                userDestinationRequest,
                function (_userDestinationResult, userDestinationStatus) {
                    if (
                        userDestinationStatus ==
                        google.maps.places.PlacesServiceStatus.OK
                    ) {
                        // Set variable
                        // setUserDestinationResult(_userDestinationResult);
                        userDestinationResult.current = _userDestinationResult;
                    }
                }
            );

            // loop through all the trip requests
            data.forEach(async (other_request) => {
                let originMatch = false;
                let destinationMatch = false;
                console.log("data", data);
                console.log("other_request", other_request);
                // Create PlacesDetailsRequest object
                var otherOriginRequest = {
                    placeId: other_request.origin_place_id,
                };

                // Create PlacesDetailsRequest object
                var otherDestinationRequest = {
                    placeId: other_request.destination_place_id,
                };

                // Send request to PlacesService to get place details via placeID
                placesService.getDetails(
                    otherOriginRequest,
                    function (_otherOriginResult, otherOriginStatus) {
                        if (
                            otherOriginStatus ==
                            google.maps.places.PlacesServiceStatus.OK
                        ) {
                            // Set variable
                            // setOtherOriginResult(_otherOriginResult);
                            otherOriginResult.current = _otherOriginResult;
                        }
                    }
                );

                // Send request to PlacesService to get place details via placeID
                placesService.getDetails(
                    otherDestinationRequest,
                    function (_otherDestinationResult, otherDestinationStatus) {
                        if (
                            otherDestinationStatus ==
                            google.maps.places.PlacesServiceStatus.OK
                        ) {
                            console.log(
                                "_otherDestinationResult",
                                _otherDestinationResult
                            );
                            // Set variable
                            // setOtherDestinationResult(_otherDestinationResult);
                            otherDestinationResult.current = _otherDestinationResult;
                        }
                    }
                );
                    
                console.log("otherOriginResult.current.value", otherOriginResult.current.value);
                console.log("otherDestinationResult.current.value", otherDestinationResult.current.value);
                console.log("userOriginResult.current.value", userOriginResult.current.value);
                console.log("userDestinationResult.current.value", userDestinationResult.current.value);
                return;
                /**
                 * const geocode = new google.maps.Geocoder();
                 * geocoder
                 *  .geocode(userOriginRequest)
                 * .then(({results}) => {setUserOriginResult(results[0].geometry.location)});
                 * .catch((e) => alert("Geocoder failed " + e));
                 */
                directionsService.route(
                    {
                        origin: userOriginResult.formatted_address,
                        destination: otherOriginResult.formatted_address,
                        travelMode: google.maps.TravelMode.WALKING,
                    },
                    (result, status) => {
                        if (status === google.maps.DirectionsStatus.OK) {
                            // If the distance between the two are less than half a mile, then this is a match
                            console.log(
                                "result.routes[0].legs[0].distance.value",
                                result.routes[0].legs[0].distance.value
                            );
                            if (
                                result.routes[0].legs[0].distance.value <
                                804.672
                            ) {
                                console.log("origin match");
                                originMatch = true;
                            }
                        } else {
                            console.error(
                                "Error finding direction, trying next point..."
                            );
                        }
                    }
                );

                directionsService.route(
                    {
                        origin: userDestinationResult.formatted_address,
                        destination: otherDestinationResult.formatted_address,
                        travelMode: google.maps.TravelMode.WALKING,
                    },
                    (result, status) => {
                        console.log("result", result);
                        if (status === google.maps.DirectionsStatus.OK) {
                            // If the distance between the two are less than half a mile, then this is a match
                            console.log(
                                "result.routes[0].legs[0].distance.value",
                                result.routes[0].legs[0].distance.value
                            );
                            if (
                                result.routes[0].legs[0].distance.value <
                                804.672
                            ) {
                                console.log("destination match");
                                destinationMatch = true;
                            }
                        } else {
                            console.error(
                                "Error finding direction, trying next point..."
                            );
                        }
                    }
                );

                // If both origin and destination match, then this is a match
                if (originMatch && destinationMatch) {
                    console.log("match found:", other_request);
                    // create trip object
                    const data = {
                        trip_request_1_id: userTripRequestID,
                        trip_request_2_id: other_request.id,
                    };
        
                    console.log(data);
        
                    let { error } = await supabase.from("trips").insert([data]);



                } else {
                    console.log("no match found");
                    // noMatchFound();
                }
            });
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function noMatchFound() {
        let user = await getCurrentUser();

        while (true) {
            setTimeout(() => console.log("Waiting for 5 seconds"), 5000);

            let { data, error, status } = await supabase
                .from("trip_requests")
                .select(`*`)
                .eq("user_id", user.id)
                .eq("awaiting", false)
                .order("created_at", { ascending: false })
                .limit(1); // limiting only 1 trip request per person

            if (data) {
                // found match
                let {
                    data: trip,
                    error,
                    status,
                } = await supabase
                    .from("trips")
                    .select("*")
                    .eq("trip_request_2_id", data[0].id)
                    .order("created_at", { ascending: false })
                    .limit(1); // limiting only 1 match

                return trip.id;
            }
        }
    }

    // match with some other trip request
    // async function findMatch(user) {
    //     if (!user) {
    //         user = await getCurrentUser();
    //     }
    //     // get every trip request object where awaiting=true and user_id != user.id

    //     try {
    //         setLoading(true);

    //         // get all trip requests that are awaiting and not the current user's
    //         let { data, error } = await supabase
    //             .from("trip_requests")
    //             .select("*")
    //             .neq("id", user.id)
    //             .eq("awaiting", true);

    //         //console.log("data", data);
    //         console.log("1");
    //         if (error) {
    //             throw error;
    //         }
    //         console.log("2");

    //         if (data) {
    //             console.log("3");
    //             var all_other_origins = [];
    //             var all_other_destinations = [];

    //             var origin_dist_diffs = [];
    //             var dest_dist_diffs = [];

    //             // find distance btwn user and extracted rows
    //             for (let i = 0; i < data.length; i++) {
    //                 let other_origin = data[i].origin_place_id;

    //                 // Aggregation of all other origins
    //                 all_other_origins.push(other_origin);

    //                 let other_dest = data[i].destination_place_id;

    //                 // Aggregation of all other destinations
    //                 all_other_destinations.push(other_dest);
    //             }

    //             console.log("4");

    //             // call distance matrix api
    //             var service = new google.maps.DistanceMatrixService();

    //             // getting distances btwn user's origin and all other origins
    //             var f_origin_dist_diffs = await service.getDistanceMatrix(
    //                 {
    //                     origins: [originPlaceId],
    //                     destinations: all_other_origins,
    //                     travelMode: google.maps.TravelMode.WALKING,
    //                     unitSystem: google.maps.UnitSystem.IMPERIAL,
    //                 },
    //                 origin_dist_callback
    //             );
    //             console.log("5");

    //             // service.getDistanceMatrix(
    //             //       {
    //             //           origins: [originPlaceId],
    //             //           destinations: all_other_origins,
    //             //           travelMode: google.maps.TravelMode.WALKING,
    //             //           unitSystem: google.maps.UnitSystem.IMPERIAL,
    //             //       },
    //             //       origin_dist_callback
    //             //   ).then((response) => {
    //             //     console.log(response);
    //             //   });

    //             function origin_dist_callback(response, status) {
    //                 console.log("6");
    //                 if (status == "OK") {
    //                     // each row represents an origin (the user's origin)
    //                     // each element represents the other people's origins

    //                     results = response.rows[0].elements;
    //                     // iterating through every possible match
    //                     for (var i = 0; i < results.length; i++) {
    //                         var element = results[i];
    //                         var distance = element.distance.text;
    //                         // store this origin distance somewhere
    //                         origin_dist_diffs.push(distance);
    //                     }
    //                     originDistLoading(false);
    //                     return origin_dist_diffs;
    //                 }
    //             }

    //             var f_dest_dist_diffs = await service.getDistanceMatrix(
    //                 {
    //                     origins: [destinationPlaceId],
    //                     destinations: all_other_destinations,
    //                     travelMode: google.maps.TravelMode.WALKING,
    //                     unitSystem: google.maps.UnitSystem.IMPERIAL,
    //                 },
    //                 dest_dist_callback(response, status)
    //             );

    //             function dest_dist_callback(response, status) {
    //                 console.log("7");
    //                 if (status == "OK") {
    //                     // each row represents a dest (the user's dest)
    //                     // each element represents the other people's dests

    //                     results = response.rows[0].elements;
    //                     // iterating through every possible match
    //                     for (var i = 0; i < results.length; i++) {
    //                         var element = results[i];
    //                         var distance = element.distance.text;
    //                         // store this origin distance somewhere
    //                         dest_dist_diffs.push(distance);
    //                     }
    //                     destDistLoading(false);
    //                     return dest_dist_diffs;
    //                 }
    //             }
    //             console.log("8");
    //             console.log(f_origin_dist_diffs, f_dest_dist_diffs);
    //         }
    //     } catch (error) {
    //         console.log(error.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // }

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
