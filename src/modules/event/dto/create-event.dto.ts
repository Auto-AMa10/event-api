import { Transform, Type } from "class-transformer";
import {
  IsDate,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from "class-validator";

export class CreateEventDTO {
  @IsString()
  title!: string;
  
  @IsString()
  description!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  price!: number;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @IsString()
  location!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  categoryId!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  totalSeats!: number;
}