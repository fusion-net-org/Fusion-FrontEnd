/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { login, loginGG, confirmAccount } from '@/services/authService.js';
import { loginUser, setUserCompanies } from '@/redux/userSlice';
import { getAllCompanies } from '@/services/companyService.js';
import { GoogleLogin } from '@react-oauth/google';
import loginIllustration from '@/assets/auth/login.png';

interface LoginFormInputs {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('vtoken');

    if (token) {
      const confirmEmail = async () => {
        setIsConfirming(true);
        try {
          const res = await confirmAccount(token);
          console.log('API response:', res);
          toast.success('Email confirmed successfully! You can log in now.');
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || 'Email confirmation failed!');
        } finally {
          setIsConfirming(false);
        }
      };
      confirmEmail();
    }
  }, [location.search]);

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    try {
      const response = await login(data);

      if (response && response.data?.accessToken) {
        const token = response.data.accessToken;
        const decodedToken: any = jwtDecode(token);

        const user = {
          token,
          refreshToken: response.data.refreshToken,
          id: decodedToken.sub,
          email: decodedToken.email,
          username: response.data.userName,
          role: decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
        };
        dispatch(loginUser({ user }));

        try {
          const companiesRes = await getAllCompanies();
          if (companiesRes.succeeded) {
            dispatch(setUserCompanies(companiesRes.data.items));
          } else {
            dispatch(setUserCompanies([]));
          }
        } catch {
          dispatch(setUserCompanies([]));
        }

        toast.success('Login successful!');
        if (user.role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/company');
        }
      } else {
        toast.error('Login failed!');
      }
    } catch (error: any) {
      if (error.errorData) {
        if (typeof error.errorData === 'string') {
          toast.error(error.errorData);
          return;
        }

        if (typeof error.errorData === 'object') {
          const msgs = Object.values(error.errorData).flat() as string[];
          msgs.forEach((msg) => toast.error(msg));
          return;
        }
      }

      toast.error((error.message as string) || 'Incorrect login information!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginGoogle = async (credentialResponse: any) => {
    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        toast.error('Google Login failed!');
        return;
      }
      const response = await loginGG({ idToken });

      if (response && response.data?.accessToken) {
        const token = response.data.accessToken;
        const decodedToken: any = jwtDecode(token);

        const user = {
          token,
          refreshToken: response.data.refreshToken,
          id: decodedToken.sub,
          email: decodedToken.email,
          username: response.data.userName,
          role: decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
        };

        dispatch(loginUser({ user }));

        try {
          const companiesRes = await getAllCompanies();
          if (companiesRes.succeeded) {
            dispatch(setUserCompanies(companiesRes.data.items));
          } else {
            dispatch(setUserCompanies([]));
          }
        } catch {
          dispatch(setUserCompanies([]));
        }

        toast.success('Login with Google successful!');
        navigate('/company');
      } else {
        toast.error('Login with Google failed!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login with Google failed!');
    }
  };

  return (
    <div className="light">
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-400 to-blue-600">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-5xl flex overflow-hidden">
          {/* Left Form Section */}
          <div className="w-full md:w-1/2 p-10">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Sign in</h2>

            {isConfirming && (
              <p className="text-blue-600 mb-4">Confirming your email, please wait...</p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600">Email Address</label>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-600">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="accent-blue-500" />
                  Remember me
                </label>
                <Link to="/request-reset-password" className="text-[#1B74F3] hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-[#1B74F3] to-[#3F8EFF] text-white py-2 rounded-full font-medium transition-all duration-300 
    ${
      isLoading
        ? 'opacity-70 cursor-not-allowed'
        : 'hover:from-[#3F8EFF] hover:to-[#1B74F3] shadow-md hover:shadow-lg'
    }
  `}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <span className="inline-block w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></span>
                  </div>
                ) : (
                  'Log In'
                )}
              </button>

              {/* Or + Google login */}
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm my-4">
                <div className="h-px w-20 bg-gray-300"></div>
                Or
                <div className="h-px w-20 bg-gray-300"></div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleLoginGoogle}
                  onError={() => toast.error('Google Login failed!')}
                />
              </div>

              {/* Sign up link */}
              <p className="text-center text-gray-600 text-sm mt-6">
                Don’t have account?{' '}
                <Link to="/register" className="text-[#1B74F3] hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </form>
          </div>

          {/* Right Illustration Section */}
          <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center p-6">
            <img src={loginIllustration} alt="Login Illustration" className="w-4/5 h-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
