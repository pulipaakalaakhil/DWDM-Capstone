import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, User, Mail, Building2, Eye, EyeOff,
  ArrowRight, CheckCircle2, AlertTriangle, RefreshCw,
  Activity, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states - Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states - Register
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDepartment, setRegDepartment] = useState('BBMP Central Traffic Management');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Submission - Direct Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }

    try {
      const data = await login(loginIdentifier.trim(), loginPassword.trim());
      if (data.success) {
        setSuccessMsg('Authentication successful! Launching command center...');
        setTimeout(() => navigate('/'), 600);
      } else {
        setErrorMsg(data.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Invalid username or password.');
    }
  };

  // Submission - Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regFullName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      const data = await register({
        username: regUsername.trim(),
        email: regEmail.trim(),
        full_name: regFullName.trim(),
        password: regPassword,
        department: regDepartment,
        two_factor_enabled: false
      });

      if (data.success) {
        setSuccessMsg('Administrator account registered! You can now sign in.');
        setLoginIdentifier(regUsername);
        setLoginPassword(regPassword);
        setMode('login');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed. Username or email may already exist.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md z-10">
        {/* Brand Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 shadow-xl shadow-sky-500/20 mb-3 border border-sky-300/30">
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
            Traffic Intelligence Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bangalore Smart City &bull; Administrator Security Gateway
          </p>
        </div>

        {/* Security Box */}
        <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-3xl p-6 md:p-8 shadow-2xl relative backdrop-blur-xl">
          {/* Header Mode Tabs */}
          <div className="flex bg-[#07111F] p-1 rounded-xl border border-[#1E3A5F] mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In to Console
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register New Admin
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-5 bg-red-500/10 border border-red-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-300">
              <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* LOGIN FORM (DIRECT AUTHENTICATION) */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Administrator Username or Email
                </label>
                <div className="flex items-center bg-[#07111F] border border-[#1E3A5F] rounded-xl px-3 py-2.5 gap-2.5 focus-within:border-sky-400 transition-colors">
                  <User size={15} className="text-slate-500" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="Enter username or email"
                    className="bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none flex-1 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Security Password
                </label>
                <div className="flex items-center bg-[#07111F] border border-[#1E3A5F] rounded-xl px-3 py-2.5 gap-2.5 focus-within:border-sky-400 transition-colors">
                  <Lock size={15} className="text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter security password"
                    className="bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none flex-1 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Direct Sign in button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    <span>Sign In to Command Center</span> <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] text-slate-500">
                  Protected Administrator Gateway &bull; Bangalore Smart City Grid
                </span>
              </div>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
                <div className="flex items-center bg-[#07111F] border border-[#1E3A5F] rounded-xl px-3 py-2 gap-2">
                  <User size={14} className="text-slate-500" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none flex-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="e.g. rajesh_ops"
                    className="w-full bg-[#07111F] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="rajesh@traffic.bbmp.gov.in"
                    className="w-full bg-[#07111F] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department / Jurisdiction</label>
                <div className="flex items-center bg-[#07111F] border border-[#1E3A5F] rounded-xl px-3 py-2 gap-2">
                  <Building2 size={14} className="text-slate-500" />
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={e => setRegDepartment(e.target.value)}
                    className="bg-transparent text-xs text-slate-100 outline-none flex-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#07111F] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-slate-100 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-[#07111F] border border-[#1E3A5F] rounded-xl px-3 py-2 text-xs text-slate-100 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 mt-3"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} /> Create Administrator Account
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Bottom Gateway Footer */}
        <div className="text-center mt-5 text-[11px] text-slate-500 font-mono">
          <span>Bangalore Smart City Digital Twin &bull; DWDM Capstone Security Gateway</span>
        </div>
      </div>
    </div>
  );
}
