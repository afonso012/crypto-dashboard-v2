import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// --- COMPONENTE DE INPUT OTP (6 Dígitos) ---
const OTPInput = ({ onComplete }: { onComplete: (code: string) => void }) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-between mb-6">
      {otp.map((data, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          maxLength={1}
          value={data}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-10 h-12 md:w-12 md:h-14 border border-gray-800 bg-black/40 rounded-lg text-center text-white text-xl font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-all"
        />
      ))}
    </div>
  );
};

export default function LoginPage() {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Adicionámos o estado 'prompt' para a nova funcionalidade
  const [step, setStep] = useState<'email' | 'otp' | 'prompt'>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);

  // Passo 1: Enviar Código
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Tenta login. Se o user não existir, o backend lança erro 404
      await sendOtp(email, 'login');
      setStep('otp');
      setTimer(30);
    } catch (err: any) {
      // Se o erro for "não encontrado", mudamos para o ecrã de prompt
      if (err.message && (err.message.includes('não encontrado') || err.message.includes('Não existe'))) {
        setStep('prompt');
      } else {
        setError(err.message || 'Erro ao enviar código.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Passo 2: Verificar Código
  const handleVerifyOtp = async (code: string) => {
    setIsLoading(true);
    try {
      await verifyOtp(email, code);
      navigate('/');
    } catch (err) {
      setIsLoading(false);
      setError('Código inválido.');
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* Background Glow (O original que gostaste) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.5 }}
        className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-900 blur-[130px] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-md px-6">
        
        {/* Logo (O original de 4 quadrados) */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
             <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="4" width="14" height="14" rx="2" fill="white" />
              <rect x="22" y="4" width="14" height="14" rx="2" fill="white" />
              <rect x="4" y="22" width="14" height="14" rx="2" fill="white" />
              <rect x="22" y="22" width="14" height="14" rx="2" fill="white" />
            </svg>
          </div>
          
          {/* Título Dinâmico */}
          <h1 className="text-3xl font-semibold text-white tracking-tight text-center">
            {step === 'email' && 'Sign in to OptaFund'}
            {step === 'otp' && 'Check your inbox'}
            {step === 'prompt' && 'Account not found'}
          </h1>
          
          <p className="text-gray-400 text-sm mt-2 text-center h-5">
            {step === 'email' && 'Welcome back! Enter your email to continue.'}
            {step === 'otp' && `We sent a code to ${email}`}
            {step === 'prompt' && 'Would you like to create a new account?'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          
          {/* --- PASSO 1: EMAIL --- */}
          {step === 'email' && (
            <motion.form
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSendCode}
            >
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm text-gray-400 mb-2 font-medium">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@work-email.com"
                  className="w-full px-4 py-3.5 bg-black/40 border border-gray-800 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all"
                />
              </div>

              {error && (
                <div className="mb-4 text-red-400 text-xs text-center bg-red-900/20 p-2 rounded border border-red-900/50">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3.5 rounded-full bg-white text-black font-bold text-sm tracking-wide hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                ) : 'CONTINUE WITH EMAIL'}
              </button>

              <div className="flex items-center gap-4 my-8">
                 <div className="flex-1 h-px bg-gray-800/50" />
                 <span className="text-gray-600 text-xs uppercase tracking-widest">Or</span>
                 <div className="flex-1 h-px bg-gray-800/50" />
              </div>

              <div className="flex gap-4">
                 <button type="button" className="flex-1 h-12 flex items-center justify-center bg-black/40 border border-gray-800 rounded-lg hover:bg-white/5 transition-colors text-white text-sm">Google</button>
                 <button type="button" className="flex-1 h-12 flex items-center justify-center bg-black/40 border border-gray-800 rounded-lg hover:bg-white/5 transition-colors text-white text-sm">GitHub</button>
              </div>
            </motion.form>
          )}

          {/* --- PASSO 2: OTP --- */}
          {step === 'otp' && (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <OTPInput onComplete={handleVerifyOtp} />

              <div className="text-center">
                 {isLoading ? (
                    <div className="text-white text-sm flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      Verifying code...
                    </div>
                 ) : (
                   <p className="text-sm text-gray-500">
                     Didn't receive code?{' '}
                     {timer > 0 ? (
                       <span className="text-gray-400">Resend in {timer}s</span>
                     ) : (
                       <button 
                         onClick={(e) => handleSendCode(e as any)}
                         className="text-white hover:underline cursor-pointer"
                       >
                         Resend now
                       </button>
                     )}
                   </p>
                 )}
              </div>

              <button 
                onClick={() => setStep('email')}
                className="mt-8 w-full text-xs text-gray-600 hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                ← Wrong email address?
              </button>
            </motion.div>
          )}

          {/* --- PASSO 3: CONTA NÃO ENCONTRADA (O NOVO DESIGN) --- */}
          {step === 'prompt' && (
            <motion.div
              key="prompt-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <div className="bg-black/40 border border-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-300 mb-6">
                  We couldn't find an account for <strong className="text-white">{email}</strong>.
                </p>
                
                <button
                  onClick={() => navigate('/register', { state: { email } })}
                  className="w-full py-3.5 rounded-full bg-white text-black font-bold text-sm tracking-wide hover:bg-gray-200 transition-all mb-3"
                >
                  CREATE ACCOUNT
                </button>
                
                <button
                  onClick={() => { setStep('email'); setEmail(''); }}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Try a different email
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        <div className="absolute bottom-[-80px] left-0 right-0 flex items-center justify-center gap-4 text-xs text-gray-600">
          <Link to="#" className="hover:text-gray-400">Terms</Link>
          <span>|</span>
          <Link to="#" className="hover:text-gray-400">Privacy</Link>
        </div>
      </div>
    </div>
  )
}