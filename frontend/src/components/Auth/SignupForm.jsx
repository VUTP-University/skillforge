import { useState } from "react";
import { signup } from "../../services/authService"; // Make sure you create a signup service
import { useNavigate } from "react-router-dom";

export default function SignupForm() {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    // if (form.password !== form.confirmPassword) {
    //   setError("Passwords do not match");
    //   return;
    // }
    if (!form.username || !form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    // Call the signup service to create the user
    try {
      const result = await signup(form);
      
      if (result.success) {
        navigate("/", {
          state: { showModal: true, modalMessage: "Your account was created successfully!" },
        });
      } else {
        setError(result.message || "Signup failed");
      }
    } catch (err) {
      setError("An error occurred while signing up.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#141e30] to-[#123556]">
      <div className="py-6 px-4">
        <div className="grid md:grid-cols-2 items-center gap-6 max-w-6xl w-full">
          <div className="border border-slate-300 rounded-lg p-6 max-w-md shadow-[0_2px_22px_-4px_rgba(93,96,127,0.2)] max-md:mx-auto primary_object">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="mb-12">
                <h3 className="text-3xl font-semibold primary_text">Sign up</h3>
                <p className="text-slate-500 text-sm mt-6 leading-relaxed secondary_text">
                  Create an account and start your journey with us. It’s quick
                  and easy.
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="text-slate-800 text-sm font-medium mb-2 block secondary_text">
                  Username
                </label>
                <div className="relative flex items-center">
                  <input
                    name="username"
                    type="text"
                    required
                    value={form.username}
                    onChange={handleChange}
                    className="w-full text-sm text-slate-800 border border-slate-300 pl-4 pr-10 py-3 rounded-lg secondary_text"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="text-slate-800 text-sm font-medium mb-2 block secondary_text">
                  First Name
                </label>
                <div className="relative flex items-center">
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full text-sm text-slate-800 border border-slate-300 pl-4 pr-10 py-3 rounded-lg secondary_text"
                    placeholder="Enter first name"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="text-slate-800 text-sm font-medium mb-2 block secondary_text">
                  Last Name
                </label>
                <div className="relative flex items-center">
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full text-sm text-slate-800 border border-slate-300 pl-4 pr-10 py-3 rounded-lg secondary_text"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-slate-800 text-sm font-medium mb-2 block secondary_text">
                  Email
                </label>
                <div className="relative flex items-center">
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full text-sm text-slate-800 border border-slate-300 pl-4 pr-10 py-3 rounded-lg secondary_text"
                    placeholder="Enter email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-slate-800 text-sm font-medium mb-2 block secondary_text">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="w-full text-sm text-slate-800 border border-slate-300 pl-4 pr-10 py-3 rounded-lg secondary_text"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center">
                  <input
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 shrink-0 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label
                    htmlFor="agree-terms"
                    className="ml-3 block text-sm text-slate-500 secondary_text"
                  >
                    I agree to the terms and conditions
                  </label>
                </div>
              </div>

              <div className="!mt-12">
                <button
                  type="submit"
                  className="w-full shadow-xl py-2.5 px-4 text-[15px] font-medium tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none primary_button"
                >
                  Sign up
                </button>
                <p className="text-sm !mt-6 text-center secondary_text">
                  Already have an account?{" "}
                  <a
                    href="/"
                    className="text-blue-600 font-medium hover:underline ml-1 whitespace-nowrap link_text"
                  >
                    Sign in here
                  </a>
                </p>
              </div>
            </form>
          </div>

          <div className="max-md:mt-8">
            <img
              src="src/assets/img/hero_avatar.png"
              className="w-full h-full max-md:w-4/5 mx-auto block object-cover"
              alt="sign up img"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
