/* eslint-disable prettier/prettier */
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
    const outputNames = names.slice();
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
    const tempArray: Array<string> = [];
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

    const combinedArray = [];

    for (let i = 0; i < firstArray.length; i++) {
      lastArray.forEach((elt) => {
        const fullName = new FullName();
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
  ): Promise<any> {
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
      { header: 'Style', key: 'style', hidden: true },
    ];

    sheet.getRow(1).font = {
      name: 'Calibri',
      family: 4,
      size: 11,
      bold: true,
      color: { argb: 'ffffff' },
    };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3B4B41' },
    };

    sheet.addRows(data);
    //styling the worksheet
    sheet.eachRow((row) => {
      row.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      row.getCell('F').alignment = {
        horizontal: 'right',
      };
      ['D', 'G'].map((key) => {
        row.getCell(key).alignment = {
          horizontal: 'justify',
        };
      });

      if (row.getCell('H').value == 0) {
        ['C', 'D', 'E', 'F'].map((key) => {
          row.getCell(key).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E2EFDA' },
          };
          row.getCell(key).font = {
            color: { argb: '33B050' },
          };
        });
      }
      if (row.getCell('H').value == 1) {
        ['A', 'B', 'G'].map((key) => {
          row.getCell(key).border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            top: { style: 'thin' },
            bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
          };
        });
        ['C', 'D', 'E', 'F'].map((key) => {
          row.getCell(key).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FCE4D6' },
          };
          row.getCell(key).font = {
            color: { argb: 'FF0056' },
          };
          row.getCell(key).border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            top: { style: 'thin' },
            bottom: { style: 'thin', color: { argb: 'FCE4D6' } },
          };
        });
      }
      if (row.getCell('H').value == 3) {
        ['A', 'B', 'G'].map((key) => {
          row.getCell(key).border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            top: { style: 'thin', color: { argb: 'FFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
          };
        });
        ['C', 'D', 'E', 'F'].map((key) => {
          row.getCell(key).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FCE4D6' },
          };
          row.getCell(key).border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            top: { style: 'thin', color: { argb: 'FCE4D6' } },
            bottom: { style: 'thin', color: { argb: 'FCE4D6' } },
          };
        });
      }
      row.commit();
    });

    const name = `${body.firstName}-${body.lastName}.xlsx`;
    const fileName = name.replace(/\s/g, '');
    const pathToFile = './public/' + fileName;

    if (!fs.existsSync('./public/')) {
      fs.mkdirSync('./public/');
    }

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
      { header: 'Date Of Birth', key: 'dob', width: 12 },
      { header: 'Results', key: 'result', width: 36, outlineLevel: 2 },
      { header: 'Sanctions', key: 'sanction', width: 70 },
      { header: 'Match (%)', key: 'matchRate', width: 15 },
      { header: 'View Links', key: 'link', width: 46 },
      { header: 'Style', key: 'style', hidden: true },
    ];

    sheet.getRow(1).font = {
      name: 'Calibri',
      family: 4,
      size: 11,
      bold: true,
    };

    await sheet.addRows(data);

    //styling the worksheet
    sheet.eachRow((row) => {
      row.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      row.getCell('G').alignment = {
        horizontal: 'right',
      };

      if (row.getCell('I').value == 0) {
        ['E', 'F', 'G'].map((key) => {
          row.getCell(key).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E2EFDA' },
          };
          row.getCell(key).font = {
            color: { argb: '33B050' },
          };
        });
      }
      if (row.getCell('I').value == 1) {
        ['A', 'B', 'C', 'D', 'H'].map((key) => {
          row.getCell(key).border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            top: { style: 'thin' },
            bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
          };
        });
        ['E', 'F', 'G'].map((key) => {
          row.getCell(key).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FCE4D6' },
          };
          row.getCell(key).font = {
            color: { argb: 'FF0056' },
          };
          row.getCell(key).border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            top: { style: 'thin' },
            bottom: { style: 'thin', color: { argb: 'FCE4D6' } },
          };
        });
      }
      if (row.getCell('I').value == 3) {
        ['A', 'B', 'C', 'D', 'H'].map((key) => {
          row.getCell(key).border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            top: { style: 'thin', color: { argb: 'FFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
          };
        });

        row.getCell('F').alignment = {
          horizontal: 'distributed',
        };

        ['E', 'F', 'G'].map((key) => {
          row.getCell(key).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FCE4D6' },
          };
          row.getCell(key).border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            top: { style: 'thin', color: { argb: 'FCE4D6' } },
            bottom: { style: 'thin', color: { argb: 'FCE4D6' } },
          };
        });
      }
      row.commit();
    });
    // write the file
    const fileName = 'scan-results.xlsx';
    const publicDir = './public/';
    const pathToFile = publicDir + fileName;

    if (!fs.existsSync('./public/')) {
      fs.mkdirSync('./public/');
    }

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    await fs.unlink(pathToFile, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully deleted the file.');
      }
    });

    await workbook.xlsx.writeFile(pathToFile);
    //delete the uploaded file
    const pathToOFile = publicDir + originalFileName;
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
          style: 1,
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
            style: 3,
            result: `${
              i + 1
            }. (${rate}) - ${firstName} ${middleName} ${lastName}`,
            sanction: elt.results.matchedEntities[i].resultEntity.categories,
            date: elt.results.matchedEntities[i].resultEntity.dateOfBirth,
          });
        }
      } else {
        cleanData.push({
          style: 0,
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
      if (
        elt instanceof ResponseFileDto &&
        elt.results.matchedEntities != null
      ) {
        cleanData.push({
          style: 1,
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
            style: 3,
            result: `${
              i + 1
            }. (${rate}) - ${firstName} ${middleName} ${lastName}`,
            sanction: elt.results.matchedEntities[i].resultEntity.categories,
          });
        }
      } else {
        cleanData.push({
          style: 0,
          id: elt.id,
          firstName: elt.firstName,
          lastName: elt.lastName,
          dob: elt.dateOfBirth,
          result: elt.results.metadata.message,
          matchRate: '0.0%',
        });
      }
    });

    //cleanData.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))

    return cleanData;
  }

  //Read excel uploaded file and return their data as array of objects
  excelToArray(filename: string) {
    const workbook = xlsx.readFile(join(process.cwd(), 'public/' + filename));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    //transform data into arrays
    const data = xlsx.utils.sheet_to_json(sheet);
    const regExp = /[0-9]{3}/;

    //clean data
    const cleanData = data.map((value: any) => {
      const cleaned = value;
      if (value.DNAISS) cleaned.DNAISS = this.formatDate(value.DNAISS);

      if (value.NOM) {
        cleaned.NOM = String(value.NOM).replace(/[^a-zA-Z0-9-_ ]/g, '');
        if (
          regExp.test(value.NOM) ||
          value.NOM.length > 35 ||
          value.NOM.length < 4
        ) {
          delete cleaned.NOM;
        }
      }
      if (value.PRENOM) {
        cleaned.PRENOM = String(value.PRENOM).replace(/[^a-zA-Z0-9-_ ]/g, '');
        if (
          regExp.test(value.PRENOM) ||
          value.PRENOM.length > 35 ||
          value.PRENOM.length < 4
        ) {
          delete cleaned.PRENOM;
        }
      }
      return cleaned;
    });

    const filterData = cleanData.filter((value: any) => {
      return value.PRENOM || value.NOM;
    });

    //return data as arrays
    return filterData;
  }

  //send a Request to MemberCheck
  async toRequestMultiple(
    body: any,
    httpService: HttpService,
    config: ConfigService,
  ): Promise<any> {
    const { data } = await firstValueFrom(
      httpService
        .post('/member-scans/single', body, {
          baseURL: config.get('BASE_MC_URL'),
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': config.get('API_KEY'),
            'X-Request-OrgId': 'KMX',
          }, //log.debug(scanInputParam);
        })
        .pipe(
          catchError((error) => {
            this.logger.error(error);
            console.log(`id --->${body.id}`);
            throw error;
          }),
        ),
    );
    return data;
  }

  formatDate(date: string): string {
    if (date.length <= 4) {
      return date;
    }
    if (date.includes('/') || date.includes('-')) {
      const reg = /[-/\\]/;
      const tempDate = date.split(reg);

      if (date.length <= 7) {
        if (tempDate[0].length < 3) {
          return tempDate[1];
        } else {
          return tempDate[0];
        }
      } else {
        if (tempDate[0].length < 3) {
          if (
            Number(tempDate[0]) <= 28 &&
            Number(tempDate[1]) <= 12 &&
            Number(tempDate[1]) > 0 &&
            Number(tempDate[2]) >= 1900
          ) {
            return `${tempDate[0]}/${tempDate[1]}/${tempDate[2]}`;
          } else {
            return tempDate[2];
          }
        } else {
          if (
            Number(tempDate[0]) <= 28 &&
            Number(tempDate[1]) <= 12 &&
            Number(tempDate[1]) > 0
          ) {
            return `${tempDate[2]}/${tempDate[1]}/${tempDate[0]}`;
          } else {
            return tempDate[0];
          }
        }
      }
    }
  }
}
