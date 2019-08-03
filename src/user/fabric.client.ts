import { Injectable } from '@nestjs/common';
import connectionProfile from './connection.json'
import FabricClient from 'fabric-client'
import { FileSystemWallet, Gateway, X509WalletMixin, InMemoryWallet, Wallet } from 'fabric-network'
import FabricCAServices from 'fabric-ca-client'
import * as path from 'path';
import { InvokeRequest } from '../document/document.controller.js';


@Injectable()
export class FabricService {
    private wallet = new FileSystemWallet(path.resolve(__dirname, `myStorageConfig`));

    async createFabricUser(userName, password) {
        let gateway
        const wallet = this.wallet
        try {
            const adminReady = await wallet.exists('admin');
            if (!adminReady) {
                const caKeys = Object.keys(connectionProfile.certificateAuthorities);
                const caUrl = connectionProfile.certificateAuthorities[caKeys[0]].url;
                let caService = new FabricCAServices(caUrl);
                let registrarId = 'admin'
                let registrarPw = 'adminpw'
                const enrollment = await caService.enroll({ enrollmentID: registrarId, enrollmentSecret: registrarPw });
                let client = FabricClient.loadFromConfig(connectionProfile);
                const mspID = client.getMspid();
                const cert = enrollment.certificate;
                const key = enrollment.key.toBytes();
                const identity = X509WalletMixin.createIdentity(mspID, cert, key);
                await wallet.import('admin', identity);
            }
            const gatewayOptions = {
                identity: 'admin',
                wallet,
                discovery: {
                    enabled: true,
                    asLocalhost: true
                }
            };
            gateway = new Gateway();
            await gateway.connect(connectionProfile, gatewayOptions);
            let client = gateway.getClient();
            let ca = client.getCertificateAuthority();
            let registrar = gateway.getCurrentIdentity();
            const registrationRequest = {
                enrollmentID: userName,
                enrollmentSecret: password,
                affiliation: '',
                maxEnrollments: 0,
                role: 'client'
            };
            await ca.register(registrationRequest, registrar);
            const enrollmentRequest = {
                enrollmentID: userName,
                enrollmentSecret: password
            };
            const enrollment = await ca.enroll(enrollmentRequest);
            const mspID = client.getMspid();
            const cert = enrollment.certificate;
            const key = enrollment.key.toBytes();
            const identity = X509WalletMixin.createIdentity(mspID, cert, key);
            await wallet.import(userName, identity);
            gateway.disconnect();
            return { identity: identity }
        }
        catch (err) {
            console.log('====== error ', err)
            if (gateway) {
                gateway.disconnect();
            }
            return { identity: undefined, error: err }
        }
    }

    async chaincodeInvoke(user, invokeRequest: InvokeRequest, wallet: Wallet) {
        const ccID = invokeRequest.chaincodeID;
        let gateway;
        try {
            const gatewayOptions = {
                identity: user,
                wallet: wallet,
                discovery: {
                    enabled: true,
                    asLocalhost: true
                }
            };
            gateway = new Gateway();
            await gateway.connect(connectionProfile, gatewayOptions);
            const network = await gateway.getNetwork('mychannel');
            const contract = network.getContract(ccID);
            const result = await contract.submitTransaction(invokeRequest.functionName, ...invokeRequest.args);
            return result
        }
        catch (err) {
            console.log('===== errr  ', err)
            return Promise.reject(err);
        }
        finally {
            if (gateway)
                gateway.disconnect();
        }
    }

    async chainCodeQuery(user, queryRequest, wallet: Wallet) {
        const ccID = queryRequest.chaincodeID;
        let gateway;
        try {
            const gatewayOptions = {
                identity: user,
                wallet: wallet,
                discovery: {
                    enabled: true,
                    asLocalhost: true
                }
            };
            gateway = new Gateway();
            await gateway.connect(connectionProfile, gatewayOptions);
            const network = await gateway.getNetwork('mychannel');
            const contract = network.getContract(ccID);
            const result = await contract.evaluateTransaction(queryRequest.functionName, ...queryRequest.args);
            console.log('===== result Chaincode querry ', result)
            return Promise.resolve(result);
        } catch (err) {
            console.log('===== errr  ', err)
            return Promise.reject(err);
        } finally {
            if (gateway)
                gateway.disconnect();
        }
    }
}
