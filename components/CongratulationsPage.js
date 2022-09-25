import React from "react";
import { useRouter } from "next/router";

export default function CongratulationsPage() {
    const router = useRouter();

    return (
        <div>
            <h2 className="">
                Congratulations on completing your trip! Click below to go to
                the home page.
            </h2>
            <button
                onClick={() => {
                    router.push("/startTripPage");
                }}
                className="w-[95vw] bg-black text-white text-2xl font-medium px-10 py-4 rounded-xl"
                disabled={false}
            ></button>
        </div>
    );
}
