
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Secure Email Service
 * 
 * This service manages the dispatch of OTPs and General Notifications.
 * 
 * ---------------------------------------------------------------------------
 * ⚙️ DYNAMIC KEY LOADER
 * ---------------------------------------------------------------------------
 * 1. Checks process.env (Environment Variables)
 * 2. Checks Firestore 'system_config/email_keys' (Remote Config)
 *    - Supports snake_case, camelCase, and PascalCase fields in Firestore.
 * 3. Fallback: Returns null (Enables restricted Dev Mode)
 */

interface EmailKeys {
  SERVICE_ID: string;
  TEMPLATE_ID: string;
  PUBLIC_KEY: string;
}

const getEmailKeys = async (): Promise<EmailKeys | null> => {
  // 1. Try Environment Variables first (Prioritize local dev overrides)
  if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
    return {
      SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
      TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID,
      PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY
    };
  }

  // 2. Try Firestore Remote Config
  try {
    const docRef = doc(db, 'system_config', 'email_keys');
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      
      // Robustly check for keys regardless of casing (snake_case, camelCase, PascalCase)
      const serviceId = data.service_id || data.serviceId || data.ServiceId;
      const templateId = data.template_id || data.templateId || data.TemplateId;
      // EmailJS uses 'user_id' for public key, so prioritize that if available in Firestore
      const publicKey = data.public_key || data.publicKey || data.PublicKey || data.user_id || data.UserID;

      if (serviceId && templateId && publicKey) {
        console.log("[EmailService] Keys loaded from Firestore successfully.");
        return {
          SERVICE_ID: serviceId,
          TEMPLATE_ID: templateId,
          PUBLIC_KEY: publicKey
        };
      } else {
        console.warn("[EmailService] Firestore document found but keys are missing or malformed.", data);
      }
    } else {
      console.warn("[EmailService] No 'system_config/email_keys' document found in Firestore.");
    }
  } catch (error) {
    console.warn("[EmailService] Failed to fetch remote keys (Permission or Network issue):", error);
  }

  return null;
};

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  otp?: string;
  timestamp: number;
}

const simulateEmail = (to: string, subject: string, body: string, otp?: string) => {
    // SECURITY: Log to console only for developer debugging. No UI alerts.
    console.group("🔐 [SECURE SIMULATION - INTERNAL LOG]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`); // Also log body for full context
    if (otp) {
        console.log(`CODE: ${otp}`);
        console.warn("⚠️ DEV WARNING: Real email keys not configured. Use this code from console to test.");
    }
    console.groupEnd();
    return true;
};

const sendViaEmailJS = async (to: string, subject: string, body: string, otp: string = '', customTemplateId?: string) => {
  const keys = await getEmailKeys();

  // 1. If NO keys are configured, use Simulation Mode (Development)
  if (!keys) {
    console.warn("[EmailService] No API keys found. Defaulting to Console Simulation.");
    return simulateEmail(to, subject, body, otp);
  }

  // 2. If keys ARE configured, attempt real send.
  try {
    console.log(`[SECURE EMAIL] Attempting to send to ${to} via EmailJS...`);
    
    // Construct a payload that uses common variable names for EmailJS templates.
    // This makes it more likely to work with generic templates without user customization.
    const templateParams = {
        to_email: to,
        recipient_email: to, // Another common name
        user_email: to,      // Another common name
        
        subject: subject,
        email_subject: subject, // Another common name
        
        message: body,
        email_body: body, // Another common name
        
        otp: otp,
        otp_code: otp,      // Another common name
        verification_code: otp, // Another common name
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: keys.SERVICE_ID,
        template_id: customTemplateId || keys.TEMPLATE_ID,
        user_id: keys.PUBLIC_KEY, // EmailJS often expects the public key here as 'user_id'
        template_params: templateParams
      })
    });

    if (response.ok) {
      console.log("[SECURE EMAIL] ✅ Email sent successfully.");
      return true;
    } else {
      const errorText = await response.text();
      console.error("[SECURE EMAIL] ❌ EmailJS Provider Error (HTTP Status: %s): %s", response.status, errorText);
      
      // SECURITY CRITICAL:
      // If the email service is configured but fails (e.g., quota exceeded, wrong keys),
      // we MUST return FALSE. Falling back to simulation here would allow an attacker 
      // to exploit a "broken" email config to bypass 2FA.
      return false; 
    }
  } catch (e) {
    console.error("[SECURE EMAIL] ❌ Network/Fetch Exception:", e);
    return false;
  }
};

export const sendSecureOTP = async (email: string, otp: string, type: 'verification' | 'reset'): Promise<EmailMessage | null> => {
  
  const subject = type === 'verification' 
    ? "Verify your ElectroRescue Account" 
    : "ElectroRescue Password Reset Request"; // Changed subject for clarity

  const body = type === 'verification'
    ? `Welcome to ElectroRescue!\n\nYour verification code is: ${otp}\n\nPlease enter this code to verify your email address.`
    : `We received a request to reset your password for your ElectroRescue account.\n\nYour Secure OTP is: ${otp}\n\nIf you did not request this, please ignore this email.`;

  const sent = await sendViaEmailJS(email, subject, body, otp);

  if (!sent) {
      // Return null to indicate failure to the UI, which should block the process
      return null;
  }

  return {
    to: email,
    subject,
    body,
    otp,
    timestamp: Date.now()
  };
};

export const sendGeneralEmail = async (email: string, subject: string, body: string, customTemplateId?: string): Promise<boolean> => {
  const sent = await sendViaEmailJS(email, subject, body, '', customTemplateId);
  return sent;
};
