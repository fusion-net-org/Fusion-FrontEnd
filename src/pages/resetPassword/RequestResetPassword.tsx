import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import loginIllustration from '@/assets/auth/login.png';
import { requestPasswordReset } from '@/services/authService.js';

type ResetFormInputs = {
  email: string;
};

const COOLDOWN_SECONDS = 60;

const RequestResetPassword: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<ResetFormInputs>();

  const emailValue = watch('email');
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const canSend = useMemo(
    () => !!emailValue && cooldown <= 0 && !sending,
    [emailValue, cooldown, sending],
  );

  const handleSendResetLink = useCallback(async () => {
    if (!emailValue) {
      setError('email', { type: 'required', message: 'Email is required' });
      return;
    }
    try {
      setSending(true);
      await requestPasswordReset({ email: emailValue });
      toast.success('Password reset link has been sent to your email.');
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setSending(false);
    }
  }, [emailValue, setError]);

  const onSubmit = async (data: ResetFormInputs) => {
    await handleSendResetLink();
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-400 to-blue-600">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-5xl flex overflow-hidden">
        {/* Left Form Section */}
        <div className="w-full md:w-1/2 p-10">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6">Reset Password</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format',
                  },
                })}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSend}
              className={`w-full py-2 rounded-full font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg
                ${
                  canSend
                    ? 'bg-gradient-to-r from-[#1B74F3] to-[#3F8EFF] hover:from-[#3F8EFF] hover:to-[#1B74F3]'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
            >
              {sending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Email'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#1B74F3] font-medium hover:underline"
              >
                Go back to Login
              </button>
            </p>
          </form>
        </div>

        {/* Right Illustration */}
        <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center p-6">
          <img src={loginIllustration} alt="Login Illustration" className="w-4/5 h-auto" />
        </div>
      </div>
    </div>
  );
};

export default RequestResetPassword;
