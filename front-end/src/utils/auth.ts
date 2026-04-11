export type UserPayload = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  phone?: string;
  gender?: string;
};

export type JwtPayload = {
  user?: UserPayload;
};

const decodeBase64 = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return atob(padded);
};

export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }
    const decoded = decodeBase64(payload);
    return JSON.parse(decoded) as JwtPayload;
  } catch (error) {
    console.warn("Unable to decode token", error);
    return null;
  }
};

export const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }
  const payload = decodeJwt(token);
  return payload?.user ?? null;
};

export const ensureUserSession = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }

  const payload = decodeJwt(token);
  const user = payload?.user;
  if (!user) {
    return;
  }

  if (user.id && !sessionStorage.getItem("id_user")) {
    sessionStorage.setItem("id_user", user.id);
  }

  if (!localStorage.getItem("user")) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};
