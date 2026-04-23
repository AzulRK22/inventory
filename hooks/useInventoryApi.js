"use client";

export async function requestInventory(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: options.cache || "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "The operation could not be completed.");
  }

  return data;
}
