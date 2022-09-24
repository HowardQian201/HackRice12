import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
// Import Date
export default function WhereToInput({ session }) {
    const [loading, setLoading] = useState(true);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [destinationLocation, setDestinationLocation] = useState("");
    const [when, setWhen] = useState(null);
    const [name, setName] = useState(null);
    const [picture, setPicture] = useState(null);
    const [matched, setMatched] = useState(null);

    // create a ref to the div 
   /**
    * > Get the current user from the session
    * @returns The current user's information.
    */
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

    /* It's a React hook that runs the function `getLocation()` when the component is mounted. */
    useEffect(() => {
        getLocation();
    }, []);

   /**
    * If the browser supports geolocation, get the current position and pass it to the showPosition
    * function.
    */
    async function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            // throw error?
        }
    }

   /**
    * It sets the current location of the user.
    * @param position - An object that contains the following properties:
    */
    async function showPosition(position) {
        console.log(position.coords.latitude);
        console.log(position.coords.longitude);
        setCurrentLocation(position.coords);
    }

    async function get_google_place(dest_str) {
        /*
        Convert the destination string to a Google maps location with
        a latitude and longitude, along with the google place ID
        */
        const request = {
            query: dest_str,
            fields: ["name", "geometry"],
          };
          console.log("google", google);
          console.log("google.maps", google.maps);
          console.log("google.maps.places", google.maps.places);
          service = new google.maps.places.PlacesService(map);
          service.findPlaceFromQuery(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              for (let i = 0; i < results.length; i++) {
                const place = results[i];
                console.log(place);
              }
            }
          });
    }

    async function createTripRequest({ destination, when }) {
        try {
            setLoading(true);
            const user = await getCurrentUser();

            setDestinationLocation(get_google_place(destination));

            return
            setWhen(when);

            //now's date and time
            setWhen(Date.now());

            const data = {
                id: user.id,
                curr_lat: currentLocation.latitude,
                curr_long: currentLocation.longitude,
                dest_lat: destination.latitude,
                dest_long: destination.longitude,
                when: when,
                matched: matched,
                updated_at: new Date(),
            };

            let { error } = await supabase.from("trip_requests").insert([data]);

            if (error) {
                throw error;
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }

        // Redirect to the CreateTripRequestPage
        

        let matchedUser = findMatch({
            currentLocation,
            destinationLocation,
            when,
        });

        //load next screen
    }

    // async function createDestLocation({ destination }) {
        
    // }

    async function findMatch({ current, destination, when }) {
        // Get a bunch of trip requests that aren't already fulfilled,
        // Check if they "match" somehow with the current trip request,
        // If there is a match, update the trip request to be fulfilled
        // and create a new "Trip" that accounts for this trip.
        const { data, error } = await supabase
            .from("trip_requests")
            .select("*")
            .csv();

        for (let row of data.split("\n")) {
            console.log(row);

            // const rowItems = row.split(",");

            // //check distance between curr, dest, and when;
            // if (user.id != rowItems[2] && rowItems[9] == false) {
            //     var origin1 = new google.maps.LatLng(
            //         currentLocation.latitude,
            //         currentLocation.longitude
            //     );
            //     var origin2 = new google.maps.LatLng(rowItems[4], rowItems[3]);

            //     var dest1 = new google.maps.LatLng(
            //         destination.latitude,
            //         destination.longitude
            //     );
            //     var dest2 = new google.maps.LatLng(rowItems[6], rowItems[5]);

            //     var service = new google.maps.DistanceMatrixService();
                
            //     service.getDistanceMatrix({
            //         origins: [origin1, dest1],
            //         destinations: [origin2, dest2],
            //         travelMode: google.maps.TravelMode.WALKING,
            //         unitSystem: google.maps.UnitSystem.IMPERIAL
            //     }, distance_callback);

            //     var time1 = when;
            //     var time2 = rowItems[7];
            //     var time_difference = Math.abs(time1 - time2);

            //     if (
            //         time_difference <= 1800000 &&
            //         dist1 <= 0.5 &&
            //         dist2 <= 0.5
            //     ) {
            //         //match two users
            //         console.log('matched');
            //         console.log(user.id);
            //         console.log(rowItems[2]);
            //         match_with_user(user.id, rowItems[2]);
            //         return rowItems[2]; 
            //     }
            // }
        }
        
    }

    function distance_callback(response, status) {
        if (status == 'OK') {
            // var origins = response.originAddresses;
            // var destinations = response.destinationAddresses;

            // for ()
            console.log(response)
        }
    }

    return (
        <div>
            <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
            >
                Where are you headed?
            </label>
            <div className="mt-1">
                <input
                    type="text"
                    name="location"
                    id="location"
                    value={destinationLocation || ""}
                    onChange={(e) => setDestinationLocation(e.target.value)}
                    className="block w-96 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="99 Sunset Blvd"
                />
            </div>
            <button
                type="button"
                onClick={() =>
                    createTripRequest({
                        destinationLocation,
                        when: Date.now(),
                    })
                }
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                Search
            </button>
        </div>
    );
}
