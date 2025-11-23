import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OptaFundLogo } from '../components/OptaFundLogo';


// --- COMPONENTE DE INPUT OTP (6 Dígitos) ---
const OTPInput = ({ onComplete }: { onComplete: (code: string) => void }) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const val = element.value;
    if (isNaN(Number(val))) return false;
    const newOtp = [...otp];
    
    // Lógica de colar
    if (val.length > 1) {
       const pastedData = val.slice(0, 6).split("");
       for(let i=0; i<pastedData.length; i++) newOtp[i] = pastedData[i];
       setOtp(newOtp);
       if (newOtp.every(d => d !== "")) onComplete(newOtp.join(""));
       inputRefs.current[5]?.focus();
       return;
    }

    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "")) onComplete(newOtp.join(""));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center mb-8 w-full">
      {otp.map((data, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          maxLength={6}
          value={data}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-12 h-14 bg-black/40 border border-gray-800 rounded-lg text-center text-white text-2xl font-semibold focus:border-gray-700 focus:outline-none transition-all"
        />
      ))}
    </div>
  );
};

export default function RegisterPage() {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<'details' | 'otp'>('details');
  
  // Campos do Formulário
  const [email, setEmail] = useState(location.state?.email || '');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);

  // Passo 1: Recolher Dados e Enviar OTP
  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await sendOtp(email, 'register');
      setStep('otp');
      setTimer(30);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar registo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Passo 2: Validar OTP e Criar Conta
  const handleVerifyCode = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Envia o código E os dados novos para criação
      await verifyOtp(email, code, { 
        type: 'register',
        username,
        phoneNumber
      });
      navigate('/'); // Sucesso!
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Código inválido.');
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(p => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
      {/* Glowing purple orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-purple-500 via-violet-600 to-purple-900 blur-[120px] opacity-60"
      />

      {/* Registration form container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <AnimatePresence mode="wait">
          {/* STEP 1: DETAILS */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              {/* Logo and title */}
              <div className="flex flex-col items-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
                  className="mb-6"
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="14" height="14" rx="2" fill="white" />
                    <rect x="22" y="4" width="14" height="14" rx="2" fill="white" />
                    <rect x="4" y="22" width="14" height="14" rx="2" fill="white" />
                    <rect x="22" y="22" width="14" height="14" rx="2" fill="white" />
                  </svg>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl font-semibold text-white mb-2"
                >
                  Create your account
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-sm text-gray-400"
                >
                  Join OptaFund to start tracking
                </motion.p>
              </div>

              <form onSubmit={handleRegisterStep1} className="flex flex-col gap-5">
                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-col gap-2"
                >
                  <label className="text-sm text-gray-400">Email</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-gray-800 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
                    placeholder="name@work-email.com"
                  />
                </motion.div>

                {/* Username */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex flex-col gap-2"
                >
                  <label className="text-sm text-gray-400">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-gray-800 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
                    placeholder="How should we call you?"
                  />
                </motion.div>

                {/* Phone (Optional) */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex flex-col gap-2"
                >
                  <label className="text-sm text-gray-400">
                    Phone Number <span className="text-gray-600">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-gray-800 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
                    placeholder="+1 (555) 000-0000"
                  />
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full py-3 rounded-full bg-gradient-to-r from-gray-100 via-white to-amber-50 text-black font-semibold text-sm tracking-wide hover:shadow-lg hover:shadow-white/20 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "PROCESSING..." : "CONTINUE"}
                </motion.button>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-8 text-center text-sm"
              >
                <span className="text-gray-500">Already have an account? </span>
                <a href="/login" className="text-white hover:underline">
                  Log in
                </a>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="mb-6"
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="14" height="14" rx="2" fill="white" />
                  <rect x="22" y="4" width="14" height="14" rx="2" fill="white" />
                  <rect x="4" y="22" width="14" height="14" rx="2" fill="white" />
                  <rect x="22" y="22" width="14" height="14" rx="2" fill="white" />
                </svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl font-semibold mb-2 text-white text-center"
              >
                Verify Email
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm text-gray-400 mb-8 text-center"
              >
                We sent a code to <span className="text-white">{email}</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full"
              >
                <OTPInput onComplete={handleVerifyCode} />
              </motion.div>

              {isLoading && <div className="text-sm text-gray-400 mb-4">Creating account...</div>}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center space-y-4"
              >
                <p className="text-sm text-gray-400">
                  Didn&apos;t receive code?{" "}
                  {timer > 0 ? (
                    <span className="text-white">{timer}s</span>
                  ) : (
                    <button onClick={(e) => handleRegisterStep1(e as any)} className="text-amber-100 hover:underline">
                      Resend
                    </button>
                  )}
                </p>
                <button
                  onClick={() => setStep("details")}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  ← Change details
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-10 flex gap-6 justify-center w-full text-xs text-gray-600"
        >
          <a href="/terms" className="hover:text-gray-400 transition-colors">
            Terms
          </a>
          <a href="/privacy" className="hover:text-gray-400 transition-colors">
            Privacy
          </a>
        </motion.div>
      </motion.div>

      {/* Footer (absolute positioned) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 text-xs text-gray-600"
      >
        <a href="/terms" className="hover:text-gray-400 transition-colors">
          Terms of Use
        </a>
        <span>|</span>
        <a href="/privacy" className="hover:text-gray-400 transition-colors">
          Privacy policy
        </a>
      </motion.div>
    </div>
  );
}