import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Workbook } from 'exceljs';
import { catchError, firstValueFrom } from 'rxjs';
import { FullName } from './dto/fullName.dto';
import { InputBody } from './dto/inputbody.dto';
import * as fs from 'fs';
import * as path from 'path';

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
  async generateFileSingle(data: any[]) {
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

    const fileName = `${data[0].firstName}-${data[0].lastName}.xlsx`;
    const pathToFile = 'public/' + fileName;

    await fs.unlink(pathToFile, function (err) {
      if (err) {
        throw err;
      } else {
        console.log('Successfully deleted the file.');
      }
    });
    //"@nestjs/serve-static": "^3.0.0",
    // await fs.readdir('public', (err, files) => {
    //   if (err) throw err;
    //   for (const file of files) {
    //     fs.unlink(path.join('public', file), (err) => {
    //       if (err) throw err;
    //     });
    //   }
    // });

    await workbook.xlsx.writeFile('public/' + fileName);

    console.log(workbook.created);
  }

  //clean data
  cleanDataSingle(table: any[]) {
    const cleanData = [];
    table.map((elt) => {
      cleanData.push({
        firstName: elt.firstName,
        lastName: elt.lastName,
        result: elt.results.metadata.message,
        link: elt.results.resultUrl,
        matchRate: elt.results.matchedEntities[0].matchRate + '%',
      });
      if (elt.results.matchedEntities.length > 0) {
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
      }
    });

    return cleanData;
  }
}
