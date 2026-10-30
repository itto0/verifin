import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthUser } from '../../types';

interface LoginViewProps {
  onLogin: (user: AuthUser) => void;
}

export const DEMO_USERS: AuthUser[] = [
  {
    id: 'USR-001',
    name: 'Dian Pratama',
    email: 'dian.pratama@baf.id',
    role: 'Senior Verifier',
    level: 'Level 2 Verifier',
    branch: 'Jakarta South Hub',
    avatarInitials: 'DP',
    employeeNik: 'BAF-EMP-8842'
  },
  {
    id: 'USR-002',
    name: 'Budi Santoso',
    email: 'budi.santoso@baf.id',
    role: 'Risk Lead & Fraud Specialist',
    level: 'Supervisory Lead',
    branch: 'Head Office (Risk Engine)',
    avatarInitials: 'BS',
    employeeNik: 'BAF-EMP-4019'
  },
  {
    id: 'USR-003',
    name: 'Rina Anggraini',
    email: 'rina.anggraini@baf.id',
    role: 'Branch Verification Officer',
    level: 'Level 1 Underwriter',
    branch: 'Kota Bekasi Branch',
    avatarInitials: 'RA',
    employeeNik: 'BAF-EMP-9174'
  }
];

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('dian.pratama@baf.id');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your corporate email or NIK.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const matched = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === trimmedEmail || u.employeeNik.toLowerCase() === trimmedEmail
      );

      const authenticatedUser: AuthUser = matched || {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: trimmedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        email: trimmedEmail.includes('@') ? trimmedEmail : `${trimmedEmail}@baf.id`,
        role: 'Senior Verifier',
        level: 'Level 2 Verifier',
        branch: 'Jakarta South Hub',
        avatarInitials: trimmedEmail.slice(0, 2).toUpperCase(),
        employeeNik: 'BAF-EMP-7710'
      };

      setIsLoading(false);
      onLogin(authenticatedUser);
    }, 350);
  };

  const handleSelectDemoUser = (user: AuthUser) => {
    setEmail(user.email);
    setPassword('BafSecure2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-[#1A1A1A]">
      <div className="max-w-sm w-full mx-auto space-y-4">
        {/* Main Card */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-6 sm:p-8 space-y-6">
          {/* Logo & Heading inside card */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              {!logoError ? (
                <img
                  src="https://cdn-jk01.kabaroto.com/media/6f/4d/b9/6f4db95441531a1b78f188073be60248_800x450.jpeg"
                  alt="BAF Logo"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="h-12 w-auto max-w-[200px] object-contain"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm tracking-wider">
                  BAF
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-[#1A1A1A]">
                Sign in
              </h1>
              <p className="text-xs text-[#6B6B6B]">
                VeriFin Underwriting Platform
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-[#1A1A1A] block">
                Email or Employee NIK
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@baf.id or BAF-EMP-XXXX"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#2563EB] text-[#1A1A1A] placeholder:text-[#6B6B6B]"
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setErrorMessage('Demo mode: Click any account below to sign in instantly.')}
                  className="text-xs text-[#2563EB] hover:underline"
                >
                  Help
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#2563EB] text-[#1A1A1A] placeholder:text-[#6B6B6B] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B6B6B] hover:text-[#1A1A1A]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="pt-4 border-t border-[#E5E5E3] space-y-2">
            <span className="text-xs font-medium text-[#6B6B6B] block text-left">
              Demo accounts
            </span>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((user) => {
                const isSelected = email.toLowerCase() === user.email.toLowerCase();
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectDemoUser(user)}
                    className={`p-2 rounded-lg border text-center transition-colors text-xs ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                        : 'border-[#E5E5E3] bg-[#F7F7F5] text-[#1A1A1A] hover:bg-white'
                    }`}
                  >
                    <div className="font-semibold truncate">{user.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-[#6B6B6B] truncate">{user.role.split(' ')[0]}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-xs text-[#6B6B6B]">
          PT Bussan Auto Finance · OJK Compliant (POJK 35/2018)
        </p>
      </div>
    </div>
  );
};
