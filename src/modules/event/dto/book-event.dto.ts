import { Transform } from "class-transformer";
import { IsInt } from "class-validator";

export class BookEventDTO {
  @Transform(({ value }) => Number(value))
  @IsInt()
  eventId!: number;
}
