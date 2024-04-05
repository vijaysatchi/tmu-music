import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useEffect, useState } from "react";
import SpotifyAuthPopup from "@/Pages/SpotifyAuthPopup.jsx";
import { Inertia } from "@inertiajs/inertia";
import { router } from "@inertiajs/react";
import PostList from "@/Pages/Post/PostList.jsx";


export default function Dashboard({ auth, posts, spotify }) {
    const [searchInput, setSearchInput] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [topTracks, setTopTracks] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [spotifyUserProfile, setSpotifyUserProfile] = useState(null); // Add this line

    useEffect(() => {
        // Fetch the Spotify session data from the backend
        fetch('/api/spotify-session')
            .then(response => response.json())
            .then(data => {
                const now = new Date().getTime() / 1000; // Convert current time to seconds
                if (!data.spotify_access_token || now > data.spotify_token_expires) {
                    window.location.href = "/authorize-spotify"; // Redirect to authorization if needed
                } else {
                    setAccessToken(data.spotify_access_token);
                    fetchSpotifyUserProfile(data.spotify_access_token);
                }
            });
    }, []);

    const fetchSpotifyUserProfile = async (token) => {
        try {
            const response = await fetch("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch Spotify user profile');
            const userProfileData = await response.json();

            let userImage = null;
            // get the user's image in a variable if exists
            if (userProfileData.images.length) {
                 userImage = userProfileData.images.reverse()[0].url;

                console.log(userImage);
                 // axios post to save the user's image
                    axios.post('/update-user-image', {
                        profile_url: userImage
                    });
            }

            axios.post('/update-user-name', {
                name: userProfileData.display_name,
            });



            setSpotifyUserProfile(userProfileData); // Set user profile data
        } catch (error) {
            console.error("Error fetching Spotify user profile:", error);
        }
    };

    const fetchData = async () => {
        if (!searchInput.trim()) return;
        try {
            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchInput)}&type=track`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            setTracks(data.tracks.items);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    /* CURRENTLY UNUSED
    * type (String):
    *   - artists
    *   - tracks
    * 
    * time_range (String):
    *   - short_term  (approximately last 4 weeks)
    *   - medium_term (approximately last 6 months)
    *   - long_term   (calculated from ~1 year of data and including all new data as it becomes available)
    */
    const fetchFavorites = async (type = "tracks", time_range="short_term", limit = 5, offset = 0) => {
        try {
            const response = await fetch(`https://api.spotify.com/v1/me/top/${type}?time_range=${time_range}&limit=${limit}&offset=${offset}`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch Spotify User's Top Items");
            const data = await response.json();
            setTopTracks(data.items)
        } catch (error) {
            console.error("Error fetching Spotify User's Top Items: ", error);
        }
    }

    useEffect(() => {
        // Fetch top tracks when the component mounts
        fetchFavorites();
    }, [topTracks]);


    useEffect(() => {
        if (searchInput !== "") {
            fetchData();
        }
    }, [searchInput, accessToken]);

    useEffect(() => {
        // If the search input is empty, clear the tracks
        if (searchInput === "") {
            setTracks([]);
        }
    }, [searchInput]);

    //When a song is selected
    const handleSongClick = (track) => {
        // console.log(track);
        setSelectedPost({
            song_id: track.id,
            title: track.name,
            album: track.album.name,
            artist: track.artists.map((artist) => artist.name).join(", "),
            album_cover: track.album.images[0].url,
            user: auth.user,
            preview_url: track.preview_url,
            description: "", // Initially empty; the user can enter a description
        });
        // Clear the tracks list to make other songs disappear
        setTracks([]);
    };

    const submitPost = (e) => {
        e.preventDefault();
        // Assuming `selectedPost` has all the data you need to submit
        Inertia.post("/posts", selectedPost).then(() => {
            window.location.reload();
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />
            <div className="md:ml-20 mx-auto px-8 py-8 ">
                <div className="relative">
                    <input
                        className="rounded-md border-2 border-gray-300 w-1/2 mr-2"
                        placeholder="Post a Song"
                        type="text"
                        onKeyPress={(event) => {
                            if (event.key === "Enter") {
                                fetchData();
                            }
                        }}
                        onChange={(event) => setSearchInput(event.target.value)}
                    />
                    <button
                        className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
                        onClick={() => {
                            fetchData();
                        }}
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Only render this section if there are tracks to display */}
            {tracks.length > 0 && (
                <div className="container mx-auto px-4 mb-8 p-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mx-2 overflow-y-auto h-56 md:h-96">
                        {tracks &&
                            tracks.map((track, i) => {
                                return (
                                    <div
                                        className="bg-gray-200 rounded-lg max-w-xs shadow-lg cursor-pointer"
                                        key={i}
                                        onClick={() => handleSongClick(track)}
                                    >
                                        <img
                                            className="w-full object-cover rounded-md"
                                            src={track.album.images[0].url}
                                            alt={track.name}
                                        />
                                        <div className="px-4 py-2">
                                            {/* Song Name */}
                                            <div className="font-bold text-black text-lg line-clamp-1">
                                                {track.name}
                                            </div>
                                            {/* Artist Name */}
                                            <div className="text-gray-600 text-sm line-clamp-1">
                                                {track.artists
                                                    .map(
                                                        (artist) => artist.name
                                                    )
                                                    .join(", ")}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {selectedPost && (
                <div className="px-6 md:px-12 md:w lg:px-32">
                    <div className="bg-midnight rounded-lg overflow-hidden shadow-lg relative mb-4 grid grid-cols-3">
                        <div className="col-span-2 p-4 flex flex-col justify-between">
                            <form onSubmit={submitPost}>
                                <div className="text-white text-md font-bold truncate">
                                    {selectedPost.title}
                                </div>
                                <div className="text-sm mb-2 text-gray-400 truncate">
                                    <span className="">
                                        {selectedPost.artist}
                                    </span>
                                </div>

                                <textarea
                                    className="text-sm border-2 border-gray-300 w-full p-2 mb-2 rounded-lg"
                                    placeholder="Description"
                                    value={selectedPost.description}
                                    onChange={(event) =>
                                        setSelectedPost({
                                            ...selectedPost,
                                            description: event.target.value,
                                        })
                                    }
                                    style={{ resize: "none", height: "80px" }}
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-700 hover:bg-blue-700 text-white text-xs md:text-lg font-bold py-1 px-4 md:px-6 md:rounded-lg rounded"
                                >
                                    Post
                                </button>
                            </form>
                        </div>
                        <div className="col-span-1 flex justify-center items-center pr-4 md:p-4">
                            <img
                                className="rounded-lg aspect-w-1 aspect-h-1 w-full max-w-xs"
                                src={selectedPost.album_cover}
                                alt={selectedPost.title}
                            />
                        </div>
                    </div>
                </div>
            )}
            <PostList posts={posts} user={auth.user} spotifyUserProfile={spotifyUserProfile} />
        </AuthenticatedLayout>
    );
}
