import { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Log In
          </button>
        </form>
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 text-white p-2 rounded"
          >
            Sign in with Google
          </button>

          {/* Dev Mode Login */}
          {import.meta.env.VITE_USE_MOCK_AUTH === 'true' && (
            <button
              onClick={() => {
                // Simulate successful login
                localStorage.setItem('authToken', 'dev-token');
                window.location.href = '/planner';
              }}
              className="w-full bg-gray-600 text-white p-2 rounded"
            >
              Dev Login (No Auth)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
