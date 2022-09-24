import React from 'react'
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";

export default function CurrentTrip() {

  useEffect(() => {
    getURLParams();
  }, [])

  async function getURLParams() {
    const urlParams = new URLSearchParams(queryString);
    setUserBeingRated(urlParams.get('matched_user'))
  };

  


  return (
    <div>CurrentTrip</div>
  )
}
