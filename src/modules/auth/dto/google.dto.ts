import { IsNotEmpty, IsString } from "class-validator";

export class GoogleDTO {
  @IsNotEmpty()
  @IsString()
  accessToken!: string;
}