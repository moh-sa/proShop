import { api } from "./base";

export function signinAPI(email, password) {
  return api.post(
    `/auth/signin`,
    {
      email,
      password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

export function signupAPI(name, email, password) {
  return api.post(
    `/auth/signup`,
    {
      name,
      email,
      password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
