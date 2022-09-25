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
    const [tripRequest, setTripRequest] = useState(null);
    
    const [originCoords, setOriginCoords] = useState(true);
    const [destCoords, setDestCoords] = useState(true);

    const [userTripRequestID, setUserTripRequestID] = useState(null);

    // const [userOriginResult, setUserOriginResult] = useState(null);
    // const [userDestinationResult, setUserDestinationResult] = useState(null);
    // const [otherOriginResult, setOtherOriginResult] = useState(null);
    // const [otherDestinationResult, setOtherDestinationResult] = useState(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
        libraries: ["places"],
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

            if (data && map) {
                // setOriginCoords(data[0].origin_lat, data[0].origin_long)

                // setDestCoords(data[0].dest_lat, data[0].dest_lat)
                setUserTripRequestID(data[0].id);

                setTripRequest(data[0]);
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

            console.log("data", data);
            console.log("1");
            if (error) {
                throw error;
            }
            console.log("2");

            if (data) {
                console.log("data2", data);
                console.log("3");
                var all_other_origins = [];
                var all_other_destinations = [];

                var origin_dist_diffs = [];
                var dest_dist_diffs = [];

                /*
                for (let i = 0; i < data.length; i++) {
                    
                }
                */

                // find distance btwn user and extracted rows
                for (let i = 0; i < data.length; i++) {
                    let other_origin = new google.maps.LatLng(data[i].origin_lat, data[i].origin_lon);
                    all_other_origins.push(other_origin);

                    // Aggregation of all other origins
                    let other_dest = new google.maps.LatLng(data[i].dest_lat, data[i].dest_lon);
                    all_other_destinations.push(other_dest);
                    
                }

                console.log(all_other_origins);
                console.log(all_other_destinations);

                console.log("4");


                // call distance matrix api
                var service = new google.maps.DistanceMatrixService();

                // getting distances btwn user's origin and all other origins
                service.getDistanceMatrix(
                    {
                        origins: [new google.maps.LatLng(tripRequest.origin_lat, tripRequest.origin_lon)],
                        destinations: all_other_origins,
                        travelMode: google.maps.TravelMode.WALKING,
                        unitSystem: google.maps.UnitSystem.IMPERIAL,
                    },
                    origin_dist_callback
                );
                console.log("5");

                // service.getDistanceMatrix(
                //       {
                //           origins: [new google.maps.LatLng(tripRequest.dest_lat, trip_request.dest_lon)],
                //           destinations: all_other_destinations,
                //           travelMode: google.maps.TravelMode.WALKING,
                //           unitSystem: google.maps.UnitSystem.IMPERIAL,
                //       },
                //       origin_dist_callback);

                function origin_dist_callback(response, status) {
                    console.log("6");
                    
                    if (status == "OK") {
                        // each row represents an origin (the user's origin)
                        // each element represents the other people's origins
                        console.log(response)
                        results = response.rows[0].elements;
                        // iterating through every possible match
                        for (var i = 0; i < results.length; i++) {
                            var element = results[i];
                            var distance = element.distance.text;
                            // store this origin distance somewhere
                            origin_dist_diffs.push(distance);
                        }
                        originDistLoading(false);
                        console.log(origin_dist_diffs) ;
                    }
                }

                // var f_dest_dist_diffs = await service.getDistanceMatrix(
                //     {
                //         origins: [destinationPlaceId],
                //         destinations: all_other_destinations,
                //         travelMode: google.maps.TravelMode.WALKING,
                //         unitSystem: google.maps.UnitSystem.IMPERIAL,
                //     },
                //     dest_dist_callback(response, status)
                // );

                // function dest_dist_callback(response, status) {
                //     console.log("7");
                //     if (status == "OK") {
                //         // each row represents a dest (the user's dest)
                //         // each element represents the other people's dests

                //         results = response.rows[0].elements;
                //         // iterating through every possible match
                //         for (var i = 0; i < results.length; i++) {
                //             var element = results[i];
                //             var distance = element.distance.text;
                //             // store this origin distance somewhere
                //             dest_dist_diffs.push(distance);
                //         }
                //         destDistLoading(false);
                //         return dest_dist_diffs;
                //     }
                // }


                console.log("8");
                // console.log(f_origin_dist_diffs, f_dest_dist_diffs);

                
                // If both origin and destination match, then this is a match
                if (userOriginToOtherOriginResult && userDestinationToOtherDestinationResult) {
                    console.log("match found:", other_request);
                    ///////////////////////////////////////////// create trip object
                    const data = {
                        trip_request_1_id: userTripRequestID,
                        trip_request_2_id: other_request.id,
                    };

                    console.log(data);

                    // Insert into trips database
                    let { error } = await supabase.from("trips").insert([data]);
                    // Change awaiting in user trip
                    let { error2 } = await supabase
                        .from("trip_requests")
                        .update({ awaiting: false })
                        .eq("id", userTripRequestID);
                    // Change awaiting in user trip
                    let { error3 } = await supabase
                        .from("trip_requests")
                        .update({ awaiting: false })
                        .eq("id", other_request.id);
                    // break from loop
                    return;
                } else {
                    console.log("no match found");
                    //noMatchFound();
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

        while (true) {
            setTimeout(() => console.log("Waiting for 5 seconds"), 5000);

            let { data, error, status } = await supabase
                .from("temp_trip_requests")
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

    // async function findMatch2(user) {
    //     if (!user) {
    //         user = await getCurrentUser();
    //     }

    //     try {
    //         setLoading(true);
    //         let { data, error } = await supabase
    //             .from("trip_requests")
    //             .select("*")
    //             .neq("user_id", user.id)
    //             .eq("awaiting", true);

    //         if (error) {
    //             throw error;
    //         }

    //         if (!data) {
    //             console.log("no data");
    //             return;
    //         }

    //         const directionsService = new google.maps.DirectionsService();
    //         // Create PlacesServices object
    //         let placesService = new google.maps.places.PlacesService(map);

    //         // Create PlacesDetailsRequest object
    //         var userOriginRequest = {
    //             placeId: originPlaceId
    //         };

    //         // Create PlacesDetailsRequest object
    //         var userDestinationRequest = {
    //             placeId: destinationPlaceId,
    //         };

    //         let userOriginResult;
    //         let userDestinationResult;

    //         // Promisfy the getDetails method
    //         const getDetails = (request) => {
    //             return new Promise((resolve, reject) => {
    //                 placesService.getDetails(request, (place, status) => {
    //                     if (
    //                         status === google.maps.places.PlacesServiceStatus.OK
    //                     ) {
    //                         resolve(place);
    //                     } else {
    //                         reject(status);
    //                     }
    //                 });
    //             });
    //         };

    //         // Call the getDetails method
    //         userOriginResult = await getDetails(userOriginRequest);
    //         userDestinationResult = await getDetails(userDestinationRequest);

    //         // loop through all the trip requests
    //         data.forEach(async (other_request) => {
    //             /*
                
    //             */
    //             let originMatch = false;
    //             let destinationMatch = false;
    //             // Create PlacesDetailsRequest object
    //             var otherOriginRequest = {
    //                 placeId: other_request.origin_place_id,
    //             };

    //             // Create PlacesDetailsRequest object
    //             var otherDestinationRequest = {
    //                 placeId: other_request.destination_place_id,
    //             };
    //             let otherOriginResult;
    //             let otherDestinationResult;

    //             // Set timeout
    //             setTimeout(() => {
    //                 console.log("AMONGUS");
    //             }, 1000);

    //             // Call the getDetails method
    //             otherOriginResult = await getDetails(otherOriginRequest);
    //             otherDestinationResult = await getDetails(
    //                 otherDestinationRequest
    //             );

    //             // console.log("userOriginResult", userOriginResult);
    //             // console.log("userDestinationResult", userDestinationResult);
    //             // console.log("otherOriginResult", otherOriginResult);
    //             // console.log("otherDestinationResult", otherDestinationResult);

    //             /**
    //              * const geocode = new google.maps.Geocoder();
    //              * geocoder
    //              *  .geocode(userOriginRequest)
    //              * .then(({results}) => {setUserOriginResult(results[0].geometry.location)});
    //              * .catch((e) => alert("Geocoder failed " + e));
    //              */

    //             // Promisfy directionsService.route method
    //             const getRouteAndDetermineIfClose = (request) => {
    //                 return new Promise((resolve, reject) => {
    //                     directionsService.route(request, (result, status) => {
    //                         if (status === "OK") {
    //                             // Check if distance is less than half a mile
    //                             if (
    //                                 result.routes[0].legs[0].distance.value <
    //                                 804.672
    //                             ) {
    //                                 resolve(result);
    //                             }
    //                         } else {
    //                             reject(status);
    //                         }
    //                     });
    //                 });
    //             };

    //             // Call the getRouteAndDetermineIfClose method
    //             let userOriginToOtherOriginResult =
    //                 await getRouteAndDetermineIfClose({
    //                     origin: userOriginResult.formatted_address,
    //                     destination: otherOriginResult.formatted_address,
    //                     travelMode: google.maps.TravelMode.WALKING,
    //                 });

    //             let userDestinationToOtherDestinationResult =
    //                 await getRouteAndDetermineIfClose({
    //                     origin: userOriginResult.formatted_address,
    //                     destination: otherDestinationResult.formatted_address,
    //                     travelMode: google.maps.TravelMode.WALKING,
    //                 });
                
    //                 console.log("userOriginToOtherOriginResult", userOriginToOtherOriginResult);
    //                 console.log("userDestinationToOtherDestinationResult", userDestinationToOtherDestinationResult);
    //             // directionsService.route(
    //             //     {
    //             //         origin: userOriginResult.formatted_address,
    //             //         destination: otherOriginResult.formatted_address,
    //             //         travelMode: google.maps.TravelMode.WALKING,
    //             //     },
    //             //     (result, status) => {
    //             //         if (status === google.maps.DirectionsStatus.OK) {
    //             //             // If the distance between the two are less than half a mile, then this is a match
    //             //             if (
    //             //                 result.routes[0].legs[0].distance.value <
    //             //                 804.672
    //             //             ) {
    //             //                 console.log("Origin match");
    //             //                 originMatch = true;
    //             //             }
    //             //         } else {
    //             //             console.error(
    //             //                 "Error finding direction, trying next point..."
    //             //             );
    //             //         }
    //             //     }
    //             // );

    //             // directionsService.route(
    //             //     {
    //             //         origin: userDestinationResult.formatted_address,
    //             //         destination: otherDestinationResult.formatted_address,
    //             //         travelMode: google.maps.TravelMode.WALKING,
    //             //     },
    //             //     (result, status) => {
    //             //         console.log("result", result);
    //             //         if (status === google.maps.DirectionsStatus.OK) {
    //             //             if (
    //             //                 result.routes[0].legs[0].distance.value <
    //             //                 804.672
    //             //             ) {
    //             //                 console.log("destination match");
    //             //                 destinationMatch = true;
    //             //                 if (originMatch) {
    //             //                     console.log("MATCH FOUND");
    //             //                 }
    //             //             }
    //             //         } else {
    //             //             console.error(
    //             //                 "Error finding direction, trying next point..."
    //             //             );
    //             //         }
    //             //     }
    //             // );

    //             // If both origin and destination match, then this is a match
    //             if (userOriginToOtherOriginResult && userDestinationToOtherDestinationResult) {
    //                 console.log("match found:", other_request);
    //                 ///////////////////////////////////////////// create trip object
    //                 const data = {
    //                     trip_request_1_id: userTripRequestID,
    //                     trip_request_2_id: other_request.id,
    //                 };

    //                 console.log(data);

    //                 let { error } = await supabase.from("trips").insert([data]);

    //                 let { error2 } = await supabase
    //                     .from("trip_requests")
    //                     .update({ awaiting: false })
    //                     .eq("id", userTripRequestID);

    //                 let { error3 } = await supabase
    //                     .from("trip_requests")
    //                     .update({ awaiting: false })
    //                     .eq("id", other_request.id);
    //                 // break from loop
    //                 return;
    //             } else {
    //                 console.log("no match found");
    //                 // noMatchFound();
    //             }
    //         });
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
