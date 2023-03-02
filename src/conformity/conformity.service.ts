import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NOTFOUND, SERVFAIL } from 'dns';
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
    const response = [];
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
    const fileName = await this.ConformityHelper.generateFileSingle(
      cleanData,
      fullName,
    );
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
    const response = [];
    let date = 'NULL';
    //Make my request
    await Promise.all(
      data.map(async (elt: any) => {
        //request body
        const scanInputParam = {
          matchType: 'Close',
          closeMatchRateThreshold: 80,
          whitelist: 'Apply',
          residence: 'Ignore',
          blankAddress: 'ApplyResidenceCountry',
          pepJurisdiction: 'Apply',
          excludeDeceasedPersons: 'no',
          memberNumber: '',
          clientId: '',
          includeResultEntities: 'Yes',
          updateMonitoringList: 'no',
          includeWebSearch: 'No',
        };
        //set IDs
        scanInputParam.memberNumber = elt.ID;
        scanInputParam.clientId = elt.ID;
        //Include FirstName and LastName if they two exist
        if (elt.PRENOM && elt.NOM) {
          scanInputParam['firstName'] = elt.PRENOM;
          scanInputParam['lastName'] = elt.NOM;
        } else {
          if (elt.PRENOM) scanInputParam['scriptNameFullName'] = elt.PRENOM;
          if (elt.NOM) scanInputParam['scriptNameFullName'] = elt.NOM;
        }
        if (elt.DNAISS) {
          scanInputParam['dob'] = elt.DNAISS;
          date = elt.DNAISS;
        }

        console.log(scanInputParam);
        //make request to membercheck
        const result = await this.ConformityHelper.toRequestMultiple(
          scanInputParam,
          this.httpService,
          this.config,
        );
        if (elt.DNAISS) date = elt.DNAISS;
        const row = new ResponseFileDto(
          elt.ID,
          elt.PRENOM,
          elt.NOM,
          date,
          result,
        );
        response.push(row);
      }),
    );

    response.sort((a, b) => (a.id > b.id ? 1 : b.id > a.id ? -1 : 0));
    //clean data
    const cleanData = await this.ConformityHelper.cleanDataMultiple(response);

    //write the result file
    const resultFileName = await this.ConformityHelper.generateFileMultiple(
      cleanData,
      fileName,
    );

    return {
      resultFile: this.config.get('API_PUBLIC_URL') + resultFileName,
    };
  }
}
