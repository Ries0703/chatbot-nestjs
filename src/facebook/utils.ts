import { Injectable } from '@nestjs/common';

@Injectable()
export class Utils {
  public getGMT7Timestamp(date: Date, offsetHours: number): Date {
    return new Date(date.getMilliseconds() + offsetHours * 60 * 60 * 1000);
  }
}
