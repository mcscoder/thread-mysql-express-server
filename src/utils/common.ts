export class CommonUtils {
  static isoToTimeStamp(iosString: string): number {
    return Date.parse(iosString);
  }
}
