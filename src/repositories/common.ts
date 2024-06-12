import { storage } from "../utils";

export class CommonRepo {
  static getConfirmationCode(email: string): number {
    const randomInt = Math.floor(100000 + Math.random() * 900000);
    storage.setCode(email, randomInt);
    return randomInt;
  }

  static checkConfirmationCode(email: string, code: number): boolean {
    return storage.checkCode(email, code, true);
  }
}
