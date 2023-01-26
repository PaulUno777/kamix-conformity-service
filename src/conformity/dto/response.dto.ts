export class ResponseDto {
    firstName: string;
    lastName: string;
    results: any;

    constructor(firstName: string, lastName: string, result: Object,) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.results = result;
    }
}