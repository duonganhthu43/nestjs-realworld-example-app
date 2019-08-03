import { Get, Post, Body, Put, Delete, Param, Controller, UsePipes } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { FabricService } from './fabric.client'
import { UserEntity } from './user.entity';
import { UserRO } from './user.interface';
import { CreateUserDto, UpdateUserDto, LoginUserDto } from './dto';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { User } from './user.decorator';
import { ValidationPipe } from '../shared/pipes/validation.pipe';
import { HttpStatus } from '@nestjs/common';
import {
  ApiUseTags,
  ApiBearerAuth
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiUseTags('user')
@Controller()
export class UserController {

  constructor(private readonly userService: UserService, private readonly fabricService: FabricService) { }
  
  @UsePipes(new ValidationPipe())
  @Post('users')
  async create(@Body('user') userData: CreateUserDto) {
    const fabricCreateUserResult = await this.fabricService.createFabricUser(userData.username, userData.password)
    if(fabricCreateUserResult.identity) {
      userData.fabricIdentity = fabricCreateUserResult.identity
      return this.userService.create(userData);
    }
    throw new HttpException({message: 'Cannot create Fabric identity', _errors :fabricCreateUserResult.error}, HttpStatus.BAD_REQUEST);
  }

  @UsePipes(new ValidationPipe())
  @Post('users/login')
  async login(@Body('user') loginUserDto: LoginUserDto): Promise<UserRO> {
    const _user = await this.userService.findOne(loginUserDto);
    const errors = { User: ' not found' };
    if (!_user) throw new HttpException({ errors }, 401);
    const token = await this.userService.generateJWT(_user);
    const { email, username } = _user;
    const user = { email, token, username };
    return { user }
  }

  @Get('user')
  async findMe(@User('email') email: string): Promise<UserRO> {
    return await this.userService.findByEmail(email);
  }

  // @Put('user')
  // async update(@User('id') userId: number, @Body('user') userData: UpdateUserDto) {
  //   return await this.userService.update(userId, userData);
  // }



  // @Delete('users/:slug')
  // async delete(@Param() params) {
  //   return await this.userService.delete(params.slug);
  // }


}
