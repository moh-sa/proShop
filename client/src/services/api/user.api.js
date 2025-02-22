import { api } from "./base";

export function getUserDetailsAPI(userId, token) {
  return api.get(`/users/admin/${userId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateUserProfileAPI(user, token) {
  return api.patch(`/users/profile`, user, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export function listUsersAPI(token) {
  return api.get(`/users/admin`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function deleteUserAPI(userId, token) {
  return api.delete(`/users/admin/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateUserAPI(user, token) {
  return api.patch(`/users/admin/${user._id}`, user, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}
