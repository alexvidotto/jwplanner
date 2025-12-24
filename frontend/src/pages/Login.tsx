import { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let emailToUse = email;
      if (!email.includes('@')) {
        emailToUse = `${email}@jwplanner.com.br`;
      }
      await signInWithEmailAndPassword(auth, emailToUse, password);
    } catch (error) {
      console.error(error);
      alert('Login failed. Check your credentials.');
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
      <div className="p-8 bg-white rounded-xl shadow-lg w-96 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">JW Planner</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email ou Usuário</label>
            <input
              type="text"
              placeholder="seu.usuario"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
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


        </div>
      </div>
    </div>
  );
}
