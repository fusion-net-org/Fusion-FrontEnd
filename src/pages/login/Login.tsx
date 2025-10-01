import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { login } from "../../services/authService.js";
import { loginUser } from "../../redux/userSlice"

interface LoginFormInputs {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const response = await login(data); 
      if (response && response.data?.accessToken) {
        console.log(response);
        const token = response.data.accessToken;
        const decodedToken: any = jwtDecode(token);

        const user = {
            token,
            refreshToken: response.data.refreshToken,
            email: decodedToken.email,
            username: response.data.userName
          };

        dispatch(loginUser({ user }));
        toast.success("Đăng nhập thành công!");
        navigate("/");
      } else {
        toast.error("Đăng nhập thất bại!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Thông tin đăng nhập không đúng!");
    }
  };

  return (
    <div>
    <h1>Đăng nhập</h1>
    <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <div>
        <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-md p-2 w-1/4 focus:border-blue-500 focus:outline-none"
            {...register("email", { required: "Email không được để trống" })}
        />
        {errors.email && <p>{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
        <input
            type="password"
            placeholder="Mật khẩu"
            className="border border-gray-300 rounded-md p-2 w-1/4 focus:border-blue-500 focus:outline-none"
            {...register("password", { required: "Mật khẩu không được để trống" })}
        />
        {errors.password && <p>{errors.password.message}</p>}
        </div>

        <div>
        <button type="submit">Đăng nhập</button>
        </div>
    </form>
    </div>
  );
};

export default Login;
