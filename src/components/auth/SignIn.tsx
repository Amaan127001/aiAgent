import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SignIn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    agreeToTerms: false
  });
  const [error, setError] = useState<string | null>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    const firstInput = document.querySelector('input[name="identifier"]') as HTMLInputElement;
    if (firstInput) firstInput.focus();
  }, []);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+91\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { identifier, password } = formData;
      const isPhone = identifier.startsWith('+91');
      
      if (isPhone && !validatePhoneNumber(identifier)) {
        throw new Error('Invalid phone number format. Must be +91 followed by 10 digits');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        [isPhone ? 'phone' : 'email']: identifier,
        password
      });

      if (signInError) throw signInError;

      navigate('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred with Google sign in');
    }
  };

  return (
    <div className="h-full bg-[#1a1b26] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="w-full max-w-[min(90vw,420px)] flex flex-col justify-center gap-6">
        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-2">
          <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-[#00d8ff]" />
          <h2 className="text-2xl sm:text-3xl font-bold text-[#00d8ff] text-balance text-center">
            Welcome to NeuroForge
          </h2>
          <p className="text-sm sm:text-base text-[#c822ff] text-balance text-center">
            Sign in via email, Google, or +91 phone number
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[#00d8ff] mb-1.5">
              Phone number / email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#c822ff]" />
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                className="w-full bg-[#2d3748] text-white pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[#1bff00] focus:outline-none text-sm sm:text-base"
                placeholder="+91 phone number or email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#00d8ff] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#c822ff]" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-[#2d3748] text-white pl-10 pr-12 py-2 rounded-lg focus:ring-2 focus:ring-[#1bff00] focus:outline-none text-sm sm:text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-[#c822ff]" />
                ) : (
                  <Eye className="w-5 h-5 text-[#c822ff]" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start sm:items-center">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="mt-1 sm:mt-0 h-4 w-4 rounded border-gray-300 text-[#1bff00] focus:ring-[#1bff00]"
            />
            <label className="ml-2 block text-xs sm:text-sm text-gray-300">
              I agree to the{' '}
              <a href="#" className="text-[#00d8ff] hover:text-[#1bff00]">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#00d8ff] hover:text-[#1bff00]">
                Privacy Policy
              </a>
            </label>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1bff00] text-[#171923] py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-[#1a1b26] text-gray-400">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5"
              />
              Sign in with Google
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <Link
            to="/forgot-password"
            className="text-[#00d8ff] hover:text-[#1bff00] text-xs sm:text-sm"
          >
            Forgot password?
          </Link>
          <p className="text-gray-400 text-xs sm:text-sm">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-[#00d8ff] hover:text-[#1bff00] font-semibold"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;