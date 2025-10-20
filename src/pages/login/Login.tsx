import React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { login } from '@/services/authService.js';
import { loginUser } from '@/redux/userSlice';
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

  const onSubmit = async (data: LoginFormInputs) => {
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
        };

        dispatch(loginUser({ user }));
        toast.success('Login successful!');
        navigate('/company');
      } else {
        toast.error('Login failed!');
      }
    } catch (error: any) {
      toast.error(error.response?.message || 'Incorrect login information!');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-400 to-blue-600">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-5xl flex overflow-hidden">
        {/* Left Form Section */}
        <div className="w-full md:w-1/2 p-10">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">Sign in</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Email Address</label>
              <input
                type="email"
                placeholder="Email"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Password</label>
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                {...register('password', { required: 'Password is required' })}
              />
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
              <a href="#" className="text-[#1B74F3] hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#1B74F3] to-[#3F8EFF] text-white py-2 rounded-full font-medium transition-all duration-300 hover:from-[#3F8EFF] hover:to-[#1B74F3] shadow-md hover:shadow-lg"
            >
              Log In
            </button>

            {/* Or + Google login */}
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm my-4">
              <div className="h-px w-20 bg-gray-300"></div>
              Or
              <div className="h-px w-20 bg-gray-300"></div>
            </div>
            <button
              type="button"
              className="flex items-center justify-center w-full border border-gray-300 rounded-md py-2 hover:bg-gray-50"
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google"
                className="w-5 h-5 mr-2"
              />
              Sign in with Google
            </button>

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
  );
};

export default Login;
