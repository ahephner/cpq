import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import OBJ from '@salesforce/schema/Opportunity'
import EOP_PAYTYPE from '@salesforce/schema/Opportunity.EOP_Pay_Type__c';
import BILL_HOLD from '@salesforce/schema/Opportunity.BH_Yes_No__c';
import NUM_PAYMENTS from '@salesforce/schema/Opportunity.Number_of_Payments__c'
//import INV_DATE from '@salesforce/schema/Opportunity.Invoice_Date__c'
import FIRST_DATE from '@salesforce/schema/Opportunity.First_Due_Date__c';
import DISCOUNT_PERCENT from '@salesforce/schema/Opportunity.Discount_Percentage__c';
import EARLY_PAY from '@salesforce/schema/Opportunity.Early_Pay__c';

export default class OppDetailsHeader extends LightningElement{
    @api recordId;
    @api objectApiName;
    @api prop1;
    fields = [EOP_PAYTYPE, FIRST_DATE, NUM_PAYMENTS, BILL_HOLD, DISCOUNT_PERCENT, EARLY_PAY ];
    handleSuccess(){
        console.log('good save!');
        
    }
}