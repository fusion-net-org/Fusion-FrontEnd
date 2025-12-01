import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import loginIllustration from '@/assets/auth/login.png';
import { resetPassword } from '@/services/authService.js';

type ResetPasswordInputs = {
  newPassword: string;
  confirmPassword: string;
};

const ResetPassword: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordInputs>();

  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const rawToken = new URLSearchParams(location.search).get('token');
  const resetToken = rawToken ? decodeURIComponent(rawToken.replace(/ /g, '+').trim()) : null;
  const newPasswordValue = watch('newPassword');

  const onSubmit = async (data: ResetPasswordInputs) => {
    if (!resetToken) {
      toast.error('Invalid or missing reset token.');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    console.log({
      resetToken,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
    try {
      setLoading(true);
      const response = await resetPassword({
        resetToken,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      console.log(response);
      toast.success('Password has been reset successfully!');
      navigate('/login');
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
      toast.error((error.message as string) || 'Failed to reset password!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-400 to-blue-600">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-5xl flex overflow-hidden">
        {/* Left Form Section */}
        <div className="w-full md:w-1/2 p-10">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">Reset Password</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
              />
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === newPasswordValue || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#1B74F3] to-[#3F8EFF] text-white py-2 rounded-full font-medium transition-all duration-300 hover:from-[#3F8EFF] hover:to-[#1B74F3] shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Back to{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#1B74F3] font-medium hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        </div>

        {/* Right Illustration */}
        <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center p-6">
          <img src={loginIllustration} alt="Reset Illustration" className="w-4/5 h-auto" />
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
