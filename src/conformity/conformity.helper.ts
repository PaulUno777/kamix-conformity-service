import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Workbook } from 'exceljs';
import { catchError, firstValueFrom } from 'rxjs';
import { FullName } from './dto/fullName.dto';
import { InputBody } from './dto/inputbody.dto';
import * as fs from 'fs';
import * as xlsx from 'xlsx';
import { join } from 'path';
import { ResponseFileDto } from './dto/response.file.dto';

export class ConformityHelper {
  private readonly logger = new Logger(ConformityHelper.name);
  // generate combinaison of elements from name array
  combineNames(names: string[]): string[] {
    let outputNames = names.slice();
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        if (names[i] != names[j]) {
          const name = names[i] + ' ' + names[j];
          outputNames.push(name);
        }
      }
    }
    return outputNames;
  }
  // transform string names to Array<string> of names
  transfarmName(name: string): string[] {
    let tempArray: Array<string> = [];
    if (name.trim().includes(' ')) {
      return name.trim().split(' ');
    } else {
      tempArray.push(name.trim());
      return tempArray;
    }
  }

  // generate combinaison of first_name and last_name
  createNamesArray(first_name: string, last_name: string) {
    let firstArray = this.transfarmName(first_name);
    if (this.transfarmName(first_name).length >= 1) {
      firstArray = this.combineNames(this.transfarmName(first_name));
    }

    let lastArray = this.transfarmName(last_name);
    if (this.transfarmName(last_name).length >= 1) {
      lastArray = this.combineNames(this.transfarmName(last_name));
    }

    let combinedArray = [];

    for (let i = 0; i < firstArray.length; i++) {
      lastArray.forEach((elt) => {
        let fullName = new FullName();
        fullName.firstName = firstArray[i];
        fullName.lastName = elt;
        combinedArray.push(fullName);
      });
    }
    return combinedArray;
  }

  //send a Request to MemberCheck
  async toRequest(
    fullName: FullName,
    httpService: HttpService,
    config: ConfigService,
  ): Promise<{}> {
    const inputBody = new InputBody(fullName.firstName, fullName.lastName);

    const { data } = await firstValueFrom(
      httpService
        .post('/member-scans/single', inputBody, {
          baseURL: config.get('BASE_MC_URL'),
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': config.get('API_KEY'),
            'X-Request-OrgId': 'KMX',
          },
        })
        .pipe(
          catchError((error) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );
    return data;
  }

  //generate excel file and return path
  async generateFileSingle(data: any[], body: FullName) {
    const workbook = new Workbook();
    workbook.creator = 'kamix-conformity-service';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Scan_result', {
      headerFooter: { firstHeader: 'SCAN REPORT' },
    });

    sheet.columns = [
      { header: 'First Name', key: 'firstName', width: 24 },
      { header: 'Last Name', key: 'lastName', width: 24 },
      { header: 'Results', key: 'result', width: 36 },
      { header: 'Sanctions', key: 'sanction', width: 68 },
      { header: 'Dates Of Birth', key: 'date', width: 15 },
      { header: 'Match Rates (%)', key: 'matchRate', width: 15 },
      { header: 'View Links', key: 'link', width: 46 },
    ];

    sheet.addRows(data);

    const name = `${body.firstName}-${body.lastName}.xlsx`;
    const fileName = name.replace(/\s/g, '');
    const pathToFile = 'public/' + fileName;

    await fs.unlink(pathToFile, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully deleted the file.');
      }
    });
    await workbook.xlsx.writeFile('public/' + fileName);

    return fileName;
  }

  //generate excel file and return path
  async generateFileMultiple(data: any[], originalFileName: string) {
    const workbook = new Workbook();
    workbook.creator = 'kamix-conformity-service';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Scan_result', {
      headerFooter: { firstHeader: 'SCAN REPORT' },
    });

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'First Name', key: 'firstName', width: 24 },
      { header: 'Last Name', key: 'lastName', width: 24 },
      { header: 'Date Of Birth', key: 'dob', width: 10 },
      { header: 'Results', key: 'result', width: 36 },
      { header: 'Sanctions', key: 'sanction', width: 68 },
      { header: 'Match (%)', key: 'matchRate', width: 15 },
      { header: 'View Links', key: 'link', width: 46 },
    ];

    sheet.addRows(data);

    const fileName = 'scan-results.xlsx';
    const pathToFile = 'public/' + fileName;

    await fs.unlink(pathToFile, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully deleted the file.');
      }
    });

    await workbook.xlsx.writeFile(pathToFile);
    //delete the uploaded file
    const pathToOFile = 'public/' + originalFileName;
    await fs.unlink(pathToOFile, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully deleted the file.');
      }
    });

    return fileName;
  }

  //clean data
  cleanDataSingle(table: any[]) {
    const cleanData = [];
    table.map((elt) => {
      if (elt.results.matchedEntities != null) {
        cleanData.push({
          firstName: elt.firstName,
          lastName: elt.lastName,
          result: elt.results.metadata.message,
          link: elt.results.resultUrl,
          matchRate: elt.results.matchedEntities[0].matchRate + '%',
        });
        for (let i = 0; i < elt.results.matchedEntities.length; i++) {
          const firstName =
            elt.results.matchedEntities[i].resultEntity.primaryFirstName;
          const testmiddleName =
            elt.results.matchedEntities[i].resultEntity.primaryMiddleName;
          let middleName = '';
          if (testmiddleName) middleName = testmiddleName;
          const lastName =
            elt.results.matchedEntities[i].resultEntity.primaryLastName;
          const rate = elt.results.matchedEntities[i].matchRate + '%';
          cleanData.push({
            result: `${
              i + 1
            }. (${rate}) - ${firstName} ${middleName} ${lastName}`,
            sanction: elt.results.matchedEntities[i].resultEntity.categories,
            date: elt.results.matchedEntities[i].resultEntity.dateOfBirth,
          });
        }
      } else {
        cleanData.push({
          firstName: elt.firstName,
          lastName: elt.lastName,
          result: elt.results.metadata.message,
        });
      }
    });

    return cleanData;
  }
    //clean data
  cleanDataMultiple(table: any[]) {
    const cleanData = [];
    table.map((elt) => {
      if (elt instanceof ResponseFileDto && elt.results.matchedEntities != null) {
        cleanData.push({
          id: elt.id,
          firstName: elt.firstName,
          lastName: elt.lastName,
          dob: elt.dateOfBirth,
          result: elt.results.metadata.message,
          link: elt.results.resultUrl,
          matchRate: elt.results.matchedEntities[0].matchRate + '%',
        });
        for (let i = 0; i < elt.results.matchedEntities.length; i++) {

          const firstName =
            elt.results.matchedEntities[i].resultEntity.primaryFirstName;
          const testmiddleName =
            elt.results.matchedEntities[i].resultEntity.primaryMiddleName;
          let middleName = '';
          if (testmiddleName) middleName = testmiddleName;
          const lastName =
            elt.results.matchedEntities[i].resultEntity.primaryLastName;
          const rate = elt.results.matchedEntities[i].matchRate + '%';
          cleanData.push({
            id: "----",
            firstName: "----",
            lastName: "----",
            dob: "----",
            result: `${
              i + 1
            }. (${rate}) - ${firstName} ${middleName} ${lastName}`,
            sanction: elt.results.matchedEntities[i].resultEntity.categories,
            link: "----",
            matchRate: "----",
          });
        }
      } else {
        cleanData.push({
          firstName: elt.firstName,
          lastName: elt.lastName,
          result: elt.results.metadata.message,
        });
      }
    });

    return cleanData;
  }

  //Read excel uploaded file and return their data as array of objects
  async excelToArray(filename: string) {
    const workbook = await xlsx.readFile(
      join(process.cwd(), 'public/' + filename),
    );
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    //transform data into arrays
    const data = xlsx.utils.sheet_to_json(sheet);
    //clean data
    const cleanData = data.filter((value: any) =>{
      if (value.NOM && value.PRENOM) {
        return value;
      }
    })
    //return data as arrays
    return cleanData;
  }

  //send a Request to MemberCheck
  async toRequestMultiple(
    elt: any,
    httpService: HttpService,
    config: ConfigService,
  ): Promise<{}> {
  
    const inputBody = new InputBody(elt.PRENOM, elt.NOM);
    inputBody.memberNumber = elt.ID;
    inputBody.clientId = elt.ID;

    const { data } = await firstValueFrom(
      httpService
        .post('/member-scans/single', inputBody, {
          baseURL: config.get('BASE_MC_URL'),
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': config.get('API_KEY'),
            'X-Request-OrgId': 'KMX',
          },
        })
        .pipe(
          catchError((error) => {
            this.logger.error(error.response.data);
            throw `An error happened! with:`;
          }),
        ),
    );
    return data;
  }

}
