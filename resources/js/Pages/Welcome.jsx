import { Link, Head } from '@inertiajs/react';
import logo from '@/assets/tmusiclogo.svg';
import spotifylogo from '@/assets/spotifylogo.svg';


export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row items-center justify-center p-10">
                {/* Logo container */}
                <div className="mb-8 md:mb-0 md:flex-1 flex justify-center">
                    <img src={logo} alt="TMUsic Logo" className="w-48 md:w-96 lg:w-96" /> {/* Adjust the size as needed */}
                </div>

                {/* Text and buttons container */}
                <div className="flex flex-col items-center md:flex-1  text-center md:text-left">
                    <h1 className="text-5xl font-bold mb-6 text-white">Happening now</h1>
                    <p className="text-lg mb-6 text-white">Join today.</p>
                    {auth.user ? (
                        <Link
                            href={route('dashboard')}
                            className="block w-full px-12 py-2 text-center text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <div className="space-y-4">
                            <Link
                                href={route('login')}
                                className="block w-full px-12 py-2 text-center text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
                            >
                                Log in
                            </Link>
                            <Link
                                href={route('register')}
                                className="block w-full px-12 py-2 text-center text-blue-600 border border-blue-600 rounded-md shadow hover:bg-blue-50"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                    {/* Optional: Additional text or Components */}
                </div>
                {/* Spotify Logo at bottom left */}
                <div className="absolute bottom-0 right-0 p-10">
                    <p className="text-white text-sm mb-2">Powered by</p>
                    <img src={spotifylogo} alt="Spotify Logo" className="w-40" />
                </div>
            </div>
        </>
    );
}
