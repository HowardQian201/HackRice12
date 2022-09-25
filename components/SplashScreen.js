import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import UniversalFadeAnimation from "./UniversalFadeComponent";

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        setTimeout(() => {
            router.push("/auth");
        }, 1200);
    }, [router]);

    return (
        <div className="flex flex-col gap-10 mb-10 justify-center items-center bg-black h-screen w-screen b">
            <UniversalFadeAnimation>
                <h1 className="font-semibold text-6xl tracking-tight text-white">
                    Walkify
                </h1>
            </UniversalFadeAnimation>
        </div>
    );
}
