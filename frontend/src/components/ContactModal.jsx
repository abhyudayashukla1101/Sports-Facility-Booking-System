import { useState } from "react";
import { X, Mail, Phone, Clock, Send, CheckCircle2, Building2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function ContactModal({ onClose }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [emailOrRoll, setEmailOrRoll] = useState(user?.rollNumber || "");
  const [subject, setSubject] = useState("Facility Booking Query");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border p-5 bg-surface-hover/40">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-accent uppercase">
              Sports Board × Gymkhana
            </span>
            <h3 className="font-display text-xl font-bold text-white">
              Contact Sports Desk
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface-border hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 text-xs text-muted">
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Sports Board Secretariat</div>
                <div>Students' Affairs Centre (SAC), First Floor</div>
                <div>IIT Guwahati, Assam - 781039</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-accent shrink-0" />
              <div>
                <div className="font-bold text-white">General & Booking Queries</div>
                <a href="mailto:sportsboard@iitg.ac.in" className="text-accent hover:underline">
                  sportsboard@iitg.ac.in
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-available shrink-0" />
              <div>
                <div className="font-bold text-white">Ground Helpdesk</div>
                <div>+91 361 258 2000 (Ext. 2045)</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted shrink-0" />
              <div>
                <div className="font-bold text-white">Desk Operating Hours</div>
                <div>Mon – Sat: 9:00 AM – 6:00 PM</div>
              </div>
            </div>

            <div className="pt-2 border-t border-surface-border/60 text-[11px] text-muted">
              For emergency lighting issues at grounds after 8 PM, please notify the caretaker on duty at SAC.
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-available animate-bounce" />
                <h4 className="font-display text-lg font-bold text-white">Query Submitted!</h4>
                <p className="text-xs text-muted">
                  Sports board administrator will respond to your registered email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Student Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-base/90 p-2 text-xs text-white focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase">
                    Roll No / Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Roll No. or Webmail"
                    value={emailOrRoll}
                    onChange={(e) => setEmailOrRoll(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-base/90 p-2 text-xs text-white focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase">
                    Subject / Facility
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-base/90 p-2 text-xs text-white focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase">
                    Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your query or equipment request..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-base/90 p-2 text-xs text-white focus:border-accent focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2 text-xs font-bold text-accent-foreground shadow-md transition hover:brightness-110"
                >
                  <Send className="h-3.5 w-3.5" /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
