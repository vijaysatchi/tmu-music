import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head} from '@inertiajs/react';
import {useEffect, useState} from "react";
import SpotifyAuthPopup from '@/Pages/SpotifyAuthPopup.jsx';
import { Inertia } from '@inertiajs/inertia';
import { router } from '@inertiajs/react';
import {PostList} from "@/Pages/Post/PostList.jsx";


export default function Dashboard({auth, posts, spotify}) {
    const [searchInput, setSearchInput] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [tracks, setTracks] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [showSpotifyPopup, setShowSpotifyPopup] = useState(false);



    useEffect(() => {

        // Check if there's a Spotify token in local storage
        const spotifyToken = spotify.token;
        const CLIENT_ID = spotify.client_id;
        const CLIENT_SECRET = spotify.client_secret;

        if (!spotifyToken) {
            // Redirect to your Laravel route for authorization
            window.location.href = '/authorize-spotify'; // asks user for authorization
        } else {
            setAccessToken(spotifyToken);
        }
        //API ACCESS TOKEN
        var authParameters = {      //spotify format, sending client id and secret
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET
        };
        fetch('https://accounts.spotify.com/api/token', authParameters) //fetches the token for use
            .then(result => result.json())
            .then(data => setAccessToken(data.access_token))
    }, []);

        const fetchData = async () => {     //fetching song from api
            try {
                var searchParameters = {
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                        'Authorization': 'Bearer ' + accessToken
                    }
                };

                const response = await fetch('https://api.spotify.com/v1/search?q=' + searchInput + '&type=track', searchParameters);
                const data = await response.json();
                // console.log(data.tracks.items);
                setTracks(data.tracks.items);
            } catch (error) {
                console.error('Error fetching data', error);
            }
        };

        useEffect(() => {
            if (searchInput !== "") {
                fetchData();
            }
        }, [searchInput, accessToken]);

    //When a song is selected
    const handleSongClick = (track) => {
        setSelectedPost({
            title: track.name,
            album: track.album.name,
            artist: track.artists[0].name,
            album_cover: track.album.images[0].url,
            description: "", // Initially empty; the user can enter a description
        });
        // Clear the tracks list to make other songs disappear
        setTracks([]);
    };

    const submitPost = (e) => {
        // e is the button.. or the event...
        e.preventDefault();

            // Assuming `selectedPost` has all the data you need to submit
        router.post('/posts', selectedPost); // sends post to backend
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Dashboard"/>
            <div className="container mx-auto px-8 py-8 ">
                <div className="flex items-center">
                    <input
                        className="rounded-md border-2 border-gray-300 w-1/2 mr-2"
                        placeholder="Search For Song"
                        type="text"
                        onKeyPress={event => {
                            if (event.key === 'Enter') {
                                fetchData();
                            }
                        }}
                        onChange={event => setSearchInput(event.target.value)}
                    />
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => {
                            fetchData();
                        }}
                    >
                        Search
                    </button>
                </div>
            </div>
            {selectedPost && (
                <div className="container mx-auto px-4 mb-8">
                    <div className="max-w-xl mx-auto bg-white rounded-lg overflow-hidden shadow-lg flex p-4 mb-4">
                        <div className="w-2/3 p-2">
                            <form onSubmit={submitPost}>
                            <div className="text-xl font-bold">{selectedPost.title}</div>
                            <div className="text-md mb-2 text-gray-500"> by <span className="font-bold"> {selectedPost.artist}</span></div>
                            <textarea
                                className="text-sm border-2 border-gray-300 w-full p-2 mb-2 rounded-lg"
                                placeholder="Type your description here"
                                value={selectedPost.description}
                                onChange={event => setSelectedPost({ ...selectedPost, description: event.target.value })}
                                style={{ resize: 'none' }}
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Submit
                            </button>
                            </form>
                        </div>
                        <img className="w-1/3 rounded-lg" src={selectedPost.album_cover} alt={selectedPost.title} />
                    </div>
                </div>
            )}
            {/* Only render this section if there are tracks to display */}
            {tracks.length > 0 && (
                <div className="container mx-auto px-4 mb-8">
                <div className="grid grid-cols-4 gap-4 mx-2 overflow-y-auto h-32 md:h-64 sm:h-48">
                    {tracks && tracks.map((track, i) => {
                        return (
                            <div
                                className="max-w-xs h-64 overflow-hidden shadow-lg cursor-pointer"
                                key={i}
                                onClick={() => handleSongClick(track)}
                            >
                                <img className="w-full" src={track.album.images[0].url} alt={track.name} />
                                <div className="px-6 py-4">
                                    <div className="font-bold text-white text-l mb-2 line-clamp-3">{track.name}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
                )}
            <PostList posts={posts}/>
            {/* Conditionally render the SpotifyAuthPopup */}
            {showSpotifyPopup && <SpotifyAuthPopup onClose={() => setShowSpotifyPopup(false)} />}
        </AuthenticatedLayout>
    );
}
