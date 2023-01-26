import { randomUUID } from "crypto";

export class InputBody {
    matchType: string;
    closeMatchRateThreshold: number;
    whitelist: string;
    residence: string;
    blankAddress: string;
    pepJurisdiction: string;
    excludeDeceasedPersons: string;
    memberNumber: string;
    clientId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    address: string;
    includeResultEntities: string;
    updateMonitoringList: string;

    constructor(firstName: string, lastName: string) {
        this.matchType = "Close";
        this.closeMatchRateThreshold = 80;
        this.whitelist = "Apply";
        this.residence = "Ignore";
        this.blankAddress = "ApplyResidenceCountry";
        this.pepJurisdiction = "Apply";
        this.excludeDeceasedPersons = "no";
        this.memberNumber = this.getMemberNumber();
        this.clientId = this.memberNumber;
        this.firstName = firstName;
        // this.middleName = "";
        this.lastName = lastName;
        this.includeResultEntities = "Yes";
        this.updateMonitoringList = "ForceUpdate";

    }

    getMemberNumber() {
        const date = Date.now().toString();
        return "KMX-" + date;
    }
}