import { useState, useEffect, createContext, useContext } from "react";

const AUTH_STORAGE_KEY = "playfield_iitg_auth_user";

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

  const loginAsStudent = ({ name, rollNumber, hostel }) => {
    const studentUser = {
      role: "student",
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      hostel: hostel || "Lohit",
      signedInAt: new Date().toISOString()
    };
    setUser(studentUser);
    return studentUser;
  };

  const loginAsAdmin = (passcode) => {
    if (passcode === "iitgadmin" || passcode === "123456" || passcode === "admin") {
      const adminUser = {
        role: "admin",
        name: "IITG Gymkhana Admin",
        signedInAt: new Date().toISOString()
      };
      setUser(adminUser);
      return { success: true, user: adminUser };
    }
    return { success: false, error: "Invalid Admin Passcode (Try 'iitgadmin' or '123456')" };
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
