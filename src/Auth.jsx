import React, { useState } from 'react';

export default function Auth({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

   const endpoint = isRegistering
  ? 'https://nvortex-backend-production.up.railway.app/api/auth/register'
  : 'https://nvortex-backend-production.up.railway.app/api/auth/login';
    const payload = isRegistering 
      ? { firstName, lastName, phone, email, password } 
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        const userData = { ...data, firstName, lastName, email };
        localStorage.setItem('user', JSON.stringify(userData));
        if (onLoginSuccess) onLoginSuccess(userData);
      } else {
        setError(data.message || data.error || 'Authentication failed. Please check your details.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Fallback direct entry if server is offline
      if (email && password) {
        const mockUser = { firstName: firstName || 'User', lastName: lastName || '', email };
        localStorage.setItem('user', JSON.stringify(mockUser));
        if (onLoginSuccess) onLoginSuccess(mockUser);
      } else {
        setError('Unable to connect to the authentication server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Simulated Social OAuth Login
    const socialUser = {
      firstName: provider === 'Google' ? 'Google User' : 'GitHub User',
      email: `user@${provider.toLowerCase()}.com`
    };
    localStorage.setItem('user', JSON.stringify(socialUser));
    if (onLoginSuccess) onLoginSuccess(socialUser);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gray-950 overflow-hidden text-gray-100 select-none py-10">
      
      {/* Background Neon Glowing Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Glassmorphism Container */}
      <div className="relative w-full max-w-md p-8 mx-4 bg-gray-900/90 backdrop-blur-2xl border border-gray-800/80 rounded-3xl shadow-2xl shadow-black/80 flex flex-col items-center">
        
        {/* N-Vortex AI Branding Badge */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/30 mb-3 animate-pulse">
            ⚡
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            N-Vortex AI
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isRegistering ? 'Create your neural workspace account' : 'Sign in to access your secure workspace'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl mb-4 text-center font-medium">
            {error}
          </div>
        )}

        {/* Social Logins */}
        <div className="w-full flex gap-3 mb-5">
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-950/60 hover:bg-gray-800/80 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300 transition shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.9 6.4C.7 8.8 0 11.3 0 14s.7 5.2 1.9 7.6l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.8-2.5 1.3-4.3 1.3-3 0-5.5-2.3-6.4-5.3L1.9 16C3.7 19.8 7.5 23 12 23z"/>
            </svg>
            Google
          </button>
          
          <button
            type="button"
            onClick={() => handleSocialLogin('GitHub')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-950/60 hover:bg-gray-800/80 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300 transition shadow-sm"
          >
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        <div className="relative w-full flex items-center justify-center mb-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
          <span className="relative bg-gray-900 px-3 text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Or continue with email</span>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
          
          {isRegistering && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    required={isRegistering}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-gray-950/80 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none transition shadow-inner"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    required={isRegistering}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-gray-950/80 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none transition shadow-inner"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number <span className="text-gray-600 font-normal">(Optional)</span></label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full bg-gray-950/80 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none transition shadow-inner"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-gray-950/80 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none transition shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-950/80 border border-gray-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none transition shadow-inner pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition py-1 px-2"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 text-xs tracking-wide"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Switch Mode Footer */}
        <div className="mt-5 text-center text-xs text-gray-400 flex items-center gap-1.5">
          <span>{isRegistering ? 'Already have an account?' : "Don't have an account yet?"}</span>
          <button 
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="font-bold text-blue-400 hover:text-blue-300 transition underline underline-offset-4"
          >
            {isRegistering ? 'Sign In' : 'Create Account'}
          </button>
        </div>

      </div>
    </div>
  );
}