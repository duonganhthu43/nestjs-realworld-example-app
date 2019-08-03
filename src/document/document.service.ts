
import { Injectable } from '@nestjs/common';
import { FabricService } from '../user/fabric.client'
import { InvokeRequest } from './document.controller';
import { InMemoryWallet, X509WalletMixin } from 'fabric-network';
import { UserWithFabricCredential } from '../user/user.interface';

@Injectable()
export class DocumentService {
    constructor(private readonly fabricService: FabricService) {
        console.log('====== DocumentService constructor')
    }

    async addDoc(currentUser: UserWithFabricCredential, request: InvokeRequest) {
        return await this.fabricService.chaincodeInvoke(currentUser.username, request, currentUser.wallet)
    }

    async listDoc(currentUser: UserWithFabricCredential, request: InvokeRequest) {
        return await this.fabricService.chainCodeQuery(currentUser.username, request, currentUser.wallet)
    }
}