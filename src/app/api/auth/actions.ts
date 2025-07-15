"use server";

import { userRepository } from "lib/db/repository";

export async function existsByEmailAction(email: string) {
  const exists = await userRepository.existsByEmail(email);
  return exists;
}
