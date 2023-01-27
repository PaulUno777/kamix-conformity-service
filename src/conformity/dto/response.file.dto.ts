export class ResponseFileDto {
  id:string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  results: any;

  constructor(
    id:string,
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    result: Object,
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.dateOfBirth = dateOfBirth;
    this.results = result;
  }
}
