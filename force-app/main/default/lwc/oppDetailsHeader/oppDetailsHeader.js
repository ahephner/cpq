import { LightningElement, api } from 'lwc';

import EOP_PAYTYPE from '@salesforce/schema/Opportunity.EOP_Pay_Type__c';
import BILL_HOLD from '@salesforce/schema/Opportunity.BH_Yes_No__c';
import NUM_PAYMENTS from '@salesforce/schema/Opportunity.Number_of_Payments__c'
//import INV_DATE from '@salesforce/schema/Opportunity.Invoice_Date__c'
import FIRST_DATE from '@salesforce/schema/Opportunity.First_Due_Date__c'

export default class OppDetailsHeader extends LightningElement{
    @api recordId;
    @api objectApiName;
    @api prop1;
    fields = [EOP_PAYTYPE, FIRST_DATE, NUM_PAYMENTS, BILL_HOLD ]
    handleSuccess(){
        console.log('good save!');
        
    }
}