import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import Avatar from "./Avatar";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import UniversalFadeAnimation from "./UniversalFadeComponent";
export default function Account({ session }) {
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [university, setUniversity] = useState("");
    const [avatar_url, setAvatarUrl] = useState(null);
    const [filledInfo, setFilledInfo] = useState(false);
    const [user, setUser] = useState(null);
    // Next router
    const router = useRouter();

    useEffect(() => {
        getProfile();
    }, []);

    useEffect(() => {
        if (filledInfo === true) {
            // Scroll to top using window.scroll()
            window.scroll({
                top: 0,
                left: 0,
                behavior: "smooth",
            });
        }
    }, []);

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

    async function getProfile() {
        try {
            setLoading(true);
            const user = await getCurrentUser();
            let { data, error, status } = await supabase
                .from("profiles")
                .select(`username, firstName, lastName, university, avatar_url`)
                .eq("id", user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setUsername(data.username);
                setFirstName(data.firstName);
                setLastName(data.lastName);
                setUniversity(data.university);
                setAvatarUrl(data.avatar_url);
                if (
                    data.username !== null &&
                    data.firstName !== null &&
                    data.lastName !== null &&
                    data.university !== null
                ) {
                    setFilledInfo(true);
                }
            }
        } catch (error) {
            toast(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile({
        username,
        firstName,
        lastName,
        university,
        avatar_url,
    }) {
        try {
            setLoading(true);
            const user = await getCurrentUser();
            username = username.trim();
            firstName = firstName.trim();
            lastName = lastName.trim();
            university = university.trim();
            const updates = {
                id: user.id,
                username,
                firstName,
                lastName,
                university,
                avatar_url,
                updated_at: new Date(),
            };

            let { error } = await supabase.from("profiles").upsert(updates);

            if (error) {
                throw error;
            }
        } catch (error) {
            toast(error.message);
        } finally {
            setLoading(false);
            let userFilledInfoDatabase = await checkIfUserFilledInfo();
            setFilledInfo(userFilledInfoDatabase);
        }
    }

    let handleGetStartedClick = async () => {
        let userFilledInfoDatabase = await checkIfUserFilledInfo();
        if (userFilledInfoDatabase) {
            router.push("/startTripPage");
        } else {
            toast.error("Please fill in all the information!");
        }
    };

    let checkIfUserFilledInfo = async () => {
        try {
            setLoading(true);
            const user = await getCurrentUser();

            let { data, error, status } = await supabase
                .from("profiles")
                .select(`username, firstName, lastName, university, avatar_url`)
                .eq("id", user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                // If username, firstname, lastname, university, and avatar_url
                // filled out, then push to dashboard
                if (
                    data.username &&
                    data.firstName &&
                    data.lastName &&
                    data.university &&
                    data.avatar_url
                ) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (error) {
            toast(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <UniversalFadeAnimation>
                <UniversalFadeAnimation>
                    <h1 className="interSubheader fixed top-4 left-4 shadow-2xl bg-black text-white px-3 py-2 rounded-full">
                        Walkify
                    </h1>
                </UniversalFadeAnimation>
                <div className="flex flex-col gap-14 pt-20 md:flex-row justify-center items-center p-10 lg:p-20">
                    <section className="flex flex-col justify-center items-center lg:w-1/2">
                        <h1 className="interHeader text-center">
                            {!filledInfo &&
                                "Welcome to Walkify! Tell us about yourself."}
                            {filledInfo &&
                                "You're good to go! Click the button to get started."}
                        </h1>
                    </section>
                    <section className="flex flex-col w-full lg:flex-row gap-10 justify-center items-center md:w-1/2">
                        <Avatar
                            url={avatar_url}
                            size={150}
                            onUpload={(url) => {
                                setAvatarUrl(url);
                                updateProfile({
                                    username,
                                    firstName,
                                    lastName,
                                    university,
                                    avatar_url: url,
                                });
                            }}
                        />
                        <form className="flex flex-col gap-4 w-full sm:w-60">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="interBody block text-sm font-medium text-gray-700"
                                >
                                    Email
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        type="text"
                                        name="email"
                                        className="interBody block w-full rounded-md border-gray-300 shadow-sm sm:text-sm cursor-not-allowed"
                                        value={session.user.email}
                                        disabled
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="username"
                                    className="interBody block text-sm font-medium text-gray-700"
                                >
                                    Username
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="username"
                                        type="text"
                                        required={true}
                                        className="interBody block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                                        value={username || ""}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="firstName"
                                    className="interBody block text-sm font-medium text-gray-700"
                                >
                                    First Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="firstName"
                                        type="text"
                                        required={true}
                                        className="interBody block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                                        value={firstName || ""}
                                        onChange={(e) =>
                                            setFirstName(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="lastName"
                                    className="interBody block text-sm font-medium text-gray-700"
                                >
                                    Last Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="lastName"
                                        type="text"
                                        required={true}
                                        className="interBody block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                                        value={lastName || ""}
                                        onChange={(e) =>
                                            setLastName(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="university"
                                    className="interBody block text-sm font-medium text-gray-700"
                                >
                                    University
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="university"
                                        type="text"
                                        required={true}
                                        className="interBody block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                                        value={university || ""}
                                        onChange={(e) =>
                                            setUniversity(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    disabled={loading}
                                    onClick={() =>
                                        updateProfile({
                                            username,
                                            firstName,
                                            lastName,
                                            university,
                                            avatar_url,
                                        })
                                    }
                                >
                                    {loading ? "Loading ..." : "Update"}
                                </button>
                            </div>

                            <div className="mb-14">
                                <button
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    onClick={() => {
                                        supabase.auth.signOut();
                                        router.push("/");
                                    }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </UniversalFadeAnimation>
            {filledInfo && (
                <button
                    className="fixed flex rounded-full justify-center items-center gap-4 bottom-10 left-0 right-0 w-[95vw] m-auto bg-black text-white text-2xl font-medium px-10 py-4"
                    onClick={() => handleGetStartedClick()}
                >
                    Get Started
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            fillRule="evenodd"
                            d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            )}
        </>
    );
}
