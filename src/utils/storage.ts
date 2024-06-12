class Storage {
  private confirmationCodes: { [key: string]: number | undefined };
  constructor() {
    this.confirmationCodes = {};
  }

  setCode(key: string, code: number) {
    this.confirmationCodes[key] = code;
  }

  checkCode(key: string, code: number, remove: boolean = false): boolean {
    const isMatched = this.confirmationCodes[key] === code;

    // Remove after checking that is matched
    if (isMatched && remove) {
      this.confirmationCodes[key] = undefined;
    }

    return isMatched;
  }
}

export const storage = new Storage();
