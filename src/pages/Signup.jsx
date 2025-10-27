import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { supabase } from "../lib/supabaseClient";

export default function SignUp() {
  const { signUp } = useSupabaseAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Validate user type selection
    if (!userType) {
      setError("Please select whether you're a buyer or seller.");
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting to sign up with:', email, 'userType:', userType);
      const result = await signUp(email, password, { name, user_type: userType });
      console.log('Sign up successful:', result);
      
      // Wait for session to be properly established and refresh it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the session to ensure it's properly established
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session refresh error:', sessionError);
      } else {
        console.log('Session refreshed:', sessionData.session?.user?.id);
      }
      
      // Create profile in Supabase with user type
      if (result.user) {
        console.log('Creating profile for user:', result.user.id, 'with type:', userType);
        
        // Retry profile creation with exponential backoff
        let profileCreated = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!profileCreated && attempts < maxAttempts) {
          attempts++;
          console.log(`Profile creation attempt ${attempts}/${maxAttempts}`);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profile')
            .upsert({
              user_id: result.user.id,
              username: email.split('@')[0],
              full_name: name,
              user_type: userType,
            }, {
              onConflict: 'user_id'
            })
            .select();

          if (profileError) {
            console.error(`Profile creation error (attempt ${attempts}):`, profileError);
            
            if (attempts < maxAttempts) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            } else {
              // Final attempt failed
              setError(`Account created but profile setup failed: ${profileError.message}. Please try logging in and updating your profile manually.`);
              setLoading(false);
              return;
            }
          } else {
            console.log('Profile created successfully:', profileData);
            profileCreated = true;
            // Show success message
            alert(`Account created successfully! You are now a ${userType}.`);
          }
        }
      } else {
        console.error('No user object returned from signup');
        setError('Account created but user data is missing. Please try logging in.');
        setLoading(false);
        return;
      }
      
      // Redirect to profile page
      navigate("/profile");
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
          required
          minLength={6}
        />
        
        {/* User Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="userType"
                value="buyer"
                checked={userType === "buyer"}
                onChange={(e) => setUserType(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">👤 Buyer - I want to purchase products</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="userType"
                value="seller"
                checked={userType === "seller"}
                onChange={(e) => setUserType(e.target.value)}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-700">🏪 Seller - I want to sell products</span>
            </label>
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          className="bg-emerald-600 text-white w-full py-2 rounded hover:brightness-110 transition disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
