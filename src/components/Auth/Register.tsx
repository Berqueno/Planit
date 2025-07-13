import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#16a34a",
  ];

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

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

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      await register(email, password);
      toast.success("Account created successfully!", {
        style: {
          background: "#121212",
          color: "#FAFAFA",
          border: "1px solid #22c55e",
        },
      });
      navigate("/dashboard");
    } catch (error: any) {
      let errorMessage = "Failed to create account";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Email/password accounts are not enabled";
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
            Create your account
          </h1>
          <p className="text-sm mt-2 opacity-70" style={{ color: "#121212" }}>
            Join thousands of users planning smarter
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
                  placeholder="Create a password"
                  autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            strengthColors[passwordStrength - 1] || "#ef4444",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:
                          strengthColors[passwordStrength - 1] || "#ef4444",
                      }}
                    >
                      {strengthLabels[passwordStrength - 1] || "Very Weak"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                      className={`flex items-center space-x-1 ${
                        password.length >= 8
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>8+ characters</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        /[A-Z]/.test(password)
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>Uppercase</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        /[0-9]/.test(password)
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>Number</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        /[^A-Za-z0-9]/.test(password)
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>Special char</span>
                    </div>
                  </div>
                </motion.div>
              )}

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

            {/* Confirm Password Field */}
            <div>
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: "#121212" }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock
                    className="h-5 w-5 opacity-40"
                    style={{ color: "#121212" }}
                  />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  className={`w-full pl-12 pr-12 py-4 rounded-2xl border-2 transition-all duration-200 text-sm placeholder-gray-400 focus:outline-none ${
                    errors.confirmPassword
                      ? "border-red-300 bg-red-50/50 focus:border-red-400"
                      : "border-gray-200 bg-white/60 focus:border-gray-400 hover:border-gray-300"
                  }`}
                  style={{ color: "#121212" }}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.confirmPassword}</span>
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
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm opacity-70" style={{ color: "#121212" }}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium hover:underline transition-all duration-200"
                style={{ color: "#121212" }}
              >
                Sign in
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
            By creating an account, you agree to our Terms of Service
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;