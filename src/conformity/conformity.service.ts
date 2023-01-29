import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NOTFOUND } from 'dns';
import * as fs from 'fs';
import { ConformityHelper } from './conformity.helper';
import { FullName } from './dto/fullName.dto';
import { ResponseDto } from './dto/response.dto';
import { ResponseFileDto } from './dto/response.file.dto';

@Injectable()
export class ConformityService {
  private readonly ConformityHelper = new ConformityHelper();
  //dependencies injection
  constructor(
    private config: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sheckSingle(fullName: FullName): Promise<any> {
    //create an array that contains combinations of firstNames and lastNames
    const namesArray = this.ConformityHelper.createNamesArray(
      fullName.firstName,
      fullName.lastName,
    );
    //my response
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
    //clean data for Excel file
    const cleanData = await this.ConformityHelper.cleanDataSingle(response);
    //Generate Excel File
    const fileName = await this.ConformityHelper.generateFileSingle(cleanData, fullName);
    //return response
    return {
      data: response,
      file: this.config.get('API_PUBLIC_URL') + fileName,
    };
  }
  async checkFile(fileName: any) {
    //get data from Excel file
    const data = await this.ConformityHelper.excelToArray(fileName); 
    //my response
    let response = [];
    //Make my request
    await Promise.all(
      data.map(async (elt: any) => {
        const result = await this.ConformityHelper.toRequestMultiple(
          elt,
          this.httpService,
          this.config,
        );
        if (!result) throw NOTFOUND;
        let date = 'no date';
        if (elt.DNAISS) date = elt.DNAISS;
        const row = new ResponseFileDto(elt.ID, elt.PRENOM, elt.NOM, date, result);
        response.push(row);
        console.log(row);
      })
    );

    //clean data 
    const cleanData =await this.ConformityHelper.cleanDataMultiple(response); 

    //write the result file
    const resultFileName = await this.ConformityHelper.generateFileMultiple(cleanData, fileName);

    return {
      resultFile: this.config.get('API_PUBLIC_URL') + resultFileName,
    };
  }
}
