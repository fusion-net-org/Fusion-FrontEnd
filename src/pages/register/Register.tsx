import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { register as registerService } from "../../services/authService.js";

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
    formState: { errors } 
  } = useForm<RegisterFormInputs>();
  
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      const response = await registerService(data);
      console.log(response);
      if (response && response.data) {
        toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      } else {
        toast.error("Đăng ký thất bại!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi đăng ký!");
    }
  };

  return (
    <div>
      <h1>Đăng ký</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* First Name */}
        <div>
          <input
            type="text"
            placeholder="Họ"
            className="border border-gray-300 rounded-md p-2 w-1/4 focus:border-blue-500 focus:outline-none"
            {...register("firstName", { required: "Họ không được để trống" })}
          />
          {errors.firstName && <p>{errors.firstName.message}</p>}
        </div>

        {/* Last Name */}
        <div>
          <input
            type="text"
            placeholder="Tên"
            className="border border-gray-300 rounded-md p-2 w-1/4 focus:border-blue-500 focus:outline-none"
            {...register("lastName", { required: "Tên không được để trống" })}
          />
          {errors.lastName && <p>{errors.lastName.message}</p>}
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-md p-2 w-1/4 focus:border-blue-500 focus:outline-none"
            {...register("email", { 
              required: "Email không được để trống",
              pattern: { value: /^\S+@\S+$/i, message: "Email không hợp lệ" }
            })}
          />
          {errors.email && <p>{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <input
            type="password"
            placeholder="Mật khẩu"
            className="border border-gray-300 rounded-md p-2 w-1/4 focus:border-blue-500 focus:outline-none"
            {...register("password", { 
              required: "Mật khẩu không được để trống",
              minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
            })}
          />
          {errors.password && <p>{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            className="border border-gray-300 rounded-md p-2 w-1/4 focus:border-blue-500 focus:outline-none"
            {...register("confirmPassword", { 
              required: "Vui lòng xác nhận mật khẩu",
              validate: (value) => value === watch("password") || "Mật khẩu không khớp"
            })}
          />
          {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <button type="submit">Đăng ký</button>
        </div>
      </form>
    </div>
  );
};

export default Register;
