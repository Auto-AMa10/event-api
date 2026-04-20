import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto.js";

export class GetBlogsDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  search?: string;
}
