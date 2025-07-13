import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!", {
        style: {
          background: "#121212",
          color: "#FAFAFA",
          border: "1px solid #333",
        },
      });
      navigate("/dashboard");
    } catch (error: any) {
      let errorMessage = "Failed to sign in";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      }

      setErrors({ general: errorMessage });
      toast.error(errorMessage, {
        style: {
          background: "#121212",
          color: "#FAFAFA",
          border: "1px solid #ef4444",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <img
              src="/FLLB.png"
              alt="Planit Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1
            className="text-3xl font-light tracking-wide"
            style={{ color: "#121212" }}
          >
            Welcome back
          </h1>
          <p className="text-sm mt-2 opacity-70" style={{ color: "#121212" }}>
            Sign in to continue to your workspace
          </p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="backdrop-blur-sm border border-gray-200/50 rounded-3xl p-8 shadow-2xl"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
        >
          {/* General Error */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50/80 flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: "#121212" }}
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail
                    className="h-5 w-5 opacity-40"
                    style={{ color: "#121212" }}
                  />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-200 text-sm placeholder-gray-400 focus:outline-none ${
                    errors.email
                      ? "border-red-300 bg-red-50/50 focus:border-red-400"
                      : "border-gray-200 bg-white/60 focus:border-gray-400 hover:border-gray-300"
                  }`}
                  style={{ color: "#121212" }}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email}</span>
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: "#121212" }}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock
                    className="h-5 w-5 opacity-40"
                    style={{ color: "#121212" }}
                  />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors({ ...errors, password: undefined });
                  }}
                  className={`w-full pl-12 pr-12 py-4 rounded-2xl border-2 transition-all duration-200 text-sm placeholder-gray-400 focus:outline-none ${
                    errors.password
                      ? "border-red-300 bg-red-50/50 focus:border-red-400"
                      : "border-gray-200 bg-white/60 focus:border-gray-400 hover:border-gray-300"
                  }`}
                  style={{ color: "#121212" }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff
                      className="h-5 w-5 opacity-40 hover:opacity-60 transition-opacity"
                      style={{ color: "#121212" }}
                    />
                  ) : (
                    <Eye
                      className="h-5 w-5 opacity-40 hover:opacity-60 transition-opacity"
                      style={{ color: "#121212" }}
                    />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.password}</span>
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{
                backgroundColor: "#121212",
                color: "#FAFAFA",
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm opacity-70" style={{ color: "#121212" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium hover:underline transition-all duration-200"
                style={{ color: "#121212" }}
              >
                Create one
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-xs opacity-50" style={{ color: "#121212" }}>
            © 2025{" "}
            <a
              href="https://github.com/Berqueno/Planit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition"
            >
              Planit
            </a>
            . All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;