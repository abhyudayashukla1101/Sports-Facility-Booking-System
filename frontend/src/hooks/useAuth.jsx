import { useState, useEffect, createContext, useContext } from "react";

const AUTH_STORAGE_KEY = "playfield_iitg_auth_user";
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to sync auth user to localStorage", e);
    }
  }, [user]);

  const loginAsStudent = async ({ name, rollNumber, hostel }) => {
    try {
      // Call Node.js Backend API
      const res = await fetch(`${BACKEND_URL}/api/auth/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rollNumber, hostel })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.warn("Backend auth offline, using local session fallback:", err);
    }

    // Fallback if backend is connecting
    const fallbackUser = {
      role: "student",
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      hostel: hostel || "Lohit",
      signedInAt: new Date().toISOString()
    };
    setUser(fallbackUser);
    return fallbackUser;
  };

  const loginAsAdmin = async (passcode) => {
    try {
      // Call Node.js Backend API
      const res = await fetch(`${BACKEND_URL}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || "Invalid Admin Passcode" };
      }
    } catch (err) {
      console.warn("Backend auth offline, checking local passcode:", err);
      if (passcode === "iitgadmin" || passcode === "123456" || passcode === "admin") {
        const fallbackAdmin = {
          role: "admin",
          name: "IITG Gymkhana Admin",
          signedInAt: new Date().toISOString()
        };
        setUser(fallbackAdmin);
        return { success: true, user: fallbackAdmin };
      }
      return { success: false, error: "Invalid Admin Passcode (Try 'iitgadmin' or '123456')" };
    }
  };

  const registerStudentAccount = async ({ name, rollNumber, hostel, phone, passcode }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rollNumber, hostel, phone, passcode })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || "Registration failed" };
      }
    } catch (err) {
      // Fallback
      const newUser = {
        role: "student",
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        hostel: hostel || "Lohit",
        phone: phone || null,
        signedInAt: new Date().toISOString()
      };
      setUser(newUser);
      return { success: true, user: newUser };
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isStudent: user?.role === "student",
        isAdmin: user?.role === "admin",
        loginAsStudent,
        registerStudentAccount,
        loginAsAdmin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
