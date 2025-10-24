import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      {user ? (
        <>
          <h2 className="text-3xl font-bold mb-4">Welcome, {user.username}!</h2>
          <p className="mb-6 text-gray-700">This is your profile page.</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-2 rounded hover:brightness-110 transition"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold mb-4">You are not logged in</h2>
          <p className="mb-6 text-gray-700">Please <span className="text-emerald-600 font-semibold cursor-pointer" onClick={() => navigate("/login")}>Login</span> or <span className="text-emerald-600 font-semibold cursor-pointer" onClick={() => navigate("/signup")}>Sign Up</span> to see your profile.</p>
        </>
      )}
    </div>
  );
}
