

import { Get, Post, Body, Put, Delete, Param, Controller, UsePipes } from '@nestjs/common';
import { FabricService } from '../user/fabric.client'
import { Request } from 'express';
import { ValidationPipe } from '../shared/pipes/validation.pipe';
import { DocumentService } from './document.service'
import { AddDocumentDto } from './dto/addDocument.dto'
import {
    ApiUseTags,
    ApiBearerAuth
} from '@nestjs/swagger';
import { User } from '../user/user.decorator';
import { UserWithFabricCredential } from '../user/user.interface';

@ApiBearerAuth()
@ApiUseTags('document')
@Controller()
export class DocumentController {
    constructor(private readonly documentService: DocumentService) { }
    @UsePipes(new ValidationPipe())
    @Post('documents/add')
    async add(@Body() newDocsInfo: AddDocumentDto, @User() currentUser: UserWithFabricCredential) {
        try {
            const temp = `{"hash":"${newDocsInfo.hash}","name":"${newDocsInfo.fileName}","owner":"${currentUser.username}"}`
            var result = await this.documentService.addDoc(currentUser, { chaincodeID: 'poe-100', functionName: 'addDoc', args: [newDocsInfo.hash, temp] })
            return result
        }
        catch (err) {
            return { "message": err.message , "error" : err && err.endorsements && err.endorsements[0] && err.endorsements[0].message}
        }
    }

    @Get('documents/list')
    async list(@User() currentUser: UserWithFabricCredential) {
        try {
            let lstResult = await this.documentService.listDoc(currentUser, {chaincodeID: 'poe-100', functionName: 'listDoc', args: []})
            const list = JSON.parse(lstResult)
            return list
        }catch (err) {
            return {"error": err}
        }
    }
}

export interface InvokeRequest {
    chaincodeID: string;
    functionName: string;
    args: any
}