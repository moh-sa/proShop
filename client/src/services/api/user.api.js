import { api } from "./base";

export function loginAPI(email, password) {
  return api.post(
    `/users/login`,
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

export function registerAPI(name, email, password) {
  return api.post(
    `/users`,
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

export function getUserDetailsAPI(userId, token) {
  return api.get(`/users/${userId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateUserProfileAPI(user, token) {
  return api.put(`/users/profile`, user, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export function listUsersAPI(token) {
  return api.get(`/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function deleteUserAPI(userId, token) {
  return api.delete(`/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateUserAPI(user, token) {
  return api.put(`/users/${user._id}`, user, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}
