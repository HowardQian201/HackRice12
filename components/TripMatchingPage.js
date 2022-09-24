import React from 'react'

export default function TripMatchingPage() {
  const [loading, setLoading] = useState(true);
  const [originPlaceId, setOriginPlaceId] = useState(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState(null);
  const [when, setWhen] = useState(null);

 /* The above code is using the useEffect hook to call the getUsersRecentTripRequest function when the
 component mounts. */
  useEffect(() => {
    getUsersRecentTripRequest();
  }, []);
  
  
  // get the user's most recent trip request that is the current
  async function getUsersRecentTripRequest() {
    try {
      setLoading(true);
      const user = await getCurrentUser();

      let { data, error, status } = await supabase
          .from("trip_requests")
          .select(`when, destination_place_id, origin_place_id`)
          .eq("id", user.id)
          .eq("awaiting", true)
          .single();
      
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setOriginPlaceId(data.origin_place_id);
        setDestinationPlaceId(data.destination_place_id);
        setWhen(data.when);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  // match with some other request
  async function findMatch() {
    // get every row where awaiting=true and user_id != user.id
    let query = supabase
      .from('trip_requests')
      .select('*')
      .neq('id', user.id)
      .eq('awaiting', true)
    
      
    


  }


  // 
  return (
    <div>TripMatchingPage</div>
  )
}
