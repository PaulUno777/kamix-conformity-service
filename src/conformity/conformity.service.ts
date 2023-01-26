import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NOTFOUND } from 'dns';
import { NotFoundError } from 'rxjs';
import { ConformityHelper } from './conformity.helper';
import { FullName } from './dto/fullName.dto';
import { ResponseDto } from './dto/response.dto';

@Injectable()
export class ConformityService {
  private readonly ConformityHelper = new ConformityHelper();
  //dependencies injection
  constructor(
    private config: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async SingleCheck(fullName: FullName): Promise<any> {
    //create an array that contains combinations of firstNames and lastNames
    const namesArray = this.ConformityHelper.createNamesArray(
      fullName.firstName,
      fullName.lastName,
    );
    //add for my response
    let response = [];
    //request for each names combination
    await Promise.all(
      namesArray.map(async (name) => {
        const result = await this.ConformityHelper.toRequest(
          name,
          this.httpService,
          this.config,
        );
        let elt;
        if (!result) throw NOTFOUND;
        elt = new ResponseDto(name.firstName, name.lastName, result);
        response.push(elt);
      }),
    );
    //return response
    return { data: response, file: 'llhjfgfftfftnjb' };
    //return this.ConformityHelper.generateFileSingle(new Array);
  }
  async test(data?: any) {
    const response = await this.SingleCheck(data);
    const cleanData = this.ConformityHelper.cleanDataSingle(response.data);

    console.log(cleanData);
    this.ConformityHelper.generateFileSingle(cleanData);
    //return this.ConformityHelper.generateFileSingle(new Array);
  }
}
