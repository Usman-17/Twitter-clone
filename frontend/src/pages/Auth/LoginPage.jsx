import { useState } from "react";
import { Link } from "react-router-dom";

import XSvg from "../../components/svgs/X";

import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Imports End

const LoginPage = () => {
  const [isShowPassword, setIsShowPassword] = useState(false);

  const togglePassword = () => {
    setIsShowPassword(!isShowPassword);
  };

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const queryClient = useQueryClient();

  const {
    mutate: loginMutation,
    isError,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ email, password }) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create account");
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation(formData);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-screen-xl mx-auto flex h-screen px-10">
      <div className="flex-1 hidden lg:flex items-center  justify-center">
        <XSvg className="lg:w-2/3 fill-white" />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center">
        <form
          className="lg:w-2/3  mx-auto md:mx-20 flex gap-4 flex-col"
          onSubmit={handleSubmit}
        >
          <XSvg className="w-24 lg:hidden fill-white" />
          <h1 className="text-4xl font-extrabold text-white">{"Let's"} go.</h1>

          {/* Email */}
          <label className="input input-bordered rounded flex items-center gap-2">
            <Mail size={20} />
            <input
              type="email"
              id="email"
              className="grow"
              placeholder="Email"
              name="email"
              onChange={handleInputChange}
              value={formData.email}
              autoComplete="email"
            />
          </label>

          {/* Password */}
          <label className="input input-bordered rounded flex items-center gap-2">
            <KeyRound size={20} />
            <input
              type={isShowPassword ? "text" : "password"}
              className="grow"
              placeholder="Password"
              name="password"
              onChange={handleInputChange}
              value={formData.password}
            />
            <div onClick={togglePassword}>
              {isShowPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </div>
          </label>

          <button className="btn rounded-full btn-primary text-white mt-2">
            {isPending ? "Loading..." : "Login"}
          </button>

          {isError && <p className="text-red-500">{error.message}</p>}
        </form>

        <div className="flex flex-col gap-2 mt-4">
          <p className="text-white text-lg">{"Don't"} have an account?</p>
          <Link to="/signup">
            <button className="btn rounded-full btn-primary text-white btn-outline w-full">
              Sign up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
