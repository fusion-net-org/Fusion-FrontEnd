/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register as registerService } from '@/services/authService.js';
import registerIllustration from '@/assets/auth/register.png';

interface RegisterFormInputs {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormInputs>();

  const navigate = useNavigate();

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      const response = await registerService(data);
      if (response?.data) {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      } else {
        toast.error('Registration failed!');
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
      toast.error((error.message as string) || 'An error occurred while registering!');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-400 to-blue-600 p-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-5xl flex overflow-hidden">
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-10">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">Sign Up</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600">First Name</label>
              <input
                type="text"
                placeholder="First Name"
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Last Name</label>
              <input
                type="text"
                placeholder="Last Name"
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                placeholder="Email"
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email format',
                  },
                })}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600">Password</label>
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === watch('password') || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start text-sm text-gray-600 leading-tight mt-2">
              <input type="checkbox" className="mr-2 mt-1 accent-blue-500" />
              <p>
                By creating an account you agree to the{' '}
                <a href="#" className="text-[#1B74F3] hover:underline">
                  terms of use
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#1B74F3] hover:underline">
                  privacy policy
                </a>
                .
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#1B74F3] to-[#3F8EFF] text-white py-2 rounded-full font-medium transition-all duration-300 hover:from-[#3F8EFF] hover:to-[#1B74F3] shadow-md hover:shadow-lg"
            >
              Create Account
            </button>

            {/* Or Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <p className="px-2 text-gray-500 text-sm">Or</p>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full border border-gray-300 py-2 rounded-md flex justify-center items-center gap-2 hover:bg-gray-100 transition"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Google</span>
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 mt-3">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1B74F3] hover:underline font-medium">
                Log in
              </Link>
            </p>
          </form>
        </div>

        {/* Illustration Section */}
        <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center p-6">
          <img src={registerIllustration} alt="Register illustration" className="w-4/5 h-auto" />
        </div>
      </div>
    </div>
  );
};

export default Register;
