import { LogOut, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authUser";
import { useContentStore } from "../store/content";

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const { setContentType } = useContentStore();

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <header className="max-w-6xl mx-auto flex flex-wrap items-center justify-between p-4 h-20">
            <div className="flex items-center gap-10 z-50">
                <Link to="/">
                    <img src="/streamex.png" alt="Streamex Logo" className="h-20 w-32 sm:w-40" />
                </Link>

                {/* Desktop navbar items */}
                <div className="hidden sm:flex gap-4 items-center">
                    <Link to="/" className="hover:underline" onClick={() => setContentType("movie")}>
                        Movies
                    </Link>
                    <Link to="/" className="hover:underline" onClick={() => setContentType("tv")}>
                        TV Shows
                    </Link>
                    <Link to="/history" className="hover:underline">
                        Search History
                    </Link>
                    <Link
                        to="/join-virtual-theatre"
                        className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded"
                    >
                        Join Virtual Theatre
                    </Link>
                </div>
            </div>

            <div className="flex gap-2 items-center z-50">
                <Link to={"/search"}>
                    <Search className="size-6 cursor-pointer" />
                </Link>
                <img src={user.image} alt="Avatar" className="h-8 rounded cursor-pointer" />
                <LogOut className="size-6 cursor-pointer" onClick={logout} />
                <div className="sm:hidden">
                    <Menu className="size-6 cursor-pointer" onClick={toggleMobileMenu} />
                </div>
            </div>

            {/* Mobile navbar items */}
            {isMobileMenuOpen && (
                <div className="w-full sm:hidden mt-4 z-50 bg-black border rounded border-gray-800">
                    <Link
                        to="/"
                        className="block hover:underline p-2"
                        onClick={() => {
                            toggleMobileMenu();
                            setContentType("movie");
                        }}
                    >
                        Movies
                    </Link>
                    <Link
                        to="/"
                        className="block hover:underline p-2"
                        onClick={() => {
                            toggleMobileMenu();
                            setContentType("tv");
                        }}
                    >
                        TV Shows
                    </Link>
                    <Link to="/history" className="block hover:underline p-2" onClick={toggleMobileMenu}>
                        Search History
                    </Link>
                    <Link
                        to="/join-virtual-theatre"
                        className="block bg-blue-600 hover:bg-blue-500 text-white text-center py-2 rounded"
                        onClick={toggleMobileMenu}
                    >
                        Join Virtual Theatre
                    </Link>
                </div>
            )}
        </header>
    );
};

export default Navbar;

