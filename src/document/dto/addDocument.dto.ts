import { IsNotEmpty } from 'class-validator';

export class AddDocumentDto {

    @IsNotEmpty()
    readonly hash: string;

    @IsNotEmpty()
    readonly fileName: string;
}