import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import SplashScreen from "../components/SplashScreen";
import Profile from "../components/ProfilePage";
import Auth from "../components/Auth";


export default function Home() {

    return (
        <div className="">
            {/* {!session ? (
                <Auth />
            ) : (
                // <StartRidePage key={session.user.id} session={session} />
                <Profile key={session.user.id} session={session} />
            )} */}
            <SplashScreen />
        </div>
    );
}